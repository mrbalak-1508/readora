import path from "path";
import fs from "fs/promises";
import { existsSync, createReadStream } from "fs";
import crypto from "crypto";

import os from "os";

// Detect Vercel / AWS Lambda / Serverless read-only environment
const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  (process.env.NODE_ENV === "production" && process.cwd().startsWith("/var/task"))
);

// Bundled storage directory (where static seeded books/covers live in repository)
const BUNDLED_STORAGE_ROOT = path.resolve(
  /*turbopackIgnore: true*/ path.join(process.cwd(), "storage")
);

// Writable storage directory:
// On Vercel / AWS Lambda, /var/task is read-only, so runtime uploads MUST be written to /tmp
let writableStorageRoot = IS_SERVERLESS
  ? path.resolve(os.tmpdir(), "readora_storage")
  : BUNDLED_STORAGE_ROOT;

export function getActiveStorageRoot(): string {
  return writableStorageRoot;
}

export function getStorageDirs() {
  return {
    root: writableStorageRoot,
    bundledRoot: BUNDLED_STORAGE_ROOT,
    books: path.join(writableStorageRoot, "books"),
    covers: path.join(writableStorageRoot, "covers"),
    avatars: path.join(writableStorageRoot, "avatars"),
  };
}

// Ensure local storage directories exist safely
export async function ensureStorageDirs() {
  const dirs = getStorageDirs();
  try {
    await fs.mkdir(dirs.books, { recursive: true });
    await fs.mkdir(dirs.covers, { recursive: true });
    await fs.mkdir(dirs.avatars, { recursive: true });
  } catch (err: any) {
    // If writing to process.cwd() failed with EROFS / ENOENT / EACCES (common on serverless / Vercel)
    if (writableStorageRoot !== path.resolve(os.tmpdir(), "readora_storage")) {
      console.warn("Storage root is read-only. Switching writable root to /tmp/readora_storage:", err?.message);
      writableStorageRoot = path.resolve(os.tmpdir(), "readora_storage");
      const fallbackDirs = getStorageDirs();
      await fs.mkdir(fallbackDirs.books, { recursive: true });
      await fs.mkdir(fallbackDirs.covers, { recursive: true });
      await fs.mkdir(fallbackDirs.avatars, { recursive: true });
    } else {
      throw err;
    }
  }
}

export const ALLOWED_BOOK_MIME_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/epub+zip": ".epub",
  "text/plain": ".txt",
};

export const ALLOWED_COVER_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_BOOK_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10MB

export interface ValidatedFile {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  size: number;
  extension: string;
}

export interface StorageFileResult {
  storagePath: string; // e.g. storage/books/xyz.epub
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * StorageProvider Interface
 * Allows clean separation between local filesystem storage and future S3/Cloudflare R2 providers
 */
export interface StorageProvider {
  uploadFile(
    file: ValidatedFile,
    subDir: "books" | "covers" | "avatars"
  ): Promise<StorageFileResult>;
  getFileStream(storagePath: string): Promise<NodeJS.ReadableStream | null>;
  getFileBuffer(storagePath: string): Promise<Buffer | null>;
  deleteFile(storagePath: string): Promise<boolean>;
  resolveUrl(storagePath: string): string;
}

export class LocalStorageProvider implements StorageProvider {
  async uploadFile(
    file: ValidatedFile,
    subDir: "books" | "covers" | "avatars"
  ): Promise<StorageFileResult> {
    await ensureStorageDirs();
    const dirs = getStorageDirs();
    const targetDir = dirs[subDir];
    const uniqueId = crypto.randomUUID();
    const safeFileName = `${uniqueId}${file.extension}`;
    const absolutePath = path.join(targetDir, safeFileName);

    // Path traversal check
    const resolved = path.resolve(/*turbopackIgnore: true*/ absolutePath);
    if (!resolved.startsWith(targetDir)) {
      throw new Error("Security violation: path traversal detected");
    }

    await fs.writeFile(absolutePath, file.buffer);
    const storagePath = `storage/${subDir}/${safeFileName}`;

    return {
      storagePath,
      fileName: safeFileName,
      mimeType: file.mimeType,
      sizeBytes: file.size,
    };
  }

  async getFileStream(storagePath: string): Promise<NodeJS.ReadableStream | null> {
    const absPath = resolveSafeStoragePath(storagePath);
    if (!absPath) return null;
    return createReadStream(/*turbopackIgnore: true*/ absPath);
  }

  async getFileBuffer(storagePath: string): Promise<Buffer | null> {
    const absPath = resolveSafeStoragePath(storagePath);
    if (!absPath) return null;
    return fs.readFile(/*turbopackIgnore: true*/ absPath);
  }

  async deleteFile(storagePath: string): Promise<boolean> {
    const absPath = resolveSafeStoragePath(storagePath);
    if (!absPath) return false;
    try {
      await fs.unlink(absPath);
      return true;
    } catch {
      return false;
    }
  }

  resolveUrl(storagePath: string): string {
    // For protected books, returns the secure streaming endpoint
    return `/api/files/download?path=${encodeURIComponent(storagePath)}`;
  }
}

// Global storage singleton instance
export const storageProvider: StorageProvider = new LocalStorageProvider();

export async function validateAndExtractFile(
  file: File,
  type: "book" | "cover"
): Promise<{ error?: string; file?: ValidatedFile }> {
  const size = file.size;
  const mimeType = file.type.toLowerCase();
  const originalName = file.name;
  const ext = path.extname(originalName).toLowerCase();

  if (type === "book") {
    if (size > MAX_BOOK_SIZE) {
      return { error: `Book file size exceeds 50MB limit (${(size / (1024 * 1024)).toFixed(1)}MB)` };
    }
    const isAllowedMime = !!ALLOWED_BOOK_MIME_TYPES[mimeType];
    const isAllowedExt = ext === ".pdf" || ext === ".epub" || ext === ".txt";
    if (!isAllowedMime && !isAllowedExt) {
      return { error: "Invalid book format. Only PDF, EPUB, and plain text files are supported." };
    }
    const resolvedExt = isAllowedExt ? ext : ALLOWED_BOOK_MIME_TYPES[mimeType];
    const resolvedMime =
      mimeType ||
      (resolvedExt === ".pdf"
        ? "application/pdf"
        : resolvedExt === ".epub"
        ? "application/epub+zip"
        : "text/plain");
    const arrayBuffer = await file.arrayBuffer();
    return {
      file: {
        buffer: Buffer.from(arrayBuffer),
        fileName: path.basename(originalName),
        mimeType: resolvedMime,
        size,
        extension: resolvedExt,
      },
    };
  } else {
    if (size > MAX_COVER_SIZE) {
      return { error: `Cover image size exceeds 10MB limit (${(size / (1024 * 1024)).toFixed(1)}MB)` };
    }
    const isAllowedMime = !!ALLOWED_COVER_MIME_TYPES[mimeType];
    const isAllowedExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    if (!isAllowedMime && !isAllowedExt) {
      return { error: "Invalid cover image format. Only JPG, PNG, and WebP are supported." };
    }
    const resolvedExt = isAllowedExt ? ext : ALLOWED_COVER_MIME_TYPES[mimeType];
    const resolvedMime =
      mimeType ||
      (resolvedExt === ".png"
        ? "image/png"
        : resolvedExt === ".webp"
        ? "image/webp"
        : "image/jpeg");
    const arrayBuffer = await file.arrayBuffer();
    return {
      file: {
        buffer: Buffer.from(arrayBuffer),
        fileName: path.basename(originalName),
        mimeType: resolvedMime,
        size,
        extension: resolvedExt,
      },
    };
  }
}

export async function saveSecureFile(
  validated: ValidatedFile,
  subDir: "books" | "covers"
): Promise<{ relativePath: string; absolutePath: string; safeFileName: string }> {
  await ensureStorageDirs();
  const res = await storageProvider.uploadFile(validated, subDir);
  const dirs = getStorageDirs();
  const absolutePath = path.resolve(
    /*turbopackIgnore: true*/ path.join(dirs[subDir], res.fileName)
  );
  return { relativePath: res.storagePath, absolutePath, safeFileName: res.fileName };
}

export function resolveSafeStoragePath(relativePath: string): string | null {
  if (!relativePath) return null;
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return null;
  }

  // Strip leading slashes and any leading 'storage/' prefix so it is strictly scoped to the storage folder
  const cleanRelative = relativePath
    .replace(/^[/\\]+/, "")
    .replace(/^storage[/\\]+/, "");

  // Prevent directory traversal
  const normalized = path.normalize(cleanRelative);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return null;
  }

  const dirs = getStorageDirs();

  // Search candidate locations in order:
  // 1. Active writable storage root (e.g. /tmp/readora_storage or local storage)
  // 2. Bundled repository storage (e.g. /var/task/storage or local storage)
  // 3. Fallback OS tmp storage if different
  // 4. Public directory fallback
  const candidates = [
    path.resolve(dirs.root, cleanRelative),
    path.resolve(dirs.bundledRoot, cleanRelative),
    path.resolve(os.tmpdir(), "readora_storage", cleanRelative),
    path.resolve(process.cwd(), "public", cleanRelative),
  ];

  for (const candidate of candidates) {
    try {
      if (existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // Ignore filesystem permission errors
    }
  }

  return null;
}

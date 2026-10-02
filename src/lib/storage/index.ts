import path from "path";
import fs from "fs/promises";
import { existsSync, createReadStream } from "fs";
import crypto from "crypto";

const STORAGE_ROOT = path.join(process.cwd(), "storage");
const BOOKS_DIR = path.join(STORAGE_ROOT, "books");
const COVERS_DIR = path.join(STORAGE_ROOT, "covers");
const AVATARS_DIR = path.join(STORAGE_ROOT, "avatars");

// Ensure local storage directories exist
export async function ensureStorageDirs() {
  await fs.mkdir(BOOKS_DIR, { recursive: true });
  await fs.mkdir(COVERS_DIR, { recursive: true });
  await fs.mkdir(AVATARS_DIR, { recursive: true });
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
    const targetDir =
      subDir === "books" ? BOOKS_DIR : subDir === "covers" ? COVERS_DIR : AVATARS_DIR;
    const uniqueId = crypto.randomUUID();
    const safeFileName = `${uniqueId}${file.extension}`;
    const absolutePath = path.join(targetDir, safeFileName);

    // Path traversal check
    const resolved = path.resolve(absolutePath);
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
    return createReadStream(absPath);
  }

  async getFileBuffer(storagePath: string): Promise<Buffer | null> {
    const absPath = resolveSafeStoragePath(storagePath);
    if (!absPath) return null;
    return fs.readFile(absPath);
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
  const absolutePath = path.resolve(process.cwd(), res.storagePath);
  return { relativePath: res.storagePath, absolutePath, safeFileName: res.fileName };
}

export function resolveSafeStoragePath(relativePath: string): string | null {
  const cleanRelative = relativePath.replace(/^[/\\]+/, "");
  const absolutePath = path.resolve(process.cwd(), cleanRelative);

  // Path traversal prevention: MUST be inside STORAGE_ROOT
  if (!absolutePath.startsWith(STORAGE_ROOT)) {
    return null;
  }

  if (!existsSync(absolutePath)) {
    return null;
  }

  return absolutePath;
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { resolveSafeStoragePath, getStorageDirs } from "@/lib/storage";
import fs from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

async function getDirSize(dirPath: string): Promise<{ size: number; count: number }> {
  let size = 0;
  let count = 0;
  try {
    if (!existsSync(dirPath)) return { size: 0, count: 0 };
    const files = await fs.readdir(dirPath);
    for (const f of files) {
      if (f === ".gitkeep") continue;
      const fullPath = path.join(dirPath, f);
      try {
        const s = statSync(fullPath);
        if (s.isFile()) {
          size += s.size;
          count += 1;
        }
      } catch {}
    }
  } catch {}
  return { size, count };
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const startTime = Date.now();

    // 1. Database Check
    const [booksCount, usersCount, chaptersCount, assetsCount, versionsCount, uploadJobsCount] =
      await Promise.all([
        prisma.book.count(),
        prisma.user.count(),
        prisma.chapter.count(),
        prisma.bookAsset.count(),
        prisma.bookVersion.count(),
        prisma.uploadJob.count(),
      ]);

    const dbLatencyMs = Date.now() - startTime;

    // Check dev.db file size
    const devDbPath = path.resolve(process.cwd(), "prisma", "dev.db");
    let devDbSize = 0;
    if (existsSync(devDbPath)) {
      devDbSize = statSync(devDbPath).size;
    }

    // 2. Storage System Inspection
    const dirs = getStorageDirs();

    const [booksRuntime, coversRuntime, avatarsRuntime, booksBundled, coversBundled] = await Promise.all([
      getDirSize(dirs.books),
      getDirSize(dirs.covers),
      getDirSize(dirs.avatars),
      dirs.root !== dirs.bundledRoot ? getDirSize(path.join(dirs.bundledRoot, "books")) : Promise.resolve({ size: 0, count: 0 }),
      dirs.root !== dirs.bundledRoot ? getDirSize(path.join(dirs.bundledRoot, "covers")) : Promise.resolve({ size: 0, count: 0 }),
    ]);

    const booksStats = {
      size: booksRuntime.size + booksBundled.size,
      count: booksRuntime.count + booksBundled.count,
    };
    const coversStats = {
      size: coversRuntime.size + coversBundled.size,
      count: coversRuntime.count + coversBundled.count,
    };
    const avatarsStats = avatarsRuntime;

    // 3. File Integrity Audit: Verify if all books with filePath exist in storage
    const allBooks = await prisma.book.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        filePath: true,
        fileName: true,
        format: true,
      },
    });

    const fileAudit: Array<{
      bookId: string;
      title: string;
      filePath: string | null;
      status: "EXISTS" | "MISSING" | "NO_FILE";
    }> = [];

    let missingFilesCount = 0;

    for (const b of allBooks) {
      if (!b.filePath) {
        fileAudit.push({
          bookId: b.id,
          title: b.title,
          filePath: null,
          status: "NO_FILE",
        });
      } else {
        const resolved = resolveSafeStoragePath(b.filePath);
        if (resolved && existsSync(resolved)) {
          fileAudit.push({
            bookId: b.id,
            title: b.title,
            filePath: b.filePath,
            status: "EXISTS",
          });
        } else {
          missingFilesCount++;
          fileAudit.push({
            bookId: b.id,
            title: b.title,
            filePath: b.filePath,
            status: "MISSING",
          });
        }
      }
    }

    // 4. Memory & Runtime Telemetry
    const memory = process.memoryUsage();

    return NextResponse.json({
      status: missingFilesCount > 0 ? "WARNING" : "HEALTHY",
      database: {
        provider: "SQLite (Prisma ORM)",
        file: "prisma/dev.db",
        sizeBytes: devDbSize,
        sizeMb: (devDbSize / (1024 * 1024)).toFixed(2),
        latencyMs: dbLatencyMs,
        tables: {
          books: booksCount,
          users: usersCount,
          chapters: chaptersCount,
          assets: assetsCount,
          versions: versionsCount,
          uploadJobs: uploadJobsCount,
        },
      },
      storage: {
        provider: "Local Isolated Object Storage",
        totalSizeBytes: booksStats.size + coversStats.size + avatarsStats.size,
        totalSizeMb: ((booksStats.size + coversStats.size + avatarsStats.size) / (1024 * 1024)).toFixed(2),
        books: {
          path: "storage/books",
          filesCount: booksStats.count,
          sizeMb: (booksStats.size / (1024 * 1024)).toFixed(2),
        },
        covers: {
          path: "storage/covers",
          filesCount: coversStats.count,
          sizeMb: (coversStats.size / (1024 * 1024)).toFixed(2),
        },
        avatars: {
          path: "storage/avatars",
          filesCount: avatarsStats.count,
          sizeMb: (avatarsStats.size / (1024 * 1024)).toFixed(2),
        },
      },
      integrity: {
        totalBooks: allBooks.length,
        missingFilesCount,
        audit: fileAudit,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.round(process.uptime()),
        rssMb: (memory.rss / (1024 * 1024)).toFixed(1),
        heapUsedMb: (memory.heapUsed / (1024 * 1024)).toFixed(1),
      },
    });
  } catch (error: any) {
    console.error("Health check error:", error);
    return NextResponse.json({ error: error.message || "Failed health check" }, { status: 500 });
  }
}

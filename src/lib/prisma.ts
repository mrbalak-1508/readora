import { PrismaClient } from "@prisma/client";
import path from "path";

// Ensure DATABASE_URL consistently resolves to prisma/dev.db
const absoluteDbPath = path.resolve(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === "file:./dev.db") {
  process.env.DATABASE_URL = `file:${absoluteDbPath}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// If in-memory client was cached before newer schema models were added, reset it
if (
  globalForPrisma.prisma &&
  (!(globalForPrisma.prisma as any).uploadJob ||
    !(globalForPrisma.prisma as any).bookAsset ||
    !(globalForPrisma.prisma as any).bookVersion)
) {
  try {
    globalForPrisma.prisma.$disconnect().catch(() => {});
  } catch {}
  globalForPrisma.prisma = undefined;
}

// Instantiate with the latest generated schema models
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

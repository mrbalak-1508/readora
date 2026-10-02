import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_URL ||
    process.env.PRISMA_DATABASE_URL ||
    "postgres://c518e00a2aba309db7a04f1018c8460ce8a28e5178d28452ea92de6a150ba173:sk_Fw3XMl1KEuJuJQCdv2Aov@db.prisma.io:5432/postgres?sslmode=require";
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

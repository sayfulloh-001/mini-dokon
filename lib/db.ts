import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
  const resolved =
    process.env.STORAGE_URL ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.STORAGE_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.STORAGE_POSTGRES_URL;
  if (resolved) {
    process.env.DATABASE_URL = resolved;
  }
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

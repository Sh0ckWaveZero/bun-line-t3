
import { PrismaClient } from '../../prisma/generated/prisma';
import { env } from "~/env.mjs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.APP_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.APP_ENV !== "production") globalForPrisma.prisma = db;

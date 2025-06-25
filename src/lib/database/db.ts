import { PrismaClient } from "@prisma/client";

// Add error handling for Prisma connection
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Test database connection
db.$connect()
  .then(() => {
    console.log("Successfully connected to database");
  })
  .catch((e) => {
    console.error("Error connecting to database:", e);
    process.exit(1);
  });

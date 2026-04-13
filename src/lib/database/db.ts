import { PrismaClient } from "@prisma/client";

// Add error handling for Prisma connection
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createClient = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

/**
 * ตรวจสอบว่า cached instance มี model ครบหรือไม่
 * ป้องกัน "Cannot read properties of undefined" หลัง schema เปลี่ยน
 * โดยที่ dev server ยังไม่ถูก restart
 */
const isCacheStale = (client: PrismaClient): boolean => {
  try {
    // ตรวจสอบ model ล่าสุดที่เพิ่มเข้ามา — ถ้าไม่มีแสดงว่า client เก่า
    return !("lineApprovalRequest" in client) || !("subscription" in client);
  } catch {
    return true;
  }
};

const cached = globalForPrisma.prisma;
export const db =
  cached && !isCacheStale(cached) ? cached : createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Test database connection
db.$connect()
  .then(() => {
    // Connected successfully
  })
  .catch((e: unknown) => {
    console.error("Error connecting to database:", e);
    process.exit(1);
  });

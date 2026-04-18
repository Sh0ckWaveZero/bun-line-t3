import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any | undefined;
  prismaUrl: string | undefined;
};

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const createClient = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  const base = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  // Intercept session.create to handle duplicate token errors (P2002).
  // better-auth can generate the same session token when the LINE OAuth
  // callback is retried (e.g. Cloudflare Tunnel retry). The unique index
  // on `sessions.token` rejects the second insert — use upsert instead of
  // delete+retry to avoid race conditions.
  return base.$extends({
    query: {
      session: {
        async create({ args, query }) {
          const token = (args.data as Record<string, unknown>)?.token;
          if (typeof token !== "string") {
            return await query(args);
          }

          const data = args.data as Prisma.SessionCreateInput;
          const update = {
            expiresAt: data.expiresAt,
            updatedAt: new Date(),
            // Keep other fields (userId, ipAddress, userAgent) unchanged
          };

          try {
            return await (base as PrismaClient).session.upsert({
              where: { token },
              create: data,
              update,
            });
          } catch (error) {
            if (!isUniqueConstraintError(error)) {
              throw error;
            }

            const existingSession = await (base as PrismaClient).session.findUnique({
              where: { token },
            });

            if (!existingSession) {
              throw error;
            }

            return await (base as PrismaClient).session.update({
              where: { token },
              data: update,
            });
          }
        },
      },
    },
  });
};

/**
 * ตรวจสอบว่า cached instance มี model ครบหรือไม่
 * หรือ DATABASE_URL เปลี่ยนไปหลังจาก cache ถูกสร้าง
 * ป้องกัน "Cannot read properties of undefined" หลัง schema เปลี่ยน
 * โดยที่ dev server ยังไม่ถูก restart
 */
const isCacheStale = (client: PrismaClient): boolean => {
  try {
    // ตรวจสอบว่า DATABASE_URL เปลี่ยนหรือเปล่า (เช่น แก้ .env.local แล้ว HMR reload)
    if (globalForPrisma.prismaUrl !== process.env.DATABASE_URL) return true;
    return !("lineApprovalRequest" in client) || !("subscription" in client) || !("workAttendance" in client);
  } catch {
    return true;
  }
};

const cached = globalForPrisma.prisma;
export const db =
  cached && !isCacheStale(cached) ? cached : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaUrl = process.env.DATABASE_URL;
}

// Test database connection
db.$connect()
  .then(() => {
    // Connected successfully
  })
  .catch((e: unknown) => {
    console.error("Error connecting to database:", e);
    process.exit(1);
  });

import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any | undefined;
};

const createClient = () => {
  const base = new PrismaClient({
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

          // Use upsert to handle duplicate tokens atomically
          // - If token exists: update with new data (extendsAt, updatedAt, etc.)
          // - If token doesn't exist: insert new session
          return await (base as PrismaClient).session.upsert({
            where: { token },
            create: args.data as Prisma.SessionCreateInput,
            update: {
              expiresAt: (args.data as Prisma.SessionCreateInput).expiresAt,
              updatedAt: new Date(),
              // Keep other fields (userId, ipAddress, userAgent) unchanged
            },
          });
        },
      },
    },
  });
};

/**
 * ตรวจสอบว่า cached instance มี model ครบหรือไม่
 * ป้องกัน "Cannot read properties of undefined" หลัง schema เปลี่ยน
 * โดยที่ dev server ยังไม่ถูก restart
 */
const isCacheStale = (client: PrismaClient): boolean => {
  try {
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

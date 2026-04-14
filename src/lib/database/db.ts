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
  // on `sessions.token` rejects the second insert — delete the stale
  // record and retry so the caller gets a valid session instead of a 500.
  return base.$extends({
    query: {
      session: {
        async create({ args, query }) {
          try {
            return await query(args);
          } catch (e: unknown) {
            const token = (args.data as Record<string, unknown>)?.token;
            if (
              e instanceof Prisma.PrismaClientKnownRequestError &&
              e.code === "P2002" &&
              typeof token === "string"
            ) {
              await base.session.deleteMany({ where: { token } }).catch(() => {});
              return await query(args);
            }
            throw e;
          }
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


// import { PrismaClient } from '@prisma/client/edge';
// import { env } from "~/env.mjs";

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

// export const db =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log:
//       env.APP_ENV === "development" ? ["query", "error", "warn"] : ["error"],
//   });

// if (env.APP_ENV !== "production") globalForPrisma.prisma = db;


import { PrismaClient } from '@prisma/client'
import { env } from "~/env.mjs";

const prismaClientSingleton = () => {
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const db = globalForPrisma.prisma ?? prismaClientSingleton()

if (env.APP_ENV !== 'production') globalForPrisma.prisma = db
import type { Prisma } from "@prisma/client";

// All DCA writers share this transaction lock before allocating a user round.
export const lockDcaOwner = async (
  tx: Pick<Prisma.TransactionClient, "$executeRaw">,
  lineUserId: string,
) => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lineUserId}))`;
};

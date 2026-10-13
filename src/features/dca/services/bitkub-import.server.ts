import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/database/db";
import { dcaService } from "./dca.service.server";
import { lockDcaOwner } from "./dca-lock.server";
import type { BitkubImportOutcome } from "@/features/exchanges/types/bitkub";

export const bitkubImportSchema = z.strictObject({
  buyIds: z.array(z.string().min(1).max(100)).min(1).max(100),
});

export const importBitkubBuys = async (
  userId: string,
  buyIds: string[],
): Promise<BitkubImportOutcome[]> => {
  const ids = [...new Set(bitkubImportSchema.parse({ buyIds }).buyIds)];
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          // Resolve LINE identity here, only when writing DCA. No client owner IDs are accepted.
          const account = await tx.account.findFirst({
            where: { userId, providerId: "line" },
            orderBy: { updatedAt: "desc" },
            select: { accountId: true },
          });
          if (!account?.accountId)
            throw new Error("A LINE account is required to import DCA");
          const lineUserId = account.accountId;
          await lockDcaOwner(tx, lineUserId);
          const buys = await tx.bitkubBtcBuy.findMany({
            where: { userId, id: { in: ids } },
            orderBy: [{ executedAt: "asc" }, { id: "asc" }],
            include: { dcaOrder: { select: { id: true } } },
          });
          if (buys.length !== ids.length)
            throw new Error("Selected Bitkub buys are unavailable");
          const latest = await tx.dcaOrder.findFirst({
            where: { lineUserId, coin: "BTC" },
            orderBy: { round: "desc" },
            select: { round: true },
          });
          let round = latest?.round ?? 0;
          const legacyOrders = await tx.dcaOrder.findMany({
            where: {
              lineUserId,
              coin: "BTC",
              bitkubBuyId: null,
              executedAt: { in: buys.map((buy) => buy.executedAt) },
            },
            select: { executedAt: true },
          });
          const legacyTimes = new Set(
            legacyOrders.map((order) => order.executedAt.toISOString()),
          );
          const records: Prisma.DcaOrderCreateManyInput[] = [];
          const outcomes: BitkubImportOutcome[] = [];
          for (const buy of buys) {
            if (buy.dcaOrder) {
              outcomes.push({ buyId: buy.id, status: "already_imported" });
              continue;
            }
            if (legacyTimes.has(buy.executedAt.toISOString())) {
              outcomes.push({ buyId: buy.id, status: "legacy_conflict" });
              continue;
            }
            const amountTHB = buy.spentTHB.toNumber();
            const coinReceived = buy.receivedBTC.toNumber();
            const pricePerCoin = buy.spentTHB.div(buy.receivedBTC).toNumber();
            if (
              [amountTHB, coinReceived, pricePerCoin].some(
                (value) => !Number.isFinite(value) || value <= 0,
              )
            )
              throw new Error("Invalid cached Bitkub accounting values");
            round++;
            records.push({
              lineUserId,
              coin: "BTC",
              amountTHB,
              coinReceived,
              pricePerCoin,
              executedAt: buy.executedAt,
              round,
              orderId: dcaService.generateOrderId("BTC", round),
              status: "SUCCESS",
              bitkubBuyId: buy.id,
              deduplicationKey: `bitkub:${buy.id}`,
            });
            outcomes.push({ buyId: buy.id, status: "imported" });
          }
          if (records.length > 0)
            await tx.dcaOrder.createMany({ data: records });
          return outcomes;
        },
        { isolationLevel: "Serializable", timeout: 20_000 },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034", "P2002"].includes(error.code) &&
        attempt < 4
      )
        continue;
      throw error;
    }
  }
  throw new Error("Bitkub import retry exhausted");
};

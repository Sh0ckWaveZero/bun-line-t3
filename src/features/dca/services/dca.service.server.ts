import {
  parseBitkubDcaMessage,
  parsedDcaSchema,
} from "../helpers/parse-bitkub-dca";
import { z } from "zod";
import { lockDcaOwner } from "./dca-lock.server";
import { db } from "@/lib/database/db";
import type { DcaOrder, Prisma } from "@prisma/client";
import type {
  CreateDcaOrderInput,
  DcaOrderListParams,
  DcaOrderListResult,
  CreateLineDcaOrderResult,
} from "../types";

/**
 * สร้าง orderId รูปแบบ {COIN}DCA{padded 10 digit}
 * เช่น BTCDCA0000004700
 *
 * note: orderId อาจจะไม่ unique ระดับระบบ (ระหว่าง users ได้)
 * แต่ id (Prisma cuid) จะเป็น unique ตัวจริง
 */
const generateOrderId = (coin: string, round: number): string => {
  const paddedRound = round.toString().padStart(10, "0");
  return `${coin.toUpperCase()}DCA${paddedRound}`;
};

const normalizeLineUserIds = (
  lineUserIds: string | string[] | undefined,
): string[] =>
  Array.from(
    new Set(
      (Array.isArray(lineUserIds) ? lineUserIds : [lineUserIds])
        .map((lineUserId) => lineUserId?.trim())
        .filter((lineUserId): lineUserId is string => Boolean(lineUserId)),
    ),
  );

const applyLineUserFilter = (
  where: Prisma.DcaOrderWhereInput,
  lineUserIds: string | string[] | undefined,
) => {
  const normalizedIds = normalizeLineUserIds(lineUserIds);

  if (normalizedIds.length === 1) {
    where.lineUserId = normalizedIds[0];
    return;
  }

  if (normalizedIds.length > 1) {
    where.lineUserId = { in: normalizedIds };
  }
};

/**
 * ดึงรอบถัดไปสำหรับ user และเหรียญที่ระบุ (นับแยกตาม lineUserId ของ channel นี้เท่านั้น)
 */
const getNextRound = async (
  coin: string,
  lineUserId: string,
): Promise<number> => {
  const latest = await db.dcaOrder.findFirst({
    where: { coin: coin.toUpperCase(), lineUserId },
    orderBy: { round: "desc" },
    select: { round: true },
  });
  return (latest?.round ?? 0) + 1;
};

/**
 * สร้าง DCA order ใหม่
 */
const createOrder = async (input: CreateDcaOrderInput) => {
  const result = await createLineOrder(input);
  if (result.status === "created") return result.order;
  throw new Error("DCA order already exists");
};

const createLineOrder = async (
  input: CreateDcaOrderInput,
  webhookEventId?: string,
): Promise<CreateLineDcaOrderResult> => {
  parsedDcaSchema.parse(input);
  z.string().trim().min(1).parse(input.lineUserId);
  if (webhookEventId !== undefined)
    z.string().trim().min(1).parse(webhookEventId);
  const coin = input.coin.toUpperCase();
  const where = {
    lineUserId_deduplicationKey: {
      lineUserId: input.lineUserId,
      deduplicationKey: `legacy:${coin}:${input.executedAt.toISOString()}`,
    },
  };
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          await lockDcaOwner(tx, input.lineUserId);
          if (webhookEventId) {
            const receipt = await tx.dcaWebhookReceipt.findUnique({
              where: { webhookEventId },
            });
            if (receipt) return { status: "replayed" };
            await tx.dcaWebhookReceipt.create({
              data: { webhookEventId, lineUserId: input.lineUserId },
            });
          }
          const duplicate = await tx.dcaOrder.findFirst({
            where: {
              lineUserId: input.lineUserId,
              coin,
              executedAt: input.executedAt,
            },
          });
          if (duplicate) return { status: "duplicate", order: duplicate };
          const latest = await tx.dcaOrder.findFirst({
            where: { lineUserId: input.lineUserId, coin },
            orderBy: { round: "desc" },
            select: { round: true },
          });
          const round = (latest?.round ?? 0) + 1;
          const order = await tx.dcaOrder.create({
            data: {
              ...input,
              deduplicationKey:
                where.lineUserId_deduplicationKey.deduplicationKey,
              coin,
              round,
              orderId: generateOrderId(coin, round),
            },
          });
          return { status: "created", order };
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        (("code" in error && error.code === "P2034") ||
          ("cause" in error &&
            typeof error.cause === "object" &&
            error.cause !== null &&
            "kind" in error.cause &&
            error.cause.kind === "TransactionWriteConflict" &&
            "originalCode" in error.cause &&
            (error.cause.originalCode === "40001" ||
              error.cause.originalCode === "40P01"))) &&
        attempt < 4
      )
        continue;
      if (!(
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ))
        throw error;
      const receipt = webhookEventId
        ? await db.dcaWebhookReceipt.findUnique({ where: { webhookEventId } })
        : null;
      if (receipt) return { status: "replayed" };
      const duplicate = await db.dcaOrder.findUnique({ where });
      if (!duplicate || attempt === 4) throw error;
    }
  }
  throw new Error("DCA ingestion retry exhausted");
};

/**
 * ดึงรายการ DCA orders พร้อม pagination
 */
const listOrders = async (
  params: DcaOrderListParams,
): Promise<DcaOrderListResult> => {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 10));
  const skip = (page - 1) * limit;

  const where: Prisma.DcaOrderWhereInput = {};
  if (params.coin) where.coin = params.coin.toUpperCase();
  applyLineUserFilter(where, params.lineUserId);

  const [orders, total] = await Promise.all([
    db.dcaOrder.findMany({
      where,
      orderBy: { executedAt: "desc" },
      skip,
      take: limit,
    }),
    db.dcaOrder.count({ where }),
  ]);

  return {
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * ดึง DCA order ด้วย ID
 */
const getOrderById = async (id: string) => {
  return db.dcaOrder.findUnique({ where: { id } });
};

/**
 * ดึง DCA order ด้วย round number (scope ตาม lineUserId เสมอ)
 */
const findByRound = async (round: number, lineUserId: string) => {
  return db.dcaOrder.findFirst({ where: { round, lineUserId } });
};

/**
 * ดึง DCA orders หลายรอบพร้อมกัน (ใช้สำหรับ multi-delete)
 */
const findByRounds = async (rounds: number[], lineUserId: string) => {
  return db.dcaOrder.findMany({
    where: { round: { in: rounds }, lineUserId },
    orderBy: { round: "asc" },
  });
};

/**
 * ตรวจหา orders ที่ซ้ำกัน (ใช้ก่อน import)
 * key = lineUserId + coin + executedAt
 */
const findDuplicates = async (
  lineUserIds: string | string[],
  candidates: { coin: string; executedAt: Date }[],
) => {
  if (candidates.length === 0) return [];
  const where: Prisma.DcaOrderWhereInput = {
    OR: candidates.map((c) => ({
      coin: c.coin,
      executedAt: c.executedAt,
    })),
  };
  applyLineUserFilter(where, lineUserIds);

  return db.dcaOrder.findMany({
    where,
    select: { coin: true, executedAt: true },
  });
};

/**
 * ลบ DCA order
 */
const deleteOrder = async (id: string) => {
  return db.dcaOrder.delete({ where: { id } });
};

/**
 * ดึง DCA orders ทั้งหมดของ user โดยไม่มี pagination (ใช้สำหรับ export)
 */
const listAllOrders = async (lineUserIds: string | string[]) => {
  const where: Prisma.DcaOrderWhereInput = {};
  applyLineUserFilter(where, lineUserIds);

  return db.dcaOrder.findMany({
    where,
    orderBy: { executedAt: "desc" },
  });
};

/**
 * สรุปยอดรวมทั้งหมด
 */
const getSummary = async (lineUserIds: string | string[]) => {
  const normalizedIds = normalizeLineUserIds(lineUserIds);
  if (normalizedIds.length === 0) {
    return { totalSpentTHB: 0, totalBTC: 0, totalRounds: 0 };
  }

  const where: Prisma.DcaOrderWhereInput = {};
  applyLineUserFilter(where, normalizedIds);

  const orders = (await db.dcaOrder.findMany({
    where,
    select: {
      amountTHB: true,
      coinReceived: true,
      pricePerCoin: true,
      coin: true,
    },
  })) as Pick<
    DcaOrder,
    "amountTHB" | "coinReceived" | "pricePerCoin" | "coin"
  >[];

  const totalSpentTHB = orders.reduce(
    (sum: number, order) => sum + order.amountTHB,
    0,
  );
  const totalBTC = orders
    .filter((order) => order.coin === "BTC")
    .reduce((sum: number, order) => sum + order.coinReceived, 0);
  const totalRounds = orders.length;

  return { totalSpentTHB, totalBTC, totalRounds };
};

export const dcaService = {
  createOrder,
  createLineOrder,
  listOrders,
  listAllOrders,
  getOrderById,
  findByRound,
  findByRounds,
  findDuplicates,
  deleteOrder,
  parseBitkubDcaMessage,
  getSummary,
  generateOrderId,
  getNextRound,
};

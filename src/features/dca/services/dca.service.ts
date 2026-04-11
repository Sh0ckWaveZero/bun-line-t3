import { db } from "@/lib/database/db";
import type {
  CreateDcaOrderInput,
  DcaOrderListParams,
  DcaOrderListResult,
  ParsedBitkubDcaMessage,
} from "../types";

/**
 * สร้าง orderId รูปแบบ {COIN}DCA{padded 10 digit}
 * เช่น BTCDCA0000004700
 *
 * note: orderId อาจจะไม่ unique ระดับระบบ (ระหว่าง users ได้)
 * แต่ id (ObjectId) จะเป็น unique ตัวจริง
 */
const generateOrderId = (coin: string, round: number): string => {
  const paddedRound = round.toString().padStart(10, "0");
  return `${coin.toUpperCase()}DCA${paddedRound}`;
};

/**
 * ดึงรอบถัดไปสำหรับเหรียญและ user ที่ระบุ
 * คำนวณจากจำนวนรายการทั้งหมดของเหรียญและ user นั้น รองรับการ import ข้อมูลย้อนหลัง
 */
const getNextRound = async (coin: string, lineUserId: string): Promise<number> => {
  // นับจำนวนรายการทั้งหมดของเหรียญและ user นั้น เพื่อรองรับการ import ข้อมูลย้อนหลัง
  const count = await db.dcaOrder.count({
    where: {
      coin: coin.toUpperCase(),
      lineUserId,
    },
  });
  return count + 1;
};

/**
 * สร้าง DCA order ใหม่
 */
const createOrder = async (input: CreateDcaOrderInput) => {
  const coin = input.coin.toUpperCase();
  const round = await getNextRound(coin, input.lineUserId);
  const orderId = generateOrderId(coin, round);

  return db.dcaOrder.create({
    data: {
      orderId,
      lineUserId: input.lineUserId,
      coin,
      amountTHB: input.amountTHB,
      coinReceived: input.coinReceived,
      pricePerCoin: input.pricePerCoin,
      round,
      status: input.status ?? "SUCCESS",
      note: input.note ?? null,
      executedAt: input.executedAt,
    },
  });
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

  const where: Record<string, unknown> = {};
  if (params.coin) where.coin = params.coin.toUpperCase();
  if (params.lineUserId) where.lineUserId = params.lineUserId;

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
 * ดึง DCA order ด้วย round number
 */
const findByRound = async (round: number) => {
  return db.dcaOrder.findFirst({ where: { round } });
};

/**
 * ลบ DCA order
 */
const deleteOrder = async (id: string) => {
  return db.dcaOrder.delete({ where: { id } });
};

/**
 * ตรวจสอบว่า message จาก LINE เป็น Bitkub Auto DCA format หรือไม่
 *
 * รูปแบบ:
 * 🥳🎉 You Spent : 107.99 THB
 * Price : 2330307.8 THB/BTC
 * You Received : 0.00004634 BTC
 * Time : 2026-04-11T08:00:14.663+07:00
 */
const parseBitkubDcaMessage = (
  message: string,
): ParsedBitkubDcaMessage | null => {
  // Strip emoji และ special unicode characters ก่อน parse
  // เพื่อ handle กรณีที่มี emoji prefix จาก Bitkub
  let cleanMessage = message.replace(
    /(?:[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]|\u{FE0F})/gu,
    "",
  );

  // Normalize whitespace and newlines - จัดการ invisible characters จาก LINE
  cleanMessage = cleanMessage
    .replace(/[\r\n]+/g, "\n") // Normalize line endings
    .replace(/[^\S\r\n]+/g, " ") // Replace all whitespace (except newlines) with single space
    .trim();

  // ตรวจสอบว่ามี keyword หลักครบ
  if (
    !cleanMessage.includes("You Spent") ||
    !cleanMessage.includes("Price") ||
    !cleanMessage.includes("You Received") ||
    !cleanMessage.includes("Time")
  ) {
    return null;
  }

  try {
    // Parse จำนวนเงิน THB: "You Spent : 107.99 THB"
    const spentMatch = cleanMessage.match(
      /You Spent\s*:\s*([\d,]+(?:\.\d+)?)\s*THB/i,
    );
    if (!spentMatch?.[1]) return null;
    const amountTHB = parseFloat(spentMatch[1].replace(/,/g, ""));

    // Parse ราคาและเหรียญ: "Price : 2330307.8 THB/BTC"
    const priceMatch = cleanMessage.match(
      /Price\s*:\s*([\d,]+(?:\.\d+)?)\s*THB\/(\w+)/i,
    );
    if (!priceMatch?.[1] || !priceMatch?.[2]) return null;
    const pricePerCoin = parseFloat(priceMatch[1].replace(/,/g, ""));
    const coin = priceMatch[2].toUpperCase();

    // Parse จำนวนเหรียญที่ได้รับ: "You Received : 0.00004634 BTC"
    const receivedMatch = cleanMessage.match(
      /You Received\s*:\s*([\d.]+(?:e[+-]?\d+)?)\s*\w+/i,
    );
    if (!receivedMatch?.[1]) return null;
    const coinReceived = parseFloat(receivedMatch[1]);

    // Parse เวลา: รองรับทั้ง ISO format และ simple format
    // "Time : 2026-04-11T08:00:14.663+07:00" หรือ "Time : 2025-12-19 07:34:28"
    const timeMatch = cleanMessage.match(
      /Time\s*:\s*(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:\d{2})?)/,
    );
    if (!timeMatch?.[1]) return null;

    // แปลง string เป็น Date
    let executedAt: Date;
    const timeStr = timeMatch[1];

    if (timeStr.includes("+") || timeStr.includes("Z")) {
      // ISO format ที่มี timezone
      executedAt = new Date(timeStr);
    } else {
      // Simple format "2025-12-19 07:34:28" หรือ "2025-12-19T07:34:28"
      // ให้ถือว่าเป็นเวลา Bangkok (07:34 ไม่ใช่ UTC)
      const [datePart, timePart] = timeStr.includes("T")
        ? timeStr.split("T")
        : timeStr.split(" ");
      if (!datePart || !timePart) return null;

      const [year, month, day] = datePart.split("-").map(Number);
      const timePartOnly = timePart.split(".")[0]; // ลบ milliseconds ถ้ามี
      if (!year || !month || !day || !timePartOnly) return null;

      const [hour, minute, second] = timePartOnly.split(":").map(Number);
      if (hour === undefined || minute === undefined || second === undefined) {
        return null;
      }

      executedAt = new Date(year, month - 1, day, hour, minute, second);
    }

    if (
      isNaN(amountTHB) ||
      isNaN(pricePerCoin) ||
      isNaN(coinReceived) ||
      isNaN(executedAt.getTime())
    ) {
      return null;
    }

    return { coin, amountTHB, pricePerCoin, coinReceived, executedAt };
  } catch {
    return null;
  }
};

/**
 * สรุปยอดรวมทั้งหมด
 */
const getSummary = async (lineUserId?: string) => {
  const where: Record<string, unknown> = {};
  if (lineUserId) where.lineUserId = lineUserId;

  const orders = await db.dcaOrder.findMany({
    where,
    select: {
      amountTHB: true,
      coinReceived: true,
      pricePerCoin: true,
      coin: true,
    },
  });

  const totalSpentTHB = orders.reduce((sum, o) => sum + o.amountTHB, 0);
  const totalBTC = orders
    .filter((o) => o.coin === "BTC")
    .reduce((sum, o) => sum + o.coinReceived, 0);
  const totalRounds = orders.length;

  return { totalSpentTHB, totalBTC, totalRounds };
};

export const dcaService = {
  createOrder,
  listOrders,
  getOrderById,
  findByRound,
  deleteOrder,
  parseBitkubDcaMessage,
  getSummary,
  generateOrderId,
  getNextRound,
};

import { dcaService } from "@/features/dca";
import { formatDate, formatTHB } from "@/features/dca/utils/format";
import { sendMessage } from "@/lib/utils/line-utils";
import { dcaEventManager } from "@/lib/dca/event-manager";
import {
  getBTCPrice,
  calculatePnLPercent,
} from "@/features/dca/services/bitkub.service.server";
import { createDcaSummaryFlexMessage } from "@/lib/line-utils/flex-messages";

interface DcaOrderForCommand {
  id: string;
  orderId: string;
  coin: string;
  amountTHB: number;
  coinReceived: number;
  pricePerCoin: number;
  round: number;
  executedAt: Date;
}

interface DcaLineUserIdentity {
  botUserId: string;
  primaryLineUserId: string;
}

// ========================
// Helpers
// ========================

const getDcaLineUserIdentity = async (
  req: any,
  logScope: string,
): Promise<DcaLineUserIdentity | null> => {
  const botUserId = req.body?.events?.[0]?.source?.userId as string | undefined;

  console.log(`🤖 [${logScope}] Bot User ID from webhook:`, botUserId);

  if (!botUserId) return null;

  // DCA command ใช้ userId จาก LINE Messaging API webhook เป็น data key เสมอ
  // ห้าม mapping ไป LINE Login/Better Auth userId เพราะเป็นคนละ channel identity
  const primaryLineUserId = botUserId;

  console.log(`🔗 [${logScope}] User ID mapping:`, {
    botUserId,
    loginUserId: primaryLineUserId,
    finalUserId: primaryLineUserId,
    source: "Bot User ID (webhook)",
  });

  return { botUserId, primaryLineUserId };
};

const buildAddSuccessText = (
  order: { orderId: string; round: number },
  data: {
    coin: string;
    amountTHB: number;
    coinReceived: number;
    pricePerCoin: number;
    executedAt: Date;
  },
) =>
  [
    `✅ บันทึก Auto DCA สำเร็จ!`,
    ``,
    `📋 รหัสคำสั่ง: ${order.orderId}`,
    `🪙 เหรียญ: ${data.coin}`,
    `💰 เงินที่ใช้: ${formatTHB(data.amountTHB)} บาท`,
    `💎 ได้รับ: ${data.coinReceived.toFixed(8)} ${data.coin}`,
    `📈 ราคา: ${formatTHB(data.pricePerCoin)} บาท/${data.coin}`,
    `🔄 รอบที่: ${order.round}`,
    `📅 วันที่: ${formatDate(data.executedAt)}`,
  ].join("\n");

// ========================
// Sub-handlers
// ========================

/**
 * แสดง help
 *
 * /dca help
 */
const handleHelp = async (req: any) => {
  await sendMessage(req, [
    {
      type: "text",
      text: [
        "📊 Auto DCA — คำสั่งทั้งหมด",
        "─────────────────────",
        "🔹 ดูสรุปการลงทุน:",
        "  /dca",
        "  /dca sum",
        "  /dca สรุป",
        "",
        "🔹 บันทึกคำสั่งซื้อ (โหมด 1 — paste จาก Bitkub):",
        "  /dca add [ข้อความ Bitkub]",
        "",
        "  ตัวอย่าง:",
        "  /dca add 🤗🎉 You Spent : 107.99 THB",
        "  Price : 2330307.8 THB/BTC",
        "  You Received : 0.00004634 BTC",
        "  Time : 2026-04-11T08:00:14.663+07:00",
        "",
        "🔹 บันทึกคำสั่งซื้อ (โหมด 2 — กรอกเอง):",
        "  /dca add [เงิน] [เหรียญ] [ได้รับ] [ราคา]",
        "  /dca add 107.99 BTC 0.00004634 2330307.8",
        "  /dca add 107.99 BTC 0.00004634 2330307.8 2026-04-11",
        "",
        "🔹 ดูรายการล่าสุด:",
        "  /dca list",
        "  /dca ประวัติ",
        "",
        "🔹 ลบรายการ (รองรับลบหลายรอบพร้อมกัน):",
        "  /dca ลบ 5",
        "  /dca del 3 7 12",
        "  /dca del 3,7,12",
        "─────────────────────",
        "📌 /dca help — แสดงคำสั่งนี้",
      ].join("\n"),
    },
  ]);
};

/**
 * ดึง full message text จาก LINE request (รวม newlines)
 */
const getFullMessageText = (req: any): string => {
  return req.body?.events?.[0]?.message?.text ?? "";
};

/**
 * ตัด prefix ของ sub-command ออกจาก full message text
 * เช่น "/dca add 🤗🎉 You Spent..." → "🤗🎉 You Spent..."
 */
const stripDcaAddPrefix = (fullText: string): string => {
  // match "/dca add", "/dca บันทึก", "/dca เพิ่ม", "/dca save" (case-insensitive)
  return fullText.replace(/^\/dca\s+(add|บันทึก|เพิ่ม|save)\s*/i, "").trim();
};

/**
 * บันทึกคำสั่งซื้อ — รองรับ 2 โหมด:
 *
 * โหมด 1: paste ข้อความ Bitkub ทั้งก้อน
 *   /dca add 🤗🎉 You Spent : 107.99 THB
 *   Price : 2330307.8 THB/BTC
 *   You Received : 0.00004634 BTC
 *   Time : 2026-04-11T08:00:14.663+07:00
 *
 * โหมด 2: กรอกค่าทีละตัว
 *   /dca add 107.99 BTC 0.00004634 2330307.8
 *   /dca add 107.99 BTC 0.00004634 2330307.8 2026-04-11
 */
const handleAdd = async (req: any, args: string[]) => {
  const identity = await getDcaLineUserIdentity(req, "DCA Add");

  if (!identity) {
    await sendMessage(req, [
      { type: "text", text: "❌ ไม่สามารถระบุตัวตนผู้ใช้ได้ กรุณาลองใหม่" },
    ]);
    return;
  }

  // ─── โหมด 1: ลอง parse ข้อความ Bitkub จาก full message text ───
  const fullText = getFullMessageText(req);
  const bitkubText = stripDcaAddPrefix(fullText);
  const parsed = dcaService.parseBitkubDcaMessage(bitkubText);

  if (parsed) {
    try {
      const order = await dcaService.createOrder({
        lineUserId: identity.primaryLineUserId,
        coin: parsed.coin,
        amountTHB: parsed.amountTHB,
        coinReceived: parsed.coinReceived,
        pricePerCoin: parsed.pricePerCoin,
        executedAt: parsed.executedAt,
      });

      // 🎉 Emit SSE event เพื่อให้ web clients รับทราบ
      dcaEventManager.emit({ type: "dca-order-created", data: order });
      await sendMessage(req, [
        { type: "text", text: buildAddSuccessText(order, parsed) },
      ]);
    } catch (err) {
      console.error("❌ DCA add (bitkub mode) error:", err);
      await sendMessage(req, [
        { type: "text", text: "❌ ไม่สามารถบันทึกได้ กรุณาลองใหม่อีกครั้ง" },
      ]);
    }
    return;
  }

  // ─── โหมด 2: กรอกค่าทีละตัว ───
  // args = ["107.99", "BTC", "0.00004634", "2330307.8", "2026-04-11"?]
  if (args.length < 4) {
    await sendMessage(req, [
      {
        type: "text",
        text: [
          "❌ รูปแบบไม่ถูกต้อง",
          "",
          "✅ โหมด 1 — paste ข้อความจาก Bitkub:",
          "/dca add [ข้อความ Bitkub ทั้งก้อน]",
          "",
          "✅ โหมด 2 — กรอกค่าทีละตัว:",
          "/dca add [เงิน] [เหรียญ] [ได้รับ] [ราคา]",
          "/dca add [เงิน] [เหรียญ] [ได้รับ] [ราคา] [YYYY-MM-DD]",
          "",
          "📌 ตัวอย่าง:",
          "/dca add 107.99 BTC 0.00004634 2330307.8",
          "/dca add 107.99 BTC 0.00004634 2330307.8 2026-04-11",
        ].join("\n"),
      },
    ]);
    return;
  }

  const amountTHB = parseFloat(args[0]!.replace(/,/g, ""));
  const coin = args[1]!.toUpperCase();
  const coinReceived = parseFloat(args[2]!);
  const pricePerCoin = parseFloat(args[3]!.replace(/,/g, ""));

  // วันที่: ถ้ามี ใช้ 08:00 Bangkok, ถ้าไม่มีใช้เวลาปัจจุบัน
  let executedAt: Date;
  if (args[4]) {
    executedAt = new Date(`${args[4].trim()}T08:00:00+07:00`);
    if (isNaN(executedAt.getTime())) {
      await sendMessage(req, [
        {
          type: "text",
          text: `❌ รูปแบบวันที่ไม่ถูกต้อง\nใช้: YYYY-MM-DD เช่น 2026-04-11`,
        },
      ]);
      return;
    }
  } else {
    executedAt = new Date();
  }

  if (isNaN(amountTHB) || amountTHB <= 0) {
    await sendMessage(req, [
      { type: "text", text: `❌ จำนวนเงินไม่ถูกต้อง: "${args[0]}"` },
    ]);
    return;
  }
  if (isNaN(coinReceived) || coinReceived <= 0) {
    await sendMessage(req, [
      { type: "text", text: `❌ จำนวนเหรียญไม่ถูกต้อง: "${args[2]}"` },
    ]);
    return;
  }
  if (isNaN(pricePerCoin) || pricePerCoin <= 0) {
    await sendMessage(req, [
      { type: "text", text: `❌ ราคาต่อเหรียญไม่ถูกต้อง: "${args[3]}"` },
    ]);
    return;
  }

  try {
    const order = await dcaService.createOrder({
      lineUserId: identity.primaryLineUserId,
      coin,
      amountTHB,
      coinReceived,
      pricePerCoin,
      executedAt,
    });

    dcaEventManager.emit({ type: "dca-order-created", data: order });
    await sendMessage(req, [
      {
        type: "text",
        text: buildAddSuccessText(order, {
          coin,
          amountTHB,
          coinReceived,
          pricePerCoin,
          executedAt,
        }),
      },
    ]);
  } catch (err) {
    console.error("❌ DCA add error:", err);
    await sendMessage(req, [
      { type: "text", text: "❌ ไม่สามารถบันทึกได้ กรุณาลองใหม่อีกครั้ง" },
    ]);
  }
};

/**
 * แสดงรายการล่าสุด 5 รายการ
 *
 * /dca list | /dca ประวัติ
 */
const handleList = async (req: any) => {
  const identity = await getDcaLineUserIdentity(req, "DCA List");

  if (!identity) {
    await sendMessage(req, [
      { type: "text", text: "❌ ไม่สามารถระบุตัวตนผู้ใช้ได้ กรุณาลองใหม่" },
    ]);
    return;
  }

  try {
    const result = await dcaService.listOrders({
      page: 1,
      limit: 5,
      lineUserId: identity.primaryLineUserId,
    });

    if (result.orders.length === 0) {
      await sendMessage(req, [
        {
          type: "text",
          text: "📭 ยังไม่มีประวัติคำสั่งซื้อ\n\nพิมพ์ /dca help เพื่อดูวิธีบันทึก",
        },
      ]);
      return;
    }

    const lines: string[] = [
      `📋 รายการล่าสุด ${result.orders.length} รายการ`,
      `(ทั้งหมด ${result.total} รายการ)`,
      "─────────────────────",
    ];

    for (const order of result.orders) {
      lines.push(
        `รอบที่ ${order.round} • ${order.coin}`,
        `  💰 ${formatTHB(order.amountTHB)} บาท → ${order.coinReceived.toFixed(8)} ${order.coin}`,
        `  📈 ราคา: ${formatTHB(order.pricePerCoin)} บาท`,
        `  📅 ${formatDate(new Date(order.executedAt))}`,
        "",
      );
    }

    lines.push("🔗 ดูทั้งหมด: /dca-history");

    await sendMessage(req, [{ type: "text", text: lines.join("\n").trim() }]);
  } catch (err) {
    console.error("❌ DCA list error:", err);
    await sendMessage(req, [
      { type: "text", text: "❌ ไม่สามารถโหลดรายการได้ กรุณาลองใหม่" },
    ]);
  }
};

/**
 * ลบรายการด้วยเลขรอบ — รองรับหลายรอบพร้อมกัน
 *
 * รูปแบบที่รองรับ:
 *   /dca ลบ 5           → ลบรอบเดียว
 *   /dca del 3 7 12     → ลบหลายรอบ (คั่นด้วย space)
 *   /dca del 3,7,12     → ลบหลายรอบ (คั่นด้วย comma)
 *   /dca del 3, 7, 12   → ลบหลายรอบ (คั่นด้วย comma + space)
 */
const handleDelete = async (req: any, args: string[]) => {
  const identity = await getDcaLineUserIdentity(req, "DCA Delete");

  if (!identity) {
    await sendMessage(req, [
      { type: "text", text: "❌ ไม่สามารถระบุตัวตนผู้ใช้ได้ กรุณาลองใหม่" },
    ]);
    return;
  }

  if (args.length === 0) {
    await sendMessage(req, [
      {
        type: "text",
        text: [
          "❌ ระบุเลขรอบที่ต้องการลบ",
          "",
          "ลบรอบเดียว:     /dca ลบ 5",
          "ลบหลายรอบ:     /dca ลบ 3 7 12",
          "ลบหลายรอบ:     /dca ลบ 3,7,12",
        ].join("\n"),
      },
    ]);
    return;
  }

  // ─── Parse round numbers — รองรับ space และ/หรือ comma ───────────────────
  const rawTokens = args
    .join(" ")
    .split(/[\s,]+/)
    .filter(Boolean);
  const validRounds: number[] = [];
  const invalidTokens: string[] = [];

  for (const token of rawTokens) {
    const n = parseInt(token);
    if (isNaN(n) || n <= 0) {
      invalidTokens.push(token);
    } else if (!validRounds.includes(n)) {
      validRounds.push(n);
    }
  }

  if (invalidTokens.length > 0) {
    await sendMessage(req, [
      {
        type: "text",
        text: `❌ เลขรอบไม่ถูกต้อง: ${invalidTokens.map((t) => `"${t}"`).join(", ")}\n\nใช้ตัวเลขจำนวนเต็มบวกเท่านั้น`,
      },
    ]);
    return;
  }

  try {
    // ─── ค้นหาทุกรอบพร้อมกัน (1 query) ──────────────────────────────────
    const found = (await dcaService.findByRounds(
      validRounds,
      identity.primaryLineUserId,
    )) as DcaOrderForCommand[];
    const foundRounds = found.map((order) => order.round);
    const notFoundRounds = validRounds.filter((r) => !foundRounds.includes(r));

    if (found.length === 0) {
      const roundList = validRounds.join(", ");
      await sendMessage(req, [
        {
          type: "text",
          text: `❌ ไม่พบรายการรอบที่ ${roundList} ของคุณ`,
        },
      ]);
      return;
    }

    // ─── ลบทั้งหมดพร้อมกัน ────────────────────────────────────────────────
    await Promise.all(found.map((order) => dcaService.deleteOrder(order.id)));

    // 🗑️ Emit SSE event ต่อ order
    for (const order of found) {
      dcaEventManager.emit({
        type: "dca-order-deleted",
        data: { id: order.id, round: order.round },
      });
    }

    // ─── สรุปผลลัพธ์ ──────────────────────────────────────────────────────
    const lines: string[] = [];

    if (found.length === 1) {
      // ลบรอบเดียว — แสดงรายละเอียด
      const o = found[0]!;
      lines.push(
        `🗑️ ลบรายการสำเร็จ`,
        ``,
        `📋 รหัส: ${o.orderId}`,
        `🪙 เหรียญ: ${o.coin}`,
        `🔄 รอบที่: ${o.round}`,
        `💰 เงิน: ${formatTHB(o.amountTHB)} บาท`,
        `📅 วันที่: ${formatDate(new Date(o.executedAt))}`,
      );
    } else {
      // ลบหลายรอบ — แสดงสรุปรายการ
      lines.push(`🗑️ ลบสำเร็จ ${found.length} รายการ`, `─────────────────────`);
      for (const o of found) {
        lines.push(
          `รอบที่ ${o.round} • ${o.coin} • ${formatTHB(o.amountTHB)} บาท`,
        );
      }
    }

    // แจ้งรอบที่ไม่พบ (ถ้ามี)
    if (notFoundRounds.length > 0) {
      lines.push(``, `⚠️ ไม่พบรอบที่: ${notFoundRounds.join(", ")}`);
    }

    await sendMessage(req, [{ type: "text", text: lines.join("\n") }]);
  } catch (err) {
    console.error("❌ DCA delete error:", err);
    await sendMessage(req, [
      { type: "text", text: "❌ ไม่สามารถลบรายการได้ กรุณาลองใหม่" },
    ]);
  }
};

/**
 * แสดงสรุปการลงทุน
 *
 * /dca
 */
const handleSummary = async (req: any) => {
  const identity = await getDcaLineUserIdentity(req, "DCA Summary");
  const appUrl = process.env["APP_URL"] ?? process.env["NEXTAUTH_URL"] ?? "";

  if (!identity) {
    await sendMessage(req, [
      { type: "text", text: "❌ ไม่สามารถระบุตัวตนผู้ใช้ได้ กรุณาลองใหม่" },
    ]);
    return;
  }

  try {
    // ดึงข้อมูลทั้งหมดพร้อมกัน รวมถึงราคาปัจจุบันจาก Bitkub
    const [summary, latest, currentPrice] = await Promise.all([
      dcaService.getSummary(identity.primaryLineUserId),
      dcaService.listOrders({
        page: 1,
        limit: 1,
        lineUserId: identity.primaryLineUserId,
      }),
      getBTCPrice(), // ดึงราคา BTC พร้อมกันเสมอ ไม่รอ avgPrice
    ]);

    const lastOrder = latest.orders[0];
    const avgPrice =
      summary.totalBTC > 0 ? summary.totalSpentTHB / summary.totalBTC : 0;

    // คำนวณ PnL ถ้าได้ราคาและมียอดสะสม
    const pnlData =
      currentPrice && avgPrice > 0
        ? {
            currentPrice,
            pnlPercent: calculatePnLPercent(avgPrice, currentPrice),
          }
        : null;

    // สร้าง Flex Message
    const flexMessage = createDcaSummaryFlexMessage(
      {
        totalSpentTHB: summary.totalSpentTHB,
        totalBTC: summary.totalBTC,
        totalRounds: summary.totalRounds,
        averagePrice: avgPrice,
        currentPrice: currentPrice ?? null,
        pnlPercent: pnlData?.pnlPercent ?? null,
        pnlValue:
          pnlData && summary.totalBTC > 0
            ? (pnlData.currentPrice - avgPrice) * summary.totalBTC
            : null,
        lastOrder: lastOrder
          ? {
              round: lastOrder.round,
              amountTHB: lastOrder.amountTHB,
              coinReceived: lastOrder.coinReceived,
              coin: lastOrder.coin,
              executedAt: new Date(lastOrder.executedAt),
            }
          : undefined,
      },
      appUrl,
    );

    await sendMessage(req, [flexMessage]);
  } catch (error) {
    console.error("❌ DCA summary error:", error);
    // Fallback to text message ถ้า Flex Message ล้มเหลว
    await sendMessage(req, [
      {
        type: "text",
        text: `📊 Auto DCA\n\nดูประวัติได้ที่:\n${appUrl}/dca-history\n\n📌 /dca help — ดูคำสั่งทั้งหมด`,
      },
    ]);
  }
};

// ========================
// Main handler
// ========================

/**
 * จัดการคำสั่ง /dca จาก LINE Bot
 *
 * รองรับ sub-commands:
 * /dca                              → สรุปการลงทุน
 * /dca sum | สรุป | summary         → สรุปการลงทุน (alias)
 * /dca help | ช่วยเหลือ             → แสดงคำสั่งทั้งหมด
 * /dca add [เงิน] [coin] [ได้รับ] [ราคา] [วันที่?] → บันทึกด้วยตนเอง
 * /dca บันทึก [เงิน] [coin] [ได้รับ] [ราคา] [วันที่?] → บันทึกด้วยตนเอง (ไทย)
 * /dca list | ประวัติ               → รายการล่าสุด 5 รายการ
 * /dca ลบ [round] | del [round]     → ลบรายการด้วยเลขรอบ
 */
export const handleDcaCommand = async (
  req: any,
  conditions: string[],
): Promise<void> => {
  const subCommand = conditions[0]?.toLowerCase();
  const args = conditions.slice(1);

  switch (subCommand) {
    case "help":
    case "ช่วยเหลือ":
    case "h":
      await handleHelp(req);
      break;

    case "add":
    case "บันทึก":
    case "เพิ่ม":
    case "save":
      await handleAdd(req, args);
      break;

    case "list":
    case "ประวัติ":
    case "ls":
    case "history":
      await handleList(req);
      break;

    case "del":
    case "ลบ":
    case "delete":
    case "remove":
    case "rm":
      await handleDelete(req, args);
      break;

    case "sum":
    case "สรุป":
    case "summary":
      await handleSummary(req);
      break;

    default:
      await handleSummary(req);
      break;
  }
};

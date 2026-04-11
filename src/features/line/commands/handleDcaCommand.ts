import { dcaService } from "@/features/dca";
import { sendMessage } from "@/lib/utils/line-utils";
import { dcaEventManager } from "@/lib/dca/event-manager";
import { getPnLFromBitkub } from "@/features/dca/services/bitkub.service";
import { createDcaSummaryFlexMessage } from "@/lib/line-utils/flex-messages";

// ========================
// Helpers
// ========================

const formatTHB = (n: number) =>
  n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
    hour12: false,
  }).format(date);

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
        "🔹 ลบรายการ (ระบุเลขรอบ):",
        "  /dca ลบ [รอบที่]",
        "  /dca del [รอบที่]",
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
  const userId = req.body?.events?.[0]?.source?.userId ?? "line-bot-manual";

  // ─── โหมด 1: ลอง parse ข้อความ Bitkub จาก full message text ───
  const fullText = getFullMessageText(req);
  const bitkubText = stripDcaAddPrefix(fullText);
  const parsed = dcaService.parseBitkubDcaMessage(bitkubText);

  if (parsed) {
    try {
      const order = await dcaService.createOrder({
        lineUserId: userId,
        coin: parsed.coin,
        amountTHB: parsed.amountTHB,
        coinReceived: parsed.coinReceived,
        pricePerCoin: parsed.pricePerCoin,
        executedAt: parsed.executedAt,
      });

      // 🎉 Emit SSE event เพื่อให้ web clients รับทราบ
      dcaEventManager.emit({
        type: "dca-order-created",
        data: order,
      });

      await sendMessage(req, [
        {
          type: "text",
          text: [
            `✅ บันทึก Auto DCA สำเร็จ!`,
            ``,
            `📋 รหัสคำสั่ง: ${order.orderId}`,
            `🪙 เหรียญ: ${parsed.coin}`,
            `💰 เงินที่ใช้: ${formatTHB(parsed.amountTHB)} บาท`,
            `💎 ได้รับ: ${parsed.coinReceived.toFixed(8)} ${parsed.coin}`,
            `📈 ราคา: ${formatTHB(parsed.pricePerCoin)} บาท/${parsed.coin}`,
            `🔄 รอบที่: ${order.round}`,
            `📅 วันที่: ${formatDate(parsed.executedAt)}`,
          ].join("\n"),
        },
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
      lineUserId: userId,
      coin,
      amountTHB,
      coinReceived,
      pricePerCoin,
      executedAt,
    });

    // 🎉 Emit SSE event เพื่อให้ web clients รับทราบ
    dcaEventManager.emit({
      type: "dca-order-created",
      data: order,
    });

    await sendMessage(req, [
      {
        type: "text",
        text: [
          `✅ บันทึก Auto DCA สำเร็จ!`,
          ``,
          `📋 รหัสคำสั่ง: ${order.orderId}`,
          `🪙 เหรียญ: ${coin}`,
          `💰 เงินที่ใช้: ${formatTHB(amountTHB)} บาท`,
          `💎 ได้รับ: ${coinReceived.toFixed(8)} ${coin}`,
          `📈 ราคา: ${formatTHB(pricePerCoin)} บาท/${coin}`,
          `🔄 รอบที่: ${order.round}`,
          `📅 วันที่: ${formatDate(executedAt)}`,
        ].join("\n"),
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
  try {
    const result = await dcaService.listOrders({ page: 1, limit: 5 });

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
 * ลบรายการด้วยเลขรอบ
 *
 * /dca ลบ [round] | /dca del [round]
 */
const handleDelete = async (req: any, args: string[]) => {
  const roundStr = args[0];
  if (!roundStr) {
    await sendMessage(req, [
      {
        type: "text",
        text: "❌ ระบุเลขรอบที่ต้องการลบ\n\nตัวอย่าง: /dca ลบ 56",
      },
    ]);
    return;
  }

  const round = parseInt(roundStr);
  if (isNaN(round) || round <= 0) {
    await sendMessage(req, [
      {
        type: "text",
        text: `❌ เลขรอบไม่ถูกต้อง: "${roundStr}"\n\nตัวอย่าง: /dca ลบ 56`,
      },
    ]);
    return;
  }

  try {
    // ค้นหาด้วย round number
    const found = await dcaService.findByRound(round);
    if (!found) {
      await sendMessage(req, [
        { type: "text", text: `❌ ไม่พบรายการรอบที่ ${round}` },
      ]);
      return;
    }

    await dcaService.deleteOrder(found.id);

    // 🗑️ Emit SSE event เพื่อให้ web clients รับทราบ
    dcaEventManager.emit({
      type: "dca-order-deleted",
      data: { id: found.id, round: found.round },
    });

    await sendMessage(req, [
      {
        type: "text",
        text: [
          `🗑️ ลบรายการสำเร็จ`,
          ``,
          `📋 รหัส: ${found.orderId}`,
          `🪙 เหรียญ: ${found.coin}`,
          `🔄 รอบที่: ${found.round}`,
          `💰 เงิน: ${formatTHB(found.amountTHB)} บาท`,
          `📅 วันที่: ${formatDate(new Date(found.executedAt))}`,
        ].join("\n"),
      },
    ]);
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
  const userId = req.body?.events?.[0]?.source?.userId;
  const appUrl = process.env["APP_URL"] ?? process.env["NEXTAUTH_URL"] ?? "";

  try {
    const [summary, latest] = await Promise.all([
      dcaService.getSummary(userId),
      dcaService.listOrders({ page: 1, limit: 1 }),
    ]);

    const lastOrder = latest.orders[0];
    const avgPrice = summary.totalBTC > 0 ? summary.totalSpentTHB / summary.totalBTC : 0;
    const pnlData = avgPrice > 0 ? await getPnLFromBitkub(avgPrice) : null;

    // สร้าง Flex Message
    const flexMessage = createDcaSummaryFlexMessage(
      {
        totalSpentTHB: summary.totalSpentTHB,
        totalBTC: summary.totalBTC,
        totalRounds: summary.totalRounds,
        averagePrice: avgPrice,
        currentPrice: pnlData?.currentPrice ?? null,
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

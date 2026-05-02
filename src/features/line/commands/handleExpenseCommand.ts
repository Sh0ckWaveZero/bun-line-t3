/**
 * handleExpenseCommand -- จัดการคำสั่งรายรับรายจ่ายผ่าน LINE Bot
 *
 * คำสั่งที่รองรับ:
 *   /expense                              -> สรุปเดือนปัจจุบัน
 *   /expense sum | สรุป                  -> สรุปเดือนปัจจุบัน (alias)
 *   /expense add [จำนวน] [หมวด?] [#note] -> บันทึกรายจ่าย
 *   /รับ [จำนวน] [หมวด?] [#note]        -> บันทึกรายรับ (shortcut)
 *   /จ่าย [จำนวน] [หมวด?] [#note]       -> บันทึกรายจ่าย (shortcut)
 *   /expense list [N?]                    -> รายการ N รายการล่าสุด (default 5)
 *   /expense del [id?]                    -> ลบรายการ (Quick Reply เลือก)
 *   /expense edit [amount?]               -> แก้ไขรายการล่าสุด
 *   /expense month [MM | YYYY-MM]         -> สรุปเดือนอื่น
 *   /expense today                        -> สรุปวันนี้
 *   /expense week                         -> สรุปสัปดาห์นี้
 *   /expense [หมวดหมู่]                   -> Filter ตามหมวดหมู่
 *   /expense help | ช่วยเหลือ            -> แสดงคำสั่ง
 *
 * Note syntax:   #ข้อความ (ทุกอย่างหลัง # คือ note)
 * Tag syntax:    @tag1 @tag2 (เก็บเป็น comma-separated)
 */

import { findAccountByLineMessagingApiId } from "@/lib/auth/account-linking";
import {
  getTransactions,
  getMonthlySummary,
  createTransaction,
  getCategorySummary,
  deleteTransaction,
  updateTransaction,
  getTransactionById,
} from "@/features/expenses/services/transaction.server";
import {
  getCategoriesByUser,
  seedDefaultCategories,
} from "@/features/expenses/services/category.server";
import {
  formatMonthThai,
  formatAmount,
  getCurrentMonth,
  toTransDate,
  toTransMonth,
  formatDateShortThai,
} from "@/features/expenses/helpers";
import type {
  ExpenseCategory,
  MonthlySummary,
  CategorySummary,
  TransactionWithCategory,
} from "@/features/expenses/types";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { env } from "@/env.mjs";
import { shouldHideAmountsForLine } from "@/features/settings/services/settings.server";

// ---------------------------------------------------------------------------
// Lazy import sendMessage (pattern เดียวกับ command อื่น)
// ---------------------------------------------------------------------------
const getSendMessage = async () => {
  const mod = await import("@/lib/utils/line-utils");
  return mod.sendMessage;
};

// ---------------------------------------------------------------------------
// Flex Message builder
// ---------------------------------------------------------------------------

function createExpenseSummaryBubble(
  summary: MonthlySummary,
  categories: CategorySummary[],
  transMonth: string,
  frontendUrl: string,
  hide = false,
): object {
  const balance = summary.balance;
  const isPositive = balance >= 0;
  const headerColor = isPositive ? "#16A34A" : "#D97706";
  const balanceColor = isPositive ? "#16A34A" : "#EF4444";
  const balanceSign = isPositive ? "+" : "-";

  const row = (label: string, value: string, valueColor: string) => ({
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    contents: [
      { type: "text", text: label, size: "sm", color: "#6B7280", flex: 2 },
      {
        type: "text",
        text: value,
        size: "sm",
        color: valueColor,
        weight: "bold",
        align: "end",
        flex: 3,
      },
    ],
  });

  const bodyContents: object[] = [
    row(`📈 รายรับ`, `+${fmt(summary.totalIncome, hide)} บาท`, "#16A34A"),
    row(`📉 รายจ่าย`, `-${fmt(summary.totalExpense, hide)} บาท`, "#EF4444"),
    { type: "separator", margin: "md" },
    {
      type: "box",
      layout: "horizontal",
      spacing: "sm",
      margin: "md",
      contents: [
        {
          type: "text",
          text: "⚖️ คงเหลือ",
          size: "md",
          color: "#111827",
          weight: "bold",
          flex: 2,
        },
        {
          type: "text",
          text: `${balanceSign}${fmt(Math.abs(balance), hide)} บาท`,
          size: "md",
          color: balanceColor,
          weight: "bold",
          align: "end",
          flex: 3,
        },
      ],
    },
    {
      type: "text",
      text: `📋 ${summary.transactionCount} รายการ`,
      size: "xs",
      color: "#9CA3AF",
      align: "end",
      margin: "sm",
    },
  ];

  const topExpenses = categories.filter((c) => c.type === "EXPENSE").slice(0, 3);
  if (topExpenses.length > 0) {
    bodyContents.push(
      { type: "separator", margin: "md" },
      {
        type: "text",
        text: "🔍 รายจ่ายสูงสุด",
        size: "sm",
        color: "#374151",
        weight: "bold",
        margin: "md",
      },
      ...topExpenses.map((c) =>
        row(
          `${c.icon ?? "📦"} ${c.categoryName}`,
          `${fmt(c.total, hide)} บาท`,
          "#374151",
        ),
      ),
    );
  }

  return {
    type: "bubble",
    size: "giga",
    header: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
      backgroundColor: headerColor,
      contents: [
        {
          type: "text",
          text: "💰 สรุปรายรับรายจ่าย",
          weight: "bold",
          size: "xl",
          color: "#ffffff",
          align: "center",
        },
        {
          type: "text",
          text: `📅 ${formatMonthThai(transMonth)}`,
          size: "sm",
          color: "#ffffff",
          align: "center",
          margin: "sm",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "20px",
      contents: bodyContents,
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "12px",
      contents: [
        {
          type: "button",
          style: "primary",
          color: headerColor,
          action: {
            type: "uri",
            label: "ดูรายการทั้งหมด",
            uri: `${frontendUrl}/expenses`,
          },
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** ดึง LINE userId จาก webhook request */
function getLineUserId(req: unknown): string | null {
  const r = req as {
    body?: { events?: Array<{ source?: { userId?: string } }> };
  };
  return r.body?.events?.[0]?.source?.userId ?? null;
}

/** ตรวจว่าข้อความมาจากกลุ่ม/ห้อง หรือแชท 1:1 */
function isGroupSource(req: unknown): boolean {
  const r = req as {
    body?: { events?: Array<{ source?: { type?: string } }> };
  };
  const sourceType = r.body?.events?.[0]?.source?.type;
  return sourceType === "group" || sourceType === "room";
}

/** Map LINE Messaging API userId -> DB userId (ผ่าน Account table) */
async function resolveDbUserId(lineUserId: string): Promise<string | null> {
  const account = await findAccountByLineMessagingApiId(lineUserId);
  return account?.userId ?? null;
}

const MASKED = "••••••";

/** Format ตัวเลข -- ซ่อนถ้า hide = true */
const fmt = (n: number, hide = false) =>
  hide ? MASKED : formatAmount(Math.abs(n));

// ---------------------------------------------------------------------------
// Argument parser สำหรับ handleAdd
// แยก amount, category, note (#...) และ tags (@...)
// ---------------------------------------------------------------------------

interface ParsedAddArgs {
  amountStr: string;
  categoryQuery?: string;
  note?: string;
  tags?: string[];
}

/**
 * Parse args array จากข้อความ LINE
 * - args[0] = จำนวนเงิน
 * - args ที่ขึ้นต้นด้วย # = note (join กับ text ถัดไปจนเจอ @ หรือหมด)
 * - args ที่ขึ้นต้นด้วย @ = tags
 * - ที่เหลือ = category query
 *
 * ตัวอย่าง: ["250", "อาหาร", "#ข้าวมันไก่", "ร้าน", "ABC", "@lunch", "@office"]
 * -> { amountStr: "250", categoryQuery: "อาหาร", note: "ข้าวมันไก่ ร้าน ABC", tags: ["lunch", "office"] }
 */
function parseAddArgs(args: string[]): ParsedAddArgs {
  if (args.length === 0) return { amountStr: "" };

  const amountStr = args[0]!;
  const rest = args.slice(1);

  const tags: string[] = [];
  const categoryParts: string[] = [];
  const noteParts: string[] = [];
  let inNote = false;

  for (const arg of rest) {
    if (arg.startsWith("#")) {
      // เริ่ม note — เอาตัวอักษรหลัง # ด้วย
      inNote = true;
      const noteText = arg.slice(1);
      if (noteText) noteParts.push(noteText);
    } else if (arg.startsWith("@")) {
      // Tag — ไม่ว่าจะอยู่ตรงไหนก็เก็บเป็น tag
      const tagText = arg.slice(1);
      if (tagText) tags.push(tagText);
    } else if (inNote) {
      // อยู่ใน note mode แล้ว -> เก็บเป็น note ต่อ
      noteParts.push(arg);
    } else {
      // ยังไม่เจอ # -> เป็น category
      categoryParts.push(arg);
    }
  }

  return {
    amountStr,
    categoryQuery: categoryParts.join(" ") || undefined,
    note: noteParts.join(" ") || undefined,
    tags: tags.length > 0 ? tags : undefined,
  };
}

// ---------------------------------------------------------------------------
// Date helpers สำหรับ today / week
// ---------------------------------------------------------------------------

/** วันนี้ในรูปแบบ YYYY-MM-DD */
function todayDate(): string {
  return toTransDate(new Date());
}

/** วันจันทร์ของสัปดาห์นี้ ในรูปแบบ YYYY-MM-DD */
function mondayOfThisWeek(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1; // วันจันทร์ = 0 offset
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return toTransDate(monday);
}

/** วันอาทิตย์ของสัปดาห์นี้ ในรูปแบบ YYYY-MM-DD */
function sundayOfThisWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + diff);
  return toTransDate(sunday);
}

// ---------------------------------------------------------------------------
// Sub-handlers
// ---------------------------------------------------------------------------

/** แสดง help — ปรับปรุงให้ครอบคลุมคำสั่งใหม่ทั้งหมด */
async function handleHelp(req: unknown) {
  const sendMessage = await getSendMessage();

  const section = (emoji: string, title: string, lines: string[]) => ({
    type: "box",
    layout: "vertical",
    spacing: "xs",
    contents: [
      {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          { type: "text", text: emoji, size: "sm", flex: 0 },
          {
            type: "text",
            text: title,
            size: "sm",
            weight: "bold",
            color: "#111827",
            flex: 1,
          },
        ],
      },
      ...lines.map((line) => ({
        type: "text",
        text: line,
        size: "xs",
        color: "#6B7280",
        margin: "xs",
        wrap: true,
      })),
    ],
  });

  const bubbles = [
    {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        backgroundColor: "#1D4ED8",
        contents: [
          {
            type: "text",
            text: "💰 รายรับรายจ่าย",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
          {
            type: "text",
            text: "คำสั่งทั้งหมด (1/2)",
            size: "sm",
            color: "#BFDBFE",
            align: "center",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          section("📉", "บันทึกรายจ่าย", [
            "/จ่าย [จำนวน] [หมวด]",
            "ตัวอย่าง: /จ่าย 250 อาหาร",
            "เพิ่ม note: /จ่าย 250 อาหาร #ข้าวมันไก่",
            "เพิ่ม tag: /จ่าย 250 อาหาร @lunch",
            "ย่อได้: /exp 1200  หรือ  /e 50",
          ]),
          { type: "separator" },
          section("📈", "บันทึกรายรับ", [
            "/รับ [จำนวน] [หมวด]",
            "ตัวอย่าง: /รับ 30000 เงินเดือน",
            "เพิ่ม note: /รับ 5000 โบนัส #Q1",
          ]),
          { type: "separator" },
          section("📊", "ดูสรุปเดือนนี้", ["/expense  หรือ  /expense sum"]),
          { type: "separator" },
          section("📋", "ดูรายการล่าสุด", [
            "/expense list         (5 รายการ)",
            "/expense list 10     (กำหนดจำนวน)",
          ]),
        ],
      },
    },
    {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        backgroundColor: "#1D4ED8",
        contents: [
          {
            type: "text",
            text: "💰 รายรับรายจ่าย",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
          {
            type: "text",
            text: "คำสั่งเพิ่มเติม (2/2)",
            size: "sm",
            color: "#BFDBFE",
            align: "center",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          section("🗑️", "ลบรายการ", [
            "/expense del           (เลือกจาก Quick Reply)",
            "/expense del [id]     (ลบโดยตรง)",
          ]),
          { type: "separator" },
          section("✏️", "แก้ไขรายการล่าสุด", [
            "/expense edit [จำนวนใหม่]",
            "/expense edit note [note ใหม่]",
            "/expense edit category [หมวดใหม่]",
          ]),
          { type: "separator" },
          section("📅", "ดูเดือนอื่น / วัน / สัปดาห์", [
            "/expense month 04     (เม.ย. ปีนี้)",
            "/expense month 2025-04",
            "/expense today        (วันนี้)",
            "/expense week         (สัปดาห์นี้)",
          ]),
          { type: "separator" },
          section("🔍", "Filter ตามหมวดหมู่", [
            "/expense อาหาร        (ดูเฉพาะหมวด)",
          ]),
          { type: "separator" },
          section("📁", "จัดการหมวดหมู่", [
            "/category list        (ดูทั้งหมด)",
            "/category add ชื่อ 🎨  (สร้างใหม่)",
          ]),
          { type: "separator" },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "💡 เคล็ดลับ",
                size: "xs",
                weight: "bold",
                color: "#374151",
              },
              {
                type: "text",
                text: "ใช้ # เพิ่ม note: /จ่าย 250 อาหาร #ข้าวมันไก่\nใช้ @ เพิ่ม tag: /จ่าย 250 อาหาร @lunch\nไม่ระบุหมวด → ใช้หมวด 'อื่นๆ' อัตโนมัติ",
                size: "xs",
                color: "#6B7280",
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "12px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#1D4ED8",
            action: {
              type: "uri",
              label: "ดูคำสั่งทั้งหมดบนเว็บไซต์",
              uri: `${env.FRONTEND_URL}/help`,
            },
          },
        ],
      },
    },
  ];

  await sendMessage(
    req as Parameters<typeof sendMessage>[0],
    flexMessage(bubbles),
  );
}

/** แสดงสรุปเดือน (ปัจจุบัน หรือ เดือนที่ระบุ) */
async function handleSummary(req: unknown, userId: string, hide = false, transMonth?: string) {
  const sendMessage = await getSendMessage();
  const month = transMonth ?? getCurrentMonth();

  try {
    const [summary, categories] = await Promise.all([
      getMonthlySummary(userId, month),
      getCategorySummary(userId, month),
    ]);

    const bubble = createExpenseSummaryBubble(
      summary,
      categories,
      month,
      env.FRONTEND_URL,
      hide,
    );

    await sendMessage(
      req as Parameters<typeof sendMessage>[0],
      flexMessage([bubble]),
    );
  } catch (err) {
    console.error("[Expense Summary] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถโหลดสรุปได้ กรุณาลองใหม่" },
    ]);
  }
}

/** แสดงรายการล่าสุด N รายการ (default 5, max 20) */
async function handleList(req: unknown, userId: string, hide = false, count = 5) {
  const sendMessage = await getSendMessage();
  const limit = Math.min(Math.max(count, 1), 20);

  try {
    const rows = await getTransactions({ userId, limit });

    if (rows.length === 0) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: "📭 ยังไม่มีรายการ\n\nพิมพ์ /expense help เพื่อดูวิธีบันทึก",
        },
      ]);
      return;
    }

    const lines = [
      `📋 รายการล่าสุด ${rows.length} รายการ`,
      "─────────────────────",
    ];

    for (const r of rows) {
      const isIncome = r.type === "INCOME";
      const sign = isIncome ? "+" : "-";
      const emoji = r.category.icon ?? (isIncome ? "💰" : "💸");
      lines.push(
        `${emoji} ${r.category.name}`,
        `  ${sign}${fmt(r.amount, hide)} บาท • ${r.transDate}`,
      );
      if (r.note) lines.push(`  📝 ${r.note}`);
      if (r.tags) lines.push(`  🏷️ ${r.tags.split(",").map((t) => `@${t.trim()}`).join(" ")}`);
    }

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: lines.filter(Boolean).join("\n").trim() },
    ]);
  } catch (err) {
    console.error("[Expense List] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถโหลดรายการได้ กรุณาลองใหม่" },
    ]);
  }
}

/** ลบรายการ -- ถ้าไม่ระบุ id → แสดง Quick Reply ให้เลือก */
async function handleDelete(req: unknown, userId: string, args: string[], hide = false) {
  const sendMessage = await getSendMessage();

  const targetId = args[0];

  // ถ้าระบุ id → ลบเลย
  if (targetId) {
    try {
      const tx = await getTransactionById(targetId, userId);
      if (!tx) {
        await sendMessage(req as Parameters<typeof sendMessage>[0], [
          { type: "text", text: "❌ ไม่พบรายการนี้ หรือไม่ใช่ของคุณ" },
        ]);
        return;
      }

      await deleteTransaction(targetId, userId);

      const isIncome = tx.type === "INCOME";
      const emoji = isIncome ? "📈" : "📉";
      const sign = isIncome ? "+" : "-";

      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: [
            "🗑️ ลบรายการสำเร็จ",
            "",
            `${emoji} ${tx.category.name}`,
            `💵 ${sign}${fmt(tx.amount, hide)} บาท`,
            `📅 ${tx.transDate}`,
            tx.note ? `📝 ${tx.note}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ]);
      return;
    } catch (err) {
      console.error("[Expense Delete] error:", err);
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: "❌ ไม่สามารถลบรายการได้ กรุณาลองใหม่" },
      ]);
      return;
    }
  }

  // ไม่ระบุ id → แสดง Quick Reply ให้เลือก
  try {
    const rows = await getTransactions({ userId, limit: 5 });

    if (rows.length === 0) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: "📭 ไม่มีรายการให้ลบ" },
      ]);
      return;
    }

    const quickReplyItems = rows.map((r) => {
      const isIncome = r.type === "INCOME";
      const sign = isIncome ? "+" : "-";
      const emoji = r.category.icon ?? (isIncome ? "💰" : "💸");
      const label = `${emoji} ${sign}${formatAmount(r.amount)} ${r.category.name}`.slice(0, 20);

      return {
        type: "action",
        action: {
          type: "message",
          label,
          text: `/expense del ${r.id}`,
        },
      };
    });

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: "🗑️ เลือกรายการที่ต้องการลบ:",
        quickReply: {
          items: quickReplyItems,
        },
      },
    ]);
  } catch (err) {
    console.error("[Expense Delete] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถโหลดรายการได้ กรุณาลองใหม่" },
    ]);
  }
}

/** แก้ไขรายการล่าสุด */
async function handleEdit(req: unknown, userId: string, args: string[], hide = false) {
  const sendMessage = await getSendMessage();

  try {
    // ดึงรายการล่าสุด
    const [latest] = await getTransactions({ userId, limit: 1 });

    if (!latest) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: "📭 ไม่มีรายการให้แก้ไข" },
      ]);
      return;
    }

    // ไม่มี args → แสดงรายละเอียดรายการล่าสุด พร้อม Quick Reply
    if (args.length === 0) {
      const isIncome = latest.type === "INCOME";
      const sign = isIncome ? "+" : "-";
      const emoji = latest.category.icon ?? (isIncome ? "💰" : "💸");

      const quickReplyItems = [
        {
          type: "action",
          action: {
            type: "message",
            label: "✏️ แก้จำนวนเงิน",
            text: `/expense edit amount`,
          },
        },
        {
          type: "action",
          action: {
            type: "message",
            label: "📝 แก้ note",
            text: `/expense edit note`,
          },
        },
        {
          type: "action",
          action: {
            type: "message",
            label: "📁 แก้หมวดหมู่",
            text: `/expense edit category`,
          },
        },
        {
          type: "action",
          action: {
            type: "message",
            label: "🗑️ ลบรายการนี้",
            text: `/expense del ${latest.id}`,
          },
        },
      ];

      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: [
            "✏️ แก้ไขรายการล่าสุด",
            "─────────────────────",
            `${emoji} ${latest.category.name}`,
            `💵 ${sign}${fmt(latest.amount, hide)} บาท`,
            `📅 ${latest.transDate}`,
            latest.note ? `📝 ${latest.note}` : "",
            latest.tags
              ? `🏷️ ${latest.tags.split(",").map((t) => `@${t.trim()}`).join(" ")}`
              : "",
            "",
            "เลือกสิ่งที่ต้องการแก้ไข:",
          ]
            .filter(Boolean)
            .join("\n"),
          quickReply: { items: quickReplyItems },
        },
      ]);
      return;
    }

    const field = args[0]?.toLowerCase();
    const value = args.slice(1).join(" ");

    // /expense edit [ตัวเลข] → แก้จำนวนเงินทันที
    if (field && !isNaN(parseFloat(field.replace(/,/g, "")))) {
      const newAmount = parseFloat(field.replace(/,/g, ""));
      if (newAmount <= 0) {
        await sendMessage(req as Parameters<typeof sendMessage>[0], [
          { type: "text", text: "❌ จำนวนเงินต้องมากกว่า 0" },
        ]);
        return;
      }

      const updated = await updateTransaction(latest.id, userId, { amount: newAmount });
      const isIncome = updated.type === "INCOME";
      const sign = isIncome ? "+" : "-";

      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: [
            "✅ แก้ไขจำนวนเงินสำเร็จ",
            "",
            `${updated.category.icon ?? "📦"} ${updated.category.name}`,
            `💵 ${sign}${fmt(updated.amount, hide)} บาท`,
            `📅 ${updated.transDate}`,
          ].join("\n"),
        },
      ]);
      return;
    }

    // /expense edit amount [value]
    if (field === "amount") {
      if (!value) {
        await sendMessage(req as Parameters<typeof sendMessage>[0], [
          {
            type: "text",
            text: "❌ ระบุจำนวนเงินใหม่ด้วย\n\n✅ ตัวอย่าง: /expense edit amount 300",
          },
        ]);
        return;
      }

      const newAmount = parseFloat(value.replace(/,/g, ""));
      if (isNaN(newAmount) || newAmount <= 0) {
        await sendMessage(req as Parameters<typeof sendMessage>[0], [
          { type: "text", text: `❌ จำนวนเงินไม่ถูกต้อง: "${value}"` },
        ]);
        return;
      }

      const updated = await updateTransaction(latest.id, userId, { amount: newAmount });
      const isIncome = updated.type === "INCOME";
      const sign = isIncome ? "+" : "-";

      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: [
            "✅ แก้ไขจำนวนเงินสำเร็จ",
            "",
            `${updated.category.icon ?? "📦"} ${updated.category.name}`,
            `💵 ${sign}${fmt(updated.amount, hide)} บาท`,
            `📅 ${updated.transDate}`,
          ].join("\n"),
        },
      ]);
      return;
    }

    // /expense edit note [value]
    if (field === "note") {
      const newNote = value || null;
      const updated = await updateTransaction(latest.id, userId, { note: newNote });
      const isIncome = updated.type === "INCOME";
      const sign = isIncome ? "+" : "-";

      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: [
            newNote ? "✅ แก้ไข note สำเร็จ" : "✅ ลบ note สำเร็จ",
            "",
            `${updated.category.icon ?? "📦"} ${updated.category.name}`,
            `💵 ${sign}${fmt(updated.amount, hide)} บาท`,
            newNote ? `📝 ${newNote}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ]);
      return;
    }

    // /expense edit category [value]
    if (field === "category" || field === "หมวด" || field === "หมวดหมู่") {
      if (!value) {
        await sendMessage(req as Parameters<typeof sendMessage>[0], [
          {
            type: "text",
            text: "❌ ระบุหมวดหมู่ใหม่ด้วย\n\n✅ ตัวอย่าง: /expense edit category อาหาร",
          },
        ]);
        return;
      }

      await seedDefaultCategories(userId);
      const categories = await getCategoriesByUser(userId);
      const category = matchCategory(categories, value);

      if (!category) {
        await sendMessage(req as Parameters<typeof sendMessage>[0], [
          { type: "text", text: "❌ ไม่พบหมวดหมู่ กรุณาลองใหม่" },
        ]);
        return;
      }

      const updated = await updateTransaction(latest.id, userId, {
        categoryId: category.id,
      });
      const isIncome = updated.type === "INCOME";
      const sign = isIncome ? "+" : "-";

      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: [
            "✅ แก้ไขหมวดหมู่สำเร็จ",
            "",
            `${updated.category.icon ?? "📦"} ${updated.category.name}`,
            `💵 ${sign}${fmt(updated.amount, hide)} บาท`,
            `📅 ${updated.transDate}`,
          ].join("\n"),
        },
      ]);
      return;
    }

    // ไม่รู้จัก field
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: [
          "❌ ไม่เข้าใจคำสั่ง",
          "",
          "✅ ตัวอย่าง:",
          "  /expense edit 300",
          "  /expense edit amount 300",
          "  /expense edit note ข้าวมันไก่",
          "  /expense edit category อาหาร",
        ].join("\n"),
      },
    ]);
  } catch (err) {
    console.error("[Expense Edit] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถแก้ไขได้ กรุณาลองใหม่" },
    ]);
  }
}

/** ดูสรุปเดือนอื่น: /expense month 04 หรือ /expense month 2025-04 */
async function handleMonth(req: unknown, userId: string, args: string[], hide = false) {
  const sendMessage = await getSendMessage();
  const monthArg = args[0];

  if (!monthArg) {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: [
          "❌ ระบุเดือนด้วย",
          "",
          "✅ ตัวอย่าง:",
          "  /expense month 04          (เม.ย. ปีนี้)",
          "  /expense month 2025-04",
        ].join("\n"),
      },
    ]);
    return;
  }

  let transMonth: string;

  // รูปแบบ YYYY-MM
  if (/^\d{4}-\d{1,2}$/.test(monthArg)) {
    const [y, m] = monthArg.split("-");
    transMonth = `${y}-${m!.padStart(2, "0")}`;
  }
  // รูปแบบ MM เท่านั้น → ใช้ปีปัจจุบัน
  else if (/^\d{1,2}$/.test(monthArg)) {
    const m = parseInt(monthArg, 10);
    if (m < 1 || m > 12) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: `❌ เดือนไม่ถูกต้อง: "${monthArg}" (ใช้ 1-12)` },
      ]);
      return;
    }
    const year = new Date().getFullYear();
    transMonth = `${year}-${String(m).padStart(2, "0")}`;
  } else {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: `❌ รูปแบบเดือนไม่ถูกต้อง: "${monthArg}"\n\n✅ ใช้: 04 หรือ 2025-04` },
    ]);
    return;
  }

  await handleSummary(req, userId, hide, transMonth);
}

/** สรุปวันนี้ */
async function handleToday(req: unknown, userId: string, hide = false) {
  const sendMessage = await getSendMessage();
  const today = todayDate();

  try {
    const rows = await getTransactions({ userId, startDate: today, endDate: today, limit: 50 });

    if (rows.length === 0) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: `📭 วันนี้ (${today}) ยังไม่มีรายการ` },
      ]);
      return;
    }

    const totalIncome = rows
      .filter((r) => r.type === "INCOME")
      .reduce((acc, r) => acc + r.amount, 0);
    const totalExpense = rows
      .filter((r) => r.type === "EXPENSE")
      .reduce((acc, r) => acc + r.amount, 0);

    const lines = [
      `📅 สรุปวันนี้ (${formatDateShortThai(today)})`,
      "─────────────────────",
      `📈 รายรับ: +${fmt(totalIncome, hide)} บาท`,
      `📉 รายจ่าย: -${fmt(totalExpense, hide)} บาท`,
      `⚖️ คงเหลือ: ${totalIncome - totalExpense >= 0 ? "+" : "-"}${fmt(Math.abs(totalIncome - totalExpense), hide)} บาท`,
      `📋 ${rows.length} รายการ`,
      "─────────────────────",
    ];

    for (const r of rows) {
      const isIncome = r.type === "INCOME";
      const sign = isIncome ? "+" : "-";
      const emoji = r.category.icon ?? (isIncome ? "💰" : "💸");
      lines.push(`${emoji} ${r.category.name}  ${sign}${fmt(r.amount, hide)}`);
      if (r.note) lines.push(`  📝 ${r.note}`);
    }

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: lines.join("\n") },
    ]);
  } catch (err) {
    console.error("[Expense Today] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถโหลดรายการวันนี้ได้ กรุณาลองใหม่" },
    ]);
  }
}

/** สรุปสัปดาห์นี้ (จันทร์ - อาทิตย์) */
async function handleWeek(req: unknown, userId: string, hide = false) {
  const sendMessage = await getSendMessage();
  const monday = mondayOfThisWeek();
  const sunday = sundayOfThisWeek();

  try {
    const rows = await getTransactions({
      userId,
      startDate: monday,
      endDate: sunday,
      limit: 50,
    });

    if (rows.length === 0) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: `📭 สัปดาห์นี้ (${formatDateShortThai(monday)} - ${formatDateShortThai(sunday)}) ยังไม่มีรายการ`,
        },
      ]);
      return;
    }

    const totalIncome = rows
      .filter((r) => r.type === "INCOME")
      .reduce((acc, r) => acc + r.amount, 0);
    const totalExpense = rows
      .filter((r) => r.type === "EXPENSE")
      .reduce((acc, r) => acc + r.amount, 0);

    // Group by date
    const byDate = new Map<string, TransactionWithCategory[]>();
    for (const r of rows) {
      const key = r.transDate;
      const arr = byDate.get(key) ?? [];
      arr.push(r);
      byDate.set(key, arr);
    }

    const lines = [
      `📆 สรุปสัปดาห์นี้`,
      `${formatDateShortThai(monday)} - ${formatDateShortThai(sunday)}`,
      "─────────────────────",
      `📈 รายรับ: +${fmt(totalIncome, hide)} บาท`,
      `📉 รายจ่าย: -${fmt(totalExpense, hide)} บาท`,
      `⚖️ คงเหลือ: ${totalIncome - totalExpense >= 0 ? "+" : "-"}${fmt(Math.abs(totalIncome - totalExpense), hide)} บาท`,
      `📋 ${rows.length} รายการ`,
      "─────────────────────",
    ];

    // แสดงแยกตามวัน
    const sortedDates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));
    for (const date of sortedDates) {
      const dayRows = byDate.get(date)!;
      const dayTotal = dayRows.reduce((acc, r) => {
        return acc + (r.type === "EXPENSE" ? -r.amount : r.amount);
      }, 0);

      lines.push(
        "",
        `📅 ${formatDateShortThai(date)} (${dayRows.length} รายการ, ${dayTotal >= 0 ? "+" : ""}${fmt(Math.abs(dayTotal), hide)})`,
      );

      for (const r of dayRows) {
        const isIncome = r.type === "INCOME";
        const sign = isIncome ? "+" : "-";
        const emoji = r.category.icon ?? (isIncome ? "💰" : "💸");
        lines.push(`  ${emoji} ${r.category.name}  ${sign}${fmt(r.amount, hide)}`);
      }
    }

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: lines.join("\n") },
    ]);
  } catch (err) {
    console.error("[Expense Week] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถโหลดรายการสัปดาห์นี้ได้ กรุณาลองใหม่" },
    ]);
  }
}

/** Filter ตามหมวดหมู่: /expense อาหาร */
async function handleFilterByCategory(
  req: unknown,
  userId: string,
  categoryName: string,
  hide = false,
) {
  const sendMessage = await getSendMessage();

  try {
    await seedDefaultCategories(userId);
    const categories = await getCategoriesByUser(userId);
    const category = matchCategory(categories, categoryName);

    if (!category) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: `❌ ไม่พบหมวดหมู่ "${categoryName}"` },
      ]);
      return;
    }

    const transMonth = getCurrentMonth();
    const rows = await getTransactions({
      userId,
      transMonth,
      categoryId: category.id,
      limit: 10,
    });

    if (rows.length === 0) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: `📭 ไม่มีรายการหมวด "${category.name}" ในเดือนนี้`,
        },
      ]);
      return;
    }

    const total = rows.reduce((acc, r) => acc + r.amount, 0);
    const lines = [
      `${category.icon ?? "📦"} หมวด: ${category.name}`,
      `📅 ${formatMonthThai(transMonth)}`,
      "─────────────────────",
      `💵 รวม: ${fmt(total, hide)} บาท (${rows.length} รายการ)`,
      "─────────────────────",
    ];

    for (const r of rows) {
      const isIncome = r.type === "INCOME";
      const sign = isIncome ? "+" : "-";
      lines.push(`${sign}${fmt(r.amount, hide)} • ${formatDateShortThai(r.transDate)}`);
      if (r.note) lines.push(`  📝 ${r.note}`);
    }

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: lines.join("\n") },
    ]);
  } catch (err) {
    console.error("[Expense Filter] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถโหลดรายการได้ กรุณาลองใหม่" },
    ]);
  }
}

/**
 * หา category ที่ตรงกับชื่อที่ user พิมพ์ (fuzzy match)
 * ถ้าไม่พบ ใช้หมวด "อื่นๆ"
 */
function matchCategory(
  categories: ExpenseCategory[],
  query: string | undefined,
): ExpenseCategory | undefined {
  const filtered = categories.filter((c) => c.isActive);
  if (!query) {
    // fallback: อื่นๆ
    return filtered.find((c) => c.name.includes("อื่น")) ?? filtered[0];
  }

  const q = query.trim().toLowerCase();
  // exact match ก่อน
  const exact = filtered.find((c) => c.name.toLowerCase() === q);
  if (exact) return exact;

  // partial match
  const partial = filtered.find(
    (c) => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()),
  );
  return (
    partial ?? filtered.find((c) => c.name.includes("อื่น")) ?? filtered[0]
  );
}

/**
 * ตรวจว่า string ตรงกับชื่อ category ไหม
 * ใช้สำหรับ route sub-command ที่เป็นชื่อหมวดหมู่
 */
async function isCategoryName(userId: string, name: string): Promise<boolean> {
  try {
    await seedDefaultCategories(userId);
    const categories = await getCategoriesByUser(userId);
    const q = name.trim().toLowerCase();
    return categories.some(
      (c) =>
        c.isActive &&
        (c.name.toLowerCase() === q ||
          c.name.toLowerCase().includes(q) ||
          q.includes(c.name.toLowerCase())),
    );
  } catch {
    return false;
  }
}

/** บันทึก transaction (INCOME หรือ EXPENSE) -- รองรับ #note และ @tags */
async function handleAdd(
  req: unknown,
  userId: string,
  args: string[],
  type: "INCOME" | "EXPENSE",
  hide = false,
) {
  const sendMessage = await getSendMessage();

  const parsed = parseAddArgs(args);

  if (!parsed.amountStr) {
    const example =
      type === "EXPENSE"
        ? "/จ่าย 250 อาหาร #ข้าวมันไก่"
        : "/รับ 30000 เงินเดือน";
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: [
          "❌ ระบุจำนวนเงินด้วย",
          "",
          `✅ ตัวอย่าง: ${example}`,
          "",
          "💡 เพิ่ม note: #ข้อความ",
          "💡 เพิ่ม tag: @tag",
        ].join("\n"),
      },
    ]);
    return;
  }

  const amount = parseFloat(parsed.amountStr.replace(/,/g, ""));
  if (isNaN(amount) || amount <= 0) {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: `❌ จำนวนเงินไม่ถูกต้อง: "${parsed.amountStr}"` },
    ]);
    return;
  }

  try {
    // Seed default categories ถ้ายังไม่มี
    await seedDefaultCategories(userId);
    const categories = await getCategoriesByUser(userId);
    const category = matchCategory(categories, parsed.categoryQuery);

    if (!category) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: "❌ ไม่พบหมวดหมู่ กรุณาลองใหม่" },
      ]);
      return;
    }

    const tx = await createTransaction({
      userId,
      categoryId: category.id,
      type,
      amount,
      note: parsed.note,
      tags: parsed.tags?.join(","),
      transDate: toTransDate(),
    });

    const isIncome = type === "INCOME";
    const sign = isIncome ? "+" : "-";
    const emoji = isIncome ? "📈" : "📉";

    const responseLines = [
      `✅ บันทึก${isIncome ? "รายรับ" : "รายจ่าย"}สำเร็จ`,
      "",
      `${emoji} ${type === "INCOME" ? "รายรับ" : "รายจ่าย"}`,
      `${category.icon ?? ""} หมวดหมู่: ${category.name}`,
      `💵 จำนวน: ${sign}${fmt(tx.amount, hide)} บาท`,
      `📅 วันที่: ${tx.transDate}`,
    ];

    if (parsed.note) {
      responseLines.push(`📝 Note: ${parsed.note}`);
    }
    if (parsed.tags && parsed.tags.length > 0) {
      responseLines.push(
        `🏷️ Tags: ${parsed.tags.map((t) => `@${t}`).join(" ")}`,
      );
    }

    responseLines.push("", "🔗 ดูทั้งหมด: /expense");

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: responseLines.join("\n") },
    ]);
  } catch (err) {
    console.error("[Expense Add] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถบันทึกได้ กรุณาลองใหม่" },
    ]);
  }
}

// ---------------------------------------------------------------------------
// Main handler (export)
// ---------------------------------------------------------------------------

/**
 * handleExpenseCommand -- entry point จาก handleCommand.ts
 *
 * @param req   LINE webhook request
 * @param conditions  args หลัง command (เช่น ["add","250","อาหาร"])
 * @param forceType  "INCOME" = คำสั่ง /รับ ที่เรียกตรง, "EXPENSE" = /จ่าย
 */
export async function handleExpenseCommand(
  req: unknown,
  conditions: string[],
  forceType?: "INCOME" | "EXPENSE",
): Promise<void> {
  const sendMessage = await getSendMessage();

  // --- ตรวจสอบ LINE userId ---
  const lineUserId = getLineUserId(req);
  if (!lineUserId) {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถระบุตัวตนผู้ใช้ได้" },
    ]);
    return;
  }

  // --- Map LINE userId -> DB userId ---
  const userId = await resolveDbUserId(lineUserId);
  if (!userId) {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: [
          "❌ ไม่พบบัญชีในระบบ",
          "",
          "กรุณาเข้าสู่ระบบผ่านเว็บไซต์ก่อนใช้งาน",
          "หรือติดต่อผู้ดูแลระบบ",
        ].join("\n"),
      },
    ]);
    return;
  }

  // --- ตรวจสอบ privacy setting ---
  const isGroup = isGroupSource(req);
  const hide = await shouldHideAmountsForLine(userId, isGroup);

  // --- Route sub-command ---
  const subCommand = conditions[0]?.toLowerCase();
  const args = conditions.slice(1);

  // /รับ [จำนวน] [หมวด?] -- force INCOME
  if (forceType === "INCOME") {
    await handleAdd(req, userId, conditions, "INCOME", hide);
    return;
  }

  // /จ่าย [จำนวน] [หมวด?] -- force EXPENSE
  if (forceType === "EXPENSE") {
    await handleAdd(req, userId, conditions, "EXPENSE", hide);
    return;
  }

  switch (subCommand) {
    // --- Help ---
    case "help":
    case "ช่วยเหลือ":
    case "h":
    case "?":
      await handleHelp(req);
      break;

    // --- Add (explicit sub-command) ---
    case "add":
    case "บันทึก":
    case "จ่าย":
    case "เพิ่ม":
      await handleAdd(req, userId, args, "EXPENSE", hide);
      break;

    case "income":
    case "รับ":
    case "รายรับ":
      await handleAdd(req, userId, args, "INCOME", hide);
      break;

    // --- List ---
    case "list":
    case "ล่าสุด":
    case "history":
    case "ประวัติ": {
      const count = args[0] ? parseInt(args[0], 10) : 5;
      await handleList(req, userId, hide, isNaN(count) ? 5 : count);
      break;
    }

    // --- Delete ---
    case "del":
    case "delete":
    case "ลบ":
    case "rm":
      await handleDelete(req, userId, args, hide);
      break;

    // --- Edit ---
    case "edit":
    case "แก้":
    case "แก้ไข":
      await handleEdit(req, userId, args, hide);
      break;

    // --- Month ---
    case "month":
    case "เดือน":
    case "m":
      await handleMonth(req, userId, args, hide);
      break;

    // --- Today ---
    case "today":
    case "วันนี้":
      await handleToday(req, userId, hide);
      break;

    // --- Week ---
    case "week":
    case "สัปดาห์":
    case "wk":
      await handleWeek(req, userId, hide);
      break;

    // --- Summary (default) ---
    case "sum":
    case "สรุป":
    case "summary":
      await handleSummary(req, userId, hide);
      break;

    case undefined:
      await handleSummary(req, userId, hide);
      break;

    default: {
      // ถ้า sub-command เป็นตัวเลข → quick add รายจ่าย
      // เช่น "/expense 250 อาหาร"
      if (subCommand && !isNaN(parseFloat(subCommand))) {
        await handleAdd(req, userId, conditions, "EXPENSE", hide);
        break;
      }

      // ถ้า sub-command ตรงกับชื่อ category → filter ตามหมวดหมู่
      // เช่น "/expense อาหาร"
      if (subCommand && (await isCategoryName(userId, subCommand))) {
        await handleFilterByCategory(req, userId, subCommand, hide);
        break;
      }

      // fallback → สรุปเดือนปัจจุบัน
      await handleSummary(req, userId, hide);
    }
  }
}

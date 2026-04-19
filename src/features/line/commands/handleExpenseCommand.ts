/**
 * handleExpenseCommand — จัดการคำสั่งรายรับรายจ่ายผ่าน LINE Bot
 *
 * คำสั่งที่รองรับ:
 *   /expense                          → สรุปเดือนปัจจุบัน
 *   /expense sum | สรุป              → สรุปเดือนปัจจุบัน (alias)
 *   /expense add [จำนวน] [หมวด?]    → บันทึกรายจ่าย
 *   /รับ [จำนวน] [หมวด?]            → บันทึกรายรับ (shortcut)
 *   /expense list | ล่าสุด           → รายการ 5 รายการล่าสุด
 *   /expense help | ช่วยเหลือ        → แสดงคำสั่ง
 */

import { findAccountByLineMessagingApiId } from "@/lib/auth/account-linking";
import {
  getTransactions,
  getMonthlySummary,
  createTransaction,
  getCategorySummary,
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
} from "@/features/expenses/helpers";
import type { ExpenseCategory, MonthlySummary, CategorySummary } from "@/features/expenses/types";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { env } from "@/env.mjs";

// ─────────────────────────────────────────────
// Lazy import sendMessage (pattern เดียวกับ command อื่น)
// ─────────────────────────────────────────────
const getSendMessage = async () => {
  const mod = await import("@/lib/utils/line-utils");
  return mod.sendMessage;
};

// ─────────────────────────────────────────────
// Flex Message builder
// ─────────────────────────────────────────────

function createExpenseSummaryBubble(
  summary: MonthlySummary,
  categories: CategorySummary[],
  transMonth: string,
  frontendUrl: string,
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
    row(`📈 รายรับ`, `+${fmt(summary.totalIncome)} บาท`, "#16A34A"),
    row(`📉 รายจ่าย`, `-${fmt(summary.totalExpense)} บาท`, "#EF4444"),
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
          text: `${balanceSign}${fmt(Math.abs(balance))} บาท`,
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
          `${fmt(c.total)} บาท`,
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

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** ดึง LINE userId จาก webhook request */
function getLineUserId(req: unknown): string | null {
  const r = req as {
    body?: { events?: Array<{ source?: { userId?: string } }> };
  };
  return r.body?.events?.[0]?.source?.userId ?? null;
}

/** Map LINE Messaging API userId → DB userId (ผ่าน Account table) */
async function resolveDbUserId(lineUserId: string): Promise<string | null> {
  const account = await findAccountByLineMessagingApiId(lineUserId);
  return account?.userId ?? null;
}

/** Format ตัวเลขพร้อม sign */
const fmt = (n: number) => formatAmount(Math.abs(n));

// ─────────────────────────────────────────────
// Sub-handlers
// ─────────────────────────────────────────────

/** แสดง help */
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

  const bubble = {
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
          text: "คำสั่งทั้งหมด",
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
          "ย่อได้: /exp 1200  หรือ  /e 50",
        ]),
        { type: "separator" },
        section("📈", "บันทึกรายรับ", [
          "/รับ [จำนวน] [หมวด]",
          "ตัวอย่าง: /รับ 30000 เงินเดือน",
          "ย่อได้: /i 5000 โบนัส",
        ]),
        { type: "separator" },
        section("📊", "ดูสรุปเดือนนี้", ["/expense  หรือ  /expense sum"]),
        { type: "separator" },
        section("📋", "ดูรายการล่าสุด", ["/expense list"]),
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
              text: "ไม่ระบุหมวด → ใช้หมวด 'อื่นๆ' อัตโนมัติ",
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
  };

  await sendMessage(
    req as Parameters<typeof sendMessage>[0],
    flexMessage([bubble]),
  );
}

/** แสดงสรุปเดือนปัจจุบัน */
async function handleSummary(req: unknown, userId: string) {
  const sendMessage = await getSendMessage();
  const transMonth = getCurrentMonth();

  try {
    const [summary, categories] = await Promise.all([
      getMonthlySummary(userId, transMonth),
      getCategorySummary(userId, transMonth),
    ]);

    const bubble = createExpenseSummaryBubble(
      summary,
      categories,
      transMonth,
      env.FRONTEND_URL,
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

/** แสดงรายการล่าสุด 5 รายการ */
async function handleList(req: unknown, userId: string) {
  const sendMessage = await getSendMessage();

  try {
    const rows = await getTransactions({ userId, limit: 5 });

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
        `  ${sign}${fmt(r.amount)} บาท • ${r.transDate}`,
        r.note ? `  📝 ${r.note}` : "",
      );
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

/** บันทึก transaction (INCOME หรือ EXPENSE) */
async function handleAdd(
  req: unknown,
  userId: string,
  args: string[],
  type: "INCOME" | "EXPENSE",
) {
  const sendMessage = await getSendMessage();

  // args[0] = จำนวนเงิน, args[1..] = ชื่อหมวดหมู่ (optional)
  const amountStr = args[0];
  if (!amountStr) {
    const example =
      type === "EXPENSE" ? "/expense add 250 อาหาร" : "/รับ 30000 เงินเดือน";
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: ["❌ ระบุจำนวนเงินด้วย", "", `✅ ตัวอย่าง: ${example}`].join(
          "\n",
        ),
      },
    ]);
    return;
  }

  const amount = parseFloat(amountStr.replace(/,/g, ""));
  if (isNaN(amount) || amount <= 0) {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: `❌ จำนวนเงินไม่ถูกต้อง: "${amountStr}"` },
    ]);
    return;
  }

  const categoryQuery = args.slice(1).join(" ") || undefined;

  try {
    // Seed default categories ถ้ายังไม่มี
    await seedDefaultCategories(userId);
    const categories = await getCategoriesByUser(userId);
    const category = matchCategory(categories, categoryQuery);

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
      transDate: toTransDate(),
    });

    const isIncome = type === "INCOME";
    const sign = isIncome ? "+" : "-";
    const emoji = isIncome ? "📈" : "📉";

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: [
          `✅ บันทึก${isIncome ? "รายรับ" : "รายจ่าย"}สำเร็จ`,
          "",
          `${emoji} ${type === "INCOME" ? "รายรับ" : "รายจ่าย"}`,
          `${category.icon ?? ""} หมวดหมู่: ${category.name}`,
          `💵 จำนวน: ${sign}${fmt(tx.amount)} บาท`,
          `📅 วันที่: ${tx.transDate}`,
          "",
          "🔗 ดูทั้งหมด: /expense",
        ].join("\n"),
      },
    ]);
  } catch (err) {
    console.error("[Expense Add] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถบันทึกได้ กรุณาลองใหม่" },
    ]);
  }
}

// ─────────────────────────────────────────────
// Main handler (export)
// ─────────────────────────────────────────────

/**
 * handleExpenseCommand — entry point จาก handleCommand.ts
 *
 * @param req   LINE webhook request
 * @param conditions  args หลัง command (เช่น ["add","250","อาหาร"])
 * @param forceType  "INCOME" = คำสั่ง /รับ ที่เรียกตรง
 */
export async function handleExpenseCommand(
  req: unknown,
  conditions: string[],
  forceType?: "INCOME" | "EXPENSE",
): Promise<void> {
  const sendMessage = await getSendMessage();

  // ─── ตรวจสอบ LINE userId ──────────────────────────────────────────────────
  const lineUserId = getLineUserId(req);
  if (!lineUserId) {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถระบุตัวตนผู้ใช้ได้" },
    ]);
    return;
  }

  // ─── Map LINE userId → DB userId ─────────────────────────────────────────
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

  // ─── Route sub-command ────────────────────────────────────────────────────
  const subCommand = conditions[0]?.toLowerCase();
  const args = conditions.slice(1);

  // /รับ [จำนวน] [หมวด?] — force INCOME
  if (forceType === "INCOME") {
    await handleAdd(req, userId, conditions, "INCOME");
    return;
  }

  switch (subCommand) {
    case "help":
    case "ช่วยเหลือ":
    case "h":
      await handleHelp(req);
      break;

    case "add":
    case "บันทึก":
    case "จ่าย":
    case "เพิ่ม":
      await handleAdd(req, userId, args, "EXPENSE");
      break;

    case "income":
    case "รับ":
    case "รายรับ":
      await handleAdd(req, userId, args, "INCOME");
      break;

    case "list":
    case "ล่าสุด":
    case "history":
    case "ประวัติ":
      await handleList(req, userId);
      break;

    case "sum":
    case "สรุป":
    case "summary":
    case undefined:
      await handleSummary(req, userId);
      break;

    default:
      // ถ้า sub-command เป็นตัวเลข ให้ถือว่าเป็น quick add รายจ่าย
      // เช่น "/expense 250 อาหาร"
      if (subCommand && !isNaN(parseFloat(subCommand))) {
        await handleAdd(req, userId, conditions, "EXPENSE");
      } else {
        await handleSummary(req, userId);
      }
  }
}

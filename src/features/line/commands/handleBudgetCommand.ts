/**
 * handleBudgetCommand -- จัดการงบประมาณ (Budget) ผ่าน LINE Bot
 *
 * คำสั่งที่รองรับ:
 *   /budget                              -> ดูสถานะงบทั้งหมด
 *   /budget status [MM?]                 -> ดูสถานะงบเดือนปัจจุบัน/เดือนอื่น
 *   /budget set [หมวด] [จำนวน] [%?]    -> ตั้งงบ (default 80% alert)
 *   /budget list                          -> รายการงบทั้งหมด
 *   /budget del [หมวด]                   -> ลบงบ
 *   /budget alert [หมวด] [%]             -> ตั้งเป้าแจ้งเตือน
 *   /budget help                          -> แสดงคำสั่ง
 */

import { findAccountByLineMessagingApiId } from "@/lib/auth/account-linking";
import {
  getBudgetsByUser,
  getBudgetUsage,
  getBudgetByCategory,
  createBudget,
  updateBudget,
  deactivateBudget,
} from "@/features/expenses/services/budget.server";
import {
  getCategoriesByUser,
  seedDefaultCategories,
} from "@/features/expenses/services/category.server";
import { getCurrentMonth, formatMonthThai } from "@/features/expenses/helpers";
import type { BudgetUsage } from "@/features/expenses/services/budget.server";
import type { ExpenseCategory } from "@/features/expenses/types";
import { env } from "@/env.mjs";

// ---------------------------------------------------------------------------
// Lazy import sendMessage
// ---------------------------------------------------------------------------
const getSendMessage = async () => {
  const mod = await import("@/lib/utils/line-utils");
  return mod.sendMessage;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLineUserId(req: unknown): string | null {
  const r = req as {
    body?: { events?: Array<{ source?: { userId?: string } }> };
  };
  return r.body?.events?.[0]?.source?.userId ?? null;
}

async function resolveDbUserId(lineUserId: string): Promise<string | null> {
  const account = await findAccountByLineMessagingApiId(lineUserId);
  return account?.userId ?? null;
}

const MASKED = "••••••";

const fmt = (n: number, hide = false) =>
  hide ? MASKED : n.toLocaleString("th-TH", { maximumFractionDigits: 0 });

function matchCategory(
  categories: ExpenseCategory[],
  query: string | undefined,
): ExpenseCategory | undefined {
  if (!query) return undefined;
  const filtered = categories.filter((c) => c.isActive);
  const q = query.trim().toLowerCase();
  const exact = filtered.find((c) => c.name.toLowerCase() === q);
  if (exact) return exact;
  const partial = filtered.find(
    (c) =>
      c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()),
  );
  return partial;
}

// ---------------------------------------------------------------------------
// Sub-handlers
// ---------------------------------------------------------------------------

/** แสดง help */
async function handleHelp(req: unknown) {
  const sendMessage = await getSendMessage();

  await sendMessage(req as Parameters<typeof sendMessage>[0], [
    {
      type: "text",
      text: [
        "💰 จัดการงบประมาณ (Budget)",
        "─────────────────────",
        "",
        "📊 ดูสถานะงบ:",
        "  /budget",
        "  /budget status",
        "",
        "🎯 ตั้งงบประมาณ:",
        "  /budget set อาหาร 5000",
        "  /budget set อาหาร 5000 90 (แจ้งเตือน 90%)",
        "  /budget set total 20000 (งบรวม)",
        "",
        "📋 รายการงบ:",
        "  /budget list",
        "",
        "🗑️ ลบงบ:",
        "  /budget del อาหาร",
        "",
        "🔔 ตั้งเป้าแจ้งเตือน:",
        "  /budget alert อาหาร 85",
        "",
        "💡 เมื่อใช้เกินงบจะแจ้งเตือนอัตโนมัติ",
      ].join("\n"),
    },
  ]);
}

/** แสดงสถานะงบทั้งหมดในเดือนปัจจุบัน */
async function handleStatus(
  req: unknown,
  userId: string,
  hide = false,
  transMonth?: string,
) {
  const sendMessage = await getSendMessage();
  const month = transMonth ?? getCurrentMonth();

  try {
    const usages = await getBudgetUsage(userId, month);

    if (usages.length === 0) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: [
            "📊 ยังไม่มีงบประมาณ",
            "",
            "ตั้งงบได้ที่:",
            "  /budget set อาหาร 5000",
            "  /budget set total 20000",
          ].join("\n"),
        },
      ]);
      return;
    }

    const lines = [
      `💰 สถานะงบประมาณ`,
      `📅 ${formatMonthThai(month)}`,
      "─────────────────────",
    ];

    for (const u of usages) {
      const icon = u.budget.category?.icon ?? "📦";
      const name = u.budget.category?.name || "งบรวม";
      const statusIcon = u.isOverBudget ? "🔴" : u.isNearLimit ? "🟡" : "🟢";
      const percentageSign = u.isOverBudget ? "!" : "";

      lines.push(
        `${statusIcon} ${icon} ${name}`,
        `  ใช้ ${fmt(u.spent, hide)} / ${fmt(u.budget.amount, hide)} (${Math.min(
          u.percentage,
          100,
        ).toFixed(0)}${percentageSign}%)`,
        `  เหลือ ${fmt(u.remaining, hide)} บาท`,
      );
    }

    lines.push(
      "",
      "💡 ปัญหา:",
      "  🔴 = เกินงบ",
      "  🟡 = ใกล้เกินงบ",
      "  🟢 = ปลอดภัย",
    );

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: lines.join("\n") },
    ]);
  } catch (err) {
    console.error("[Budget Status] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถโหลดสถานะงบได้ กรุณาลองใหม่" },
    ]);
  }
}

/** ตั้งงบประมาณ: /budget set [category?] [amount] [alertAt?] */
async function handleSet(req: unknown, userId: string, args: string[], hide = false) {
  const sendMessage = await getSendMessage();

  if (args.length < 1) {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: [
          "❌ ระบุจำนวนเงินด้วย",
          "",
          "✅ ตัวอย่าง:",
          "  /budget set อาหาร 5000",
          "  /budget set อาหาร 5000 90 (แจ้งเตือน 90%)",
          "  /budget set total 20000 (งบรวม)",
        ].join("\n"),
      },
    ]);
    return;
  }

  try {
    // Parse args: [category?] amount [alertAt?]
    let categoryQuery: string | undefined;
    let amountStr: string;
    let alertAt = 80; // default

    // Check if first arg is a number → no category specified (total budget)
    if (!isNaN(parseFloat(args[0]!.replace(/,/g, "")))) {
      amountStr = args[0]!;
      if (args[1] && !isNaN(parseFloat(args[1]!.replace(/,/g, "")))) {
        alertAt = parseFloat(args[1]!.replace(/,/g, ""));
      }
    } else {
      // First arg is category name
      categoryQuery = args[0]!;
      amountStr = args[1] || "";
      if (args[2] && !isNaN(parseFloat(args[2]!.replace(/,/g, "")))) {
        alertAt = parseFloat(args[2]!.replace(/,/g, ""));
      }
    }

    const amount = parseFloat(amountStr.replace(/,/g, ""));
    if (isNaN(amount) || amount <= 0) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: `❌ จำนวนเงินไม่ถูกต้อง: "${amountStr}"` },
      ]);
      return;
    }

    if (alertAt < 1 || alertAt > 100) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: "❌ เปอร์เซ็นต์แจ้งเตือนต้องอยู่ระหว่าง 1-100" },
      ]);
      return;
    }

    // Resolve category
    let categoryId: string | null = null;
    if (categoryQuery) {
      await seedDefaultCategories(userId);
      const categories = await getCategoriesByUser(userId);
      const category = matchCategory(categories, categoryQuery);

      if (!category) {
        await sendMessage(req as Parameters<typeof sendMessage>[0], [
          { type: "text", text: `❌ ไม่พบหมวดหมู่ "${categoryQuery}"` },
        ]);
        return;
      }

      categoryId = category.id;
    }

    // Check if budget exists for this category
    const existing = categoryId
      ? await getBudgetByCategory(userId, categoryId)
      : null;

    if (existing) {
      // Update existing
      const updated = await updateBudget(existing.id, userId, {
        amount,
        alertAt,
      });
      const categoryName = updated.category?.name || "งบรวม";
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: [
            "✅ อัปเดตงบประมาณสำเร็จ",
            "",
            `${updated.category?.icon || "💰"} ${categoryName}`,
            `💵 ${fmt(updated.amount, hide)} บาท/เดือน`,
            `🔔 แจ้งเตือนที่ ${updated.alertAt}%`,
          ].join("\n"),
        },
      ]);
    } else {
      // Create new
      const budget = await createBudget({
        userId,
        categoryId,
        type: "EXPENSE",
        amount,
        alertAt,
      });
      const categoryName = budget.category?.name || "งบรวม";
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: [
            "✅ ตั้งงบประมาณสำเร็จ",
            "",
            `${budget.category?.icon || "💰"} ${categoryName}`,
            `💵 ${fmt(budget.amount, hide)} บาท/เดือน`,
            `🔔 แจ้งเตือนที่ ${budget.alertAt}%`,
          ].join("\n"),
        },
      ]);
    }
  } catch (err) {
    console.error("[Budget Set] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถตั้งงบได้ กรุณาลองใหม่" },
    ]);
  }
}

/** แสดงรายการงบทั้งหมด */
async function handleList(req: unknown, userId: string, hide = false) {
  const sendMessage = await getSendMessage();

  try {
    const budgets = await getBudgetsByUser(userId);

    if (budgets.length === 0) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: [
            "📋 ยังไม่มีงบประมาณ",
            "",
            "ตั้งงบได้ที่:",
            "  /budget set อาหาร 5000",
            "  /budget set total 20000",
          ].join("\n"),
        },
      ]);
      return;
    }

    const lines = [
      `📋 รายการงบประมาณ (${budgets.length})`,
      "─────────────────────",
    ];

    for (const b of budgets) {
      const icon = b.category?.icon || "💰";
      const name = b.category?.name || "งบรวม";
      const activeBadge = b.isActive ? "" : " (❌ ปิดใช้งาน)";
      lines.push(
        `${icon} ${name}${activeBadge}`,
        `  💵 ${fmt(b.amount, hide)} บาท/เดือน`,
        `  🔔 แจ้งเตือน ${b.alertAt}%`,
      );
    }

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: lines.join("\n") },
    ]);
  } catch (err) {
    console.error("[Budget List] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถโหลดรายการงบได้ กรุณาลองใหม่" },
    ]);
  }
}

/** ลบงบ: /budget del [category] */
async function handleDelete(req: unknown, userId: string, args: string[]) {
  const sendMessage = await getSendMessage();

  if (args.length === 0) {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: [
          "❌ ระบุหมวดหมู่ที่ต้องการลบ",
          "",
          "✅ ตัวอย่าง: /budget del อาหาร",
          "✅ ลบงบรวม: /budget del total",
        ].join("\n"),
      },
    ]);
    return;
  }

  const categoryQuery = args.join(" ").trim();

  try {
    // Handle "total" keyword
    if (categoryQuery.toLowerCase() === "total") {
      const totalBudgets = await getBudgetsByUser(userId);
      const totalBudget = totalBudgets.find((b) => !b.categoryId);

      if (!totalBudget) {
        await sendMessage(req as Parameters<typeof sendMessage>[0], [
          { type: "text", text: "❌ ไม่พบงบรวม" },
        ]);
        return;
      }

      await deactivateBudget(totalBudget.id, userId);
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: "🗑️ ลบงบรวมสำเร็จ" },
      ]);
      return;
    }

    // Find budget by category
    await seedDefaultCategories(userId);
    const categories = await getCategoriesByUser(userId);
    const category = matchCategory(categories, categoryQuery);

    if (!category) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: `❌ ไม่พบหมวดหมู่ "${categoryQuery}"` },
      ]);
      return;
    }

    const budget = await getBudgetByCategory(userId, category.id);

    if (!budget) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: `❌ ไม่พบงบประมาณสำหรับ "${category.name}"`,
        },
      ]);
      return;
    }

    await deactivateBudget(budget.id, userId);

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: `🗑️ ลบงบ "${category.icon || "💰"} ${category.name}" สำเร็จ`,
      },
    ]);
  } catch (err) {
    console.error("[Budget Delete] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถลบงบได้ กรุณาลองใหม่" },
    ]);
  }
}

/** ตั้งเป้าแจ้งเตือน: /budget alert [category] [%] */
async function handleAlert(req: unknown, userId: string, args: string[]) {
  const sendMessage = await getSendMessage();

  if (args.length < 2) {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: [
          "❌ ระบุหมวดหมู่และเปอร์เซ็นต์",
          "",
          "✅ ตัวอย่าง:",
          "  /budget alert อาหาร 85",
          "  /budget alert total 90",
        ].join("\n"),
      },
    ]);
    return;
  }

  const categoryQuery = args[0]!;
  const percentageStr = args[1]!;
  const percentage = parseFloat(percentageStr.replace(/,/g, ""));

  if (isNaN(percentage) || percentage < 1 || percentage > 100) {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ เปอร์เซ็นต์ต้องอยู่ระหว่าง 1-100" },
    ]);
    return;
  }

  try {
    // Handle "total" keyword
    if (categoryQuery.toLowerCase() === "total") {
      const totalBudgets = await getBudgetsByUser(userId);
      const totalBudget = totalBudgets.find((b) => !b.categoryId);

      if (!totalBudget) {
        await sendMessage(req as Parameters<typeof sendMessage>[0], [
          { type: "text", text: "❌ ไม่พบงบรวม" },
        ]);
        return;
      }

      await updateBudget(totalBudget.id, userId, { alertAt: percentage });
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: `✅ ตั้งแจ้งเตือนงบรวมที่ ${percentage}%`,
        },
      ]);
      return;
    }

    // Find budget by category
    await seedDefaultCategories(userId);
    const categories = await getCategoriesByUser(userId);
    const category = matchCategory(categories, categoryQuery);

    if (!category) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: `❌ ไม่พบหมวดหมู่ "${categoryQuery}"` },
      ]);
      return;
    }

    const budget = await getBudgetByCategory(userId, category.id);

    if (!budget) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: `❌ ไม่พบงบประมาณสำหรับ "${category.name}"`,
        },
      ]);
      return;
    }

    await updateBudget(budget.id, userId, { alertAt: percentage });

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: `✅ ตั้งแจ้งเตือน "${category.icon || "💰"} ${category.name}" ที่ ${percentage}%`,
      },
    ]);
  } catch (err) {
    console.error("[Budget Alert] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถตั้งแจ้งเตือนได้ กรุณาลองใหม่" },
    ]);
  }
}

// ---------------------------------------------------------------------------
// Main handler (export)
// ---------------------------------------------------------------------------

export async function handleBudgetCommand(
  req: unknown,
  conditions: string[],
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

  // --- Route sub-command ---
  const subCommand = conditions[0]?.toLowerCase();
  const args = conditions.slice(1);

  switch (subCommand) {
    case "help":
    case "ช่วยเหลือ":
    case "h":
    case "?":
      await handleHelp(req);
      break;

    case "status":
    case "สถานะ":
      await handleStatus(req, userId);
      break;

    case "set":
    case "ตั้ง":
    case "ตั้งงบ":
    case "สร้าง":
    case "add":
    case "เพิ่ม":
      await handleSet(req, userId, args);
      break;

    case "list":
    case "รายการ":
    case "ทั้งหมด":
      await handleList(req, userId);
      break;

    case "del":
    case "delete":
    case "ลบ":
    case "rm":
      await handleDelete(req, userId, args);
      break;

    case "alert":
    case "แจ้งเตือน":
    case "เป้า":
      await handleAlert(req, userId, args);
      break;

    case undefined:
      await handleStatus(req, userId);
      break;

    default:
      // Default → show status
      await handleStatus(req, userId);
      break;
  }
}

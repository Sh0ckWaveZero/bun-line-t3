/**
 * handleCategoryCommand -- จัดการหมวดหมู่รายรับรายจ่ายผ่าน LINE Bot
 *
 * คำสั่งที่รองรับ:
 *   /category list                  -> ดูหมวดหมู่ทั้งหมด
 *   /category add [ชื่อ] [emoji?]  -> สร้างหมวดหมู่ใหม่
 *   /category del [ชื่อ]           -> ปิดใช้งาน (soft delete)
 */

import { findAccountByLineMessagingApiId } from "@/lib/auth/account-linking";
import {
  getCategoriesByUser,
  createCategory,
  seedDefaultCategories,
  deactivateCategory,
} from "@/features/expenses/services/category.server";
import type { ExpenseCategory } from "@/features/expenses/types";
import { flexMessage } from "@/lib/utils/line-message-utils";
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

/** ตรวจว่า string เป็น emoji หรือไม่ (simplified check) */
function isEmoji(str: string): boolean {
  // ตรวจสอบว่ามี emoji ซึ่งมักจะอยู่นอก ASCII range
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{200D}]|[\u{20E3}]|[\u{FE0F}]|[\u{E0020}-\u{E007F}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/u;
  return emojiRegex.test(str);
}

// ---------------------------------------------------------------------------
// Sub-handlers
// ---------------------------------------------------------------------------

/** แสดงหมวดหมู่ทั้งหมด */
async function handleList(req: unknown, userId: string) {
  const sendMessage = await getSendMessage();

  try {
    await seedDefaultCategories(userId);
    const categories = await getCategoriesByUser(userId);

    if (categories.length === 0) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: "📭 ยังไม่มีหมวดหมู่" },
      ]);
      return;
    }

    const lines = [
      `📁 หมวดหมู่ทั้งหมด (${categories.length})`,
      "─────────────────────",
    ];

    for (const c of categories) {
      const icon = c.icon ?? "📦";
      const defaultBadge = c.isDefault ? " ⭐" : "";
      lines.push(`${icon} ${c.name}${defaultBadge}`);
    }

    lines.push(
      "",
      "─────────────────────",
      "💡 สร้างใหม่: /category add ชื่อ 🎨",
      "💡 ⭐ = หมวดเริ่มต้น",
    );

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: lines.join("\n") },
    ]);
  } catch (err) {
    console.error("[Category List] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถโหลดหมวดหมู่ได้ กรุณาลองใหม่" },
    ]);
  }
}

/** สร้างหมวดหมู่ใหม่: /category add ชื่อ emoji? */
async function handleAdd(req: unknown, userId: string, args: string[]) {
  const sendMessage = await getSendMessage();

  if (args.length === 0) {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: [
          "❌ ระบุชื่อหมวดหมู่ด้วย",
          "",
          "✅ ตัวอย่าง:",
          "  /category add คาเฟ่ ☕",
          "  /category add ค่ารถ 🚗",
          "  /category add ของขวัญ",
        ].join("\n"),
      },
    ]);
    return;
  }

  // แยก name กับ emoji
  let name: string;
  let icon: string | undefined;

  // ตรวจว่า arg สุดท้ายเป็น emoji หรือไม่
  const lastArg = args[args.length - 1]!;
  if (args.length > 1 && isEmoji(lastArg)) {
    icon = lastArg;
    name = args.slice(0, -1).join(" ");
  } else {
    name = args.join(" ");
  }

  try {
    await seedDefaultCategories(userId);
    const existing = await getCategoriesByUser(userId);

    // ตรวจซ้ำ
    const duplicate = existing.find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: `❌ หมวดหมู่ "${name}" มีอยู่แล้ว (${duplicate.icon ?? "📦"})`,
        },
      ]);
      return;
    }

    const category = await createCategory({
      userId,
      name,
      icon,
    });

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: [
          "✅ สร้างหมวดหมู่สำเร็จ",
          "",
          `${category.icon ?? "📦"} ${category.name}`,
          "",
          `ใช้ได้เลย: /จ่าย 250 ${category.name}`,
        ].join("\n"),
      },
    ]);
  } catch (err) {
    console.error("[Category Add] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถสร้างหมวดหมู่ได้ กรุณาลองใหม่" },
    ]);
  }
}

/** ปิดใช้งานหมวดหมู่: /category del ชื่อ */
async function handleDeactivate(req: unknown, userId: string, args: string[]) {
  const sendMessage = await getSendMessage();

  if (args.length === 0) {
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: "❌ ระบุชื่อหมวดหมู่ที่ต้องการลบ\n\n✅ ตัวอย่าง: /category del คาเฟ่",
      },
    ]);
    return;
  }

  const name = args.join(" ").trim().toLowerCase();

  try {
    const categories = await getCategoriesByUser(userId);
    const target = categories.find((c) => c.name.toLowerCase() === name);

    if (!target) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        { type: "text", text: `❌ ไม่พบหมวดหมู่ "${args.join(" ")}"` },
      ]);
      return;
    }

    if (target.isDefault) {
      await sendMessage(req as Parameters<typeof sendMessage>[0], [
        {
          type: "text",
          text: `⚠️ หมวดหมู่ "${target.name}" เป็นหมวดเริ่มต้น ไม่สามารถลบได้`,
        },
      ]);
      return;
    }

    await deactivateCategory(target.id, userId);

    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      {
        type: "text",
        text: `🗑️ ปิดใช้งานหมวดหมู่ "${target.icon ?? "📦"} ${target.name}" สำเร็จ`,
      },
    ]);
  } catch (err) {
    console.error("[Category Deactivate] error:", err);
    await sendMessage(req as Parameters<typeof sendMessage>[0], [
      { type: "text", text: "❌ ไม่สามารถลบหมวดหมู่ได้ กรุณาลองใหม่" },
    ]);
  }
}

/** แสดง help */
async function handleHelp(req: unknown) {
  const sendMessage = await getSendMessage();

  await sendMessage(req as Parameters<typeof sendMessage>[0], [
    {
      type: "text",
      text: [
        "📁 จัดการหมวดหมู่",
        "─────────────────────",
        "",
        "📋 ดูทั้งหมด:",
        "  /category list",
        "",
        "➕ สร้างใหม่:",
        "  /category add ชื่อ emoji",
        "  เช่น /category add คาเฟ่ ☕",
        "",
        "🗑️ ลบ (ปิดใช้งาน):",
        "  /category del ชื่อ",
        "  เช่น /category del คาเฟ่",
        "",
        "💡 หมวดเริ่มต้น (⭐) ไม่สามารถลบได้",
      ].join("\n"),
    },
  ]);
}

// ---------------------------------------------------------------------------
// Main handler (export)
// ---------------------------------------------------------------------------

export async function handleCategoryCommand(
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
    case "list":
    case "ดู":
    case "ทั้งหมด":
    case undefined:
      await handleList(req, userId);
      break;

    case "add":
    case "เพิ่ม":
    case "สร้าง":
    case "new":
      await handleAdd(req, userId, args);
      break;

    case "del":
    case "delete":
    case "ลบ":
    case "rm":
      await handleDeactivate(req, userId, args);
      break;

    case "help":
    case "ช่วยเหลือ":
    case "h":
    case "?":
      await handleHelp(req);
      break;

    default:
      // ถ้าไม่ตรง sub-command ใดเลย → ถือว่าเป็นการสร้างใหม่
      // เช่น /category คาเฟ่ ☕ → เหมือน /category add คาเฟ่ ☕
      await handleAdd(req, userId, conditions);
      break;
  }
}

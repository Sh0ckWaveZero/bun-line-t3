/**
 * Expenses API — GET list / POST create
 * GET  /api/expenses?transMonth=YYYY-MM&type=INCOME|EXPENSE
 * POST /api/expenses
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth/auth";
import {
  getTransactions,
  createTransaction,
} from "@/features/expenses/services/transaction.server";
import { isCategoryOwnedByUser } from "@/features/expenses/services/category.server";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_TRANSACTION_AMOUNT,
} from "@/features/expenses/constants";

// ─────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────

const createTransactionSchema = z.object({
  categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z
    .number()
    .positive("จำนวนเงินต้องมากกว่า 0")
    .max(MAX_TRANSACTION_AMOUNT, "จำนวนเงินมากเกินไป"),
  note: z.string().max(500).optional(),
  tags: z.string().max(200).optional(),
  transDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
});

/**
 * Parse query param แบบ integer ที่ปลอดภัย
 * ป้องกัน NaN / ค่าติดลบ ที่จะทำให้ Prisma `take`/`skip` รั่วหรือผิดพลาด
 */
function safeInt(
  value: string | null,
  fallback: number,
  opts: { min: number; max?: number } = { min: 0 },
): number {
  if (value === null) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < opts.min) return fallback;
  if (opts.max !== undefined && parsed > opts.max) return opts.max;
  return parsed;
}

// ─────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const url = new URL(request.url);
    const transMonth = url.searchParams.get("transMonth") ?? undefined;
    const typeParam = url.searchParams.get("type");
    const type =
      typeParam === "INCOME" || typeParam === "EXPENSE" ? typeParam : undefined;
    const categoryId = url.searchParams.get("categoryId") ?? undefined;
    const limit = safeInt(
      url.searchParams.get("limit"),
      DEFAULT_PAGE_SIZE,
      { min: 1, max: MAX_PAGE_SIZE },
    );
    const offset = safeInt(url.searchParams.get("offset"), 0, { min: 0 });

    const transactions = await getTransactions({
      userId: session.user.id,
      transMonth,
      type,
      categoryId,
      limit,
      offset,
    });

    return Response.json({ success: true, data: transactions });
  } catch (error) {
    console.error("[GET /api/expenses]", (error as Error)?.message ?? error);
    return Response.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const body = await request.json();
    const input = createTransactionSchema.parse(body);

    // ป้องกัน IDOR: ตรวจสอบว่า categoryId เป็นของ user นี้จริงๆ
    const isOwner = await isCategoryOwnedByUser(
      input.categoryId,
      session.user.id,
    );
    if (!isOwner) {
      return Response.json(
        { error: "หมวดหมู่ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const transaction = await createTransaction({
      ...input,
      userId: session.user.id,
    });

    return Response.json(
      { success: true, data: transaction, message: "บันทึกรายการสำเร็จ" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.issues },
        { status: 400 },
      );
    }
    // Log เฉพาะ message ไม่ส่ง object ทั้งหมด (อาจมี sensitive info)
    console.error("[POST /api/expenses]", (error as Error)?.message ?? error);
    return Response.json(
      { error: "ไม่สามารถบันทึกรายการได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/expenses/")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});

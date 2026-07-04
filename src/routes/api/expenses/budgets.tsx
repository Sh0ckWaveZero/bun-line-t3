/**
 * Budget API
 * GET    /api/expenses/budgets?month=YYYY-MM  → list budgets พร้อม usage
 * POST   /api/expenses/budgets                 → สร้าง budget ใหม่
 * PATCH  /api/expenses/budgets/:id             → อัปเดต budget (ไฟล์แยก)
 * DELETE /api/expenses/budgets/:id             → ลบ budget (ไฟล์แยก)
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth/auth";
import {
  getBudgetsByUser,
  getBudgetUsage,
  createBudget,
  updateBudget,
  deactivateBudget,
} from "@/features/expenses/services/budget.server";
import { isCategoryOwnedByUser } from "@/features/expenses/services/category.server";
import { MAX_TRANSACTION_AMOUNT } from "@/features/expenses/constants";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const createBudgetSchema = z.object({
  categoryId: z.string().nullable().optional(),
  amount: z
    .number()
    .positive("จำนวนเงินต้องมากกว่า 0")
    .max(MAX_TRANSACTION_AMOUNT, "จำนวนเงินมากเกินไป"),
  alertAt: z.number().min(50).max(100).optional(),
});

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
    const month = url.searchParams.get("month");

    // ดึง budgets ทั้งหมด
    const budgets = await getBudgetsByUser(session.user.id);

    // ถ้าระบุ month → คำนวณ usage
    if (month) {
      const budgetsWithUsage = await getBudgetUsage(session.user.id, month);
      return Response.json({ success: true, data: budgetsWithUsage });
    }

    return Response.json({ success: true, data: budgets });
  } catch (error) {
    console.error(
      "[GET /api/expenses/budgets]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถดึงงบประมาณได้" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const body = await request.json();
    const input = createBudgetSchema.parse(body);

    // ป้องกัน IDOR: ถ้ามี categoryId (ไม่ null) ต้องเป็นของ user นี้จริงๆ
    if (input.categoryId) {
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
    }

    const budget = await createBudget({
      userId: session.user.id,
      categoryId: input.categoryId,
      type: "EXPENSE", // Default to EXPENSE for now
      amount: input.amount,
      alertAt: input.alertAt,
    });

    return Response.json(
      { success: true, data: budget, message: "สร้างงบประมาณสำเร็จ" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.issues },
        { status: 400 },
      );
    }
    // Handle Prisma unique constraint (budget ของ category นี้มีอยู่แล้ว)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "งบประมาณของหมวดหมู่นี้มีอยู่แล้ว" },
        { status: 409 },
      );
    }
    console.error(
      "[POST /api/expenses/budgets]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { error: "ไม่สามารถสร้างงบประมาณได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/expenses/budgets")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});

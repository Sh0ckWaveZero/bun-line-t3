/**
 * Individual Budget API
 * PATCH  /api/expenses/budgets/:id  → อัปเดต budget
 * DELETE /api/expenses/budgets/:id  → ลบ budget
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth/auth";
import {
  updateBudget,
  deactivateBudget,
  getBudgetById,
} from "@/features/expenses/services/budget.server";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const updateBudgetSchema = z.object({
  amount: z.number().positive().optional(),
  alertAt: z.number().min(50).max(100).optional(),
  isActive: z.boolean().optional(),
});

// ─────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    // ตรวจสอบว่า budget เป็นของ user นี้จริงๆ
    const existing = await getBudgetById(params.id, session.user.id);
    if (!existing) {
      return Response.json({ error: "ไม่พบงบประมาณ" }, { status: 404 });
    }

    const body = await request.json();
    const input = updateBudgetSchema.parse(body);

    const budget = await updateBudget(params.id, session.user.id, input);

    return Response.json({
      success: true,
      data: budget,
      message: "อัปเดตงบประมาณสำเร็จ",
    });
  } catch (error) {
    console.error("[PATCH /api/expenses/budgets/:id]", error);
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.issues },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "ไม่สามารถอัปเดตงบประมาณได้" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    // ตรวจสอบว่า budget เป็นของ user นี้จริงๆ
    const existing = await getBudgetById(params.id, session.user.id);
    if (!existing) {
      return Response.json({ error: "ไม่พบงบประมาณ" }, { status: 404 });
    }

    await deactivateBudget(params.id, session.user.id);

    return Response.json({
      success: true,
      message: "ลบงบประมาณสำเร็จ",
    });
  } catch (error) {
    console.error("[DELETE /api/expenses/budgets/:id]", error);
    return Response.json(
      { error: "ไม่สามารถลบงบประมาณได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/expenses/budgets/$id")({
  server: {
    handlers: {
      PATCH: ({ request, params }) => PATCH(request, params as { id: string }),
      DELETE: ({ request, params }) => DELETE(request, params as { id: string }),
    },
  },
});

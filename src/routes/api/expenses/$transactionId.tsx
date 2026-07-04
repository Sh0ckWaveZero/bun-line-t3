/**
 * Expenses API — GET one / PATCH update / DELETE
 * GET    /api/expenses/:transactionId
 * PATCH  /api/expenses/:transactionId
 * DELETE /api/expenses/:transactionId
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth/auth";
import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "@/features/expenses/services/transaction.server";
import { isCategoryOwnedByUser } from "@/features/expenses/services/category.server";
import { MAX_TRANSACTION_AMOUNT } from "@/features/expenses/constants";

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const updateTransactionSchema = z.object({
  categoryId: z.string().min(1).optional(),
  amount: z
    .number()
    .positive("จำนวนเงินต้องมากกว่า 0")
    .max(MAX_TRANSACTION_AMOUNT, "จำนวนเงินมากเกินไป")
    .optional(),
  note: z.string().max(500).nullable().optional(),
  tags: z.string().max(200).nullable().optional(),
  transDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)")
    .optional(),
});

// ─────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────

export async function GET(request: Request, id: string) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const transaction = await getTransactionById(id, session.user.id);
    if (!transaction) {
      return Response.json({ error: "ไม่พบรายการ" }, { status: 404 });
    }

    return Response.json({ success: true, data: transaction });
  } catch (error) {
    console.error(
      "[GET /api/expenses/:id]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 });
  }
}

export async function PATCH(request: Request, id: string) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const body = await request.json();
    const input = updateTransactionSchema.parse(body);

    // ป้องกัน IDOR: ถ้าจะเปลี่ยน categoryId ต้องตรวจสอบว่าเป็นของ user นี้จริงๆ
    if (input.categoryId !== undefined) {
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

    const transaction = await updateTransaction(id, session.user.id, input);

    return Response.json({
      success: true,
      data: transaction,
      message: "แก้ไขรายการสำเร็จ",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.issues },
        { status: 400 },
      );
    }
    console.error(
      "[PATCH /api/expenses/:id]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถแก้ไขรายการได้" }, { status: 500 });
  }
}

export async function DELETE(request: Request, id: string) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    await deleteTransaction(id, session.user.id);

    return Response.json({ success: true, message: "ลบรายการสำเร็จ" });
  } catch (error) {
    console.error(
      "[DELETE /api/expenses/:id]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถลบรายการได้" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/expenses/$transactionId")({
  server: {
    handlers: {
      GET: ({ request, params }) => GET(request, params.transactionId),
      PATCH: ({ request, params }) => PATCH(request, params.transactionId),
      DELETE: ({ request, params }) => DELETE(request, params.transactionId),
    },
  },
});

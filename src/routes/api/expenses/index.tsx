/**
 * Expenses API — GET list / POST create
 * GET  /api/expenses?transMonth=YYYY-MM&type=INCOME|EXPENSE
 * POST /api/expenses
 */

import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { getServerAuthSession } from "@/lib/auth/auth"
import {
  getTransactions,
  createTransaction,
} from "@/features/expenses/services/transaction.server"
import { seedDefaultCategories } from "@/features/expenses/services/category.server"
import { DEFAULT_PAGE_SIZE } from "@/features/expenses/constants"

// ─────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────

const createTransactionSchema = z.object({
  categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("จำนวนเงินต้องมากกว่า 0"),
  note: z.string().max(500).optional(),
  tags: z.string().max(200).optional(),
  transDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
})

// ─────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const url = new URL(request.url)
    const transMonth = url.searchParams.get("transMonth") ?? undefined
    const type = url.searchParams.get("type") as "INCOME" | "EXPENSE" | null
    const categoryId = url.searchParams.get("categoryId") ?? undefined
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10),
      100,
    )
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10)

    const transactions = await getTransactions({
      userId: session.user.id,
      transMonth,
      type: type ?? undefined,
      categoryId,
      limit,
      offset,
    })

    return Response.json({ success: true, data: transactions })
  } catch (error) {
    console.error("[GET /api/expenses]", error)
    return Response.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const body = await request.json()
    const input = createTransactionSchema.parse(body)

    // Seed default categories ถ้า user ยังไม่เคยมี
    await seedDefaultCategories(session.user.id)

    const transaction = await createTransaction({
      ...input,
      userId: session.user.id,
    })

    return Response.json(
      { success: true, data: transaction, message: "บันทึกรายการสำเร็จ" },
      { status: 201 },
    )
  } catch (error) {
    console.error("[POST /api/expenses]", error)
    if (error instanceof z.ZodError) {
      return Response.json({ error: "ข้อมูลไม่ถูกต้อง", details: error.issues }, { status: 400 })
    }
    return Response.json({ error: "ไม่สามารถบันทึกรายการได้" }, { status: 500 })
  }
}

export const Route = createFileRoute("/api/expenses/")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
})

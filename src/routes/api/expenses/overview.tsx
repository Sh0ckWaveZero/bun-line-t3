/**
 * Expenses Overview API
 * GET /api/expenses/overview?transMonth=YYYY-MM
 *
 * รวมข้อมูลหน้า expenses ที่ต้องใช้ตอนเปิดหน้า เพื่อลด request แยกหลายรอบ
 */

import { createFileRoute } from "@tanstack/react-router"
import { getServerAuthSession } from "@/lib/auth/auth"
import { db } from "@/lib/database"
import { getCategoriesByUser } from "@/features/expenses/services/category.server"
import { getTransactions } from "@/features/expenses/services/transaction.server"
import { DEFAULT_PAGE_SIZE } from "@/features/expenses/constants"
import { getCurrentMonth } from "@/features/expenses/helpers"

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const url = new URL(request.url)
    const transMonth = url.searchParams.get("transMonth") ?? getCurrentMonth()
    if (!/^\d{4}-\d{2}$/.test(transMonth)) {
      return Response.json(
        { error: "รูปแบบเดือนไม่ถูกต้อง (YYYY-MM)" },
        { status: 400 },
      )
    }

    const userId = session.user.id
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10),
      100,
    )

    const [transactions, totalRows, categoryRows, categories, settings] =
      await Promise.all([
        getTransactions({ userId, transMonth, limit }),
        db.transaction.groupBy({
          by: ["type"],
          where: { userId, transMonth },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        db.transaction.groupBy({
          by: ["categoryId", "type"],
          where: { userId, transMonth },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        getCategoriesByUser(userId),
        db.userSettings.findUnique({
          where: { userId },
          select: { hideAmountsWeb: true },
        }),
      ])

    const totalIncome =
      totalRows.find((row) => row.type === "INCOME")?._sum.amount ?? 0
    const totalExpense =
      totalRows.find((row) => row.type === "EXPENSE")?._sum.amount ?? 0
    const transactionCount = totalRows.reduce(
      (sum, row) => sum + (row._count._all ?? 0),
      0,
    )
    const categoryById = new Map(categories.map((category) => [category.id, category]))
    const categorySummary = categoryRows
      .map((row) => {
        const total = row._sum.amount ?? 0
        const grandTotal = row.type === "INCOME" ? totalIncome : totalExpense
        const category = categoryById.get(row.categoryId)

        return {
          categoryId: row.categoryId,
          categoryName: category?.name ?? "หมวดหมู่",
          icon: category?.icon ?? null,
          color: category?.color ?? null,
          type: row.type,
          total,
          count: row._count._all ?? 0,
          percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
        }
      })
      .sort((a, b) => b.total - a.total)

    return Response.json({
      success: true,
      data: {
        transactions,
        summary: {
          transMonth,
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          transactionCount,
        },
        categorySummary,
        categories,
        hideAmountsWeb: settings?.hideAmountsWeb ?? false,
      },
    })
  } catch (error) {
    console.error("[GET /api/expenses/overview]", error)
    return Response.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 })
  }
}

export const Route = createFileRoute("/api/expenses/overview")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
})

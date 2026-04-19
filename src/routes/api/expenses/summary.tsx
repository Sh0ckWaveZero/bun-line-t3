/**
 * Expenses Summary API
 * GET /api/expenses/summary?transMonth=YYYY-MM   → MonthlySummary + CategorySummary[]
 * GET /api/expenses/summary?months=YYYY-MM,YYYY-MM,...  → MonthlySummary[] (multi)
 */

import { createFileRoute } from "@tanstack/react-router"
import { getServerAuthSession } from "@/lib/auth/auth"
import {
  getMonthlySummary,
  getCategorySummary,
  getMultiMonthSummary,
} from "@/features/expenses/services/transaction.server"
import { getCurrentMonth } from "@/features/expenses/helpers"

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const url = new URL(request.url)
    const userId = session.user.id

    // Multi-month summary (สำหรับ chart ย้อนหลัง)
    const monthsParam = url.searchParams.get("months")
    if (monthsParam) {
      const months = monthsParam
        .split(",")
        .map((m) => m.trim())
        .filter((m) => /^\d{4}-\d{2}$/.test(m))
        .slice(0, 12) // ไม่เกิน 12 เดือน

      const summary = await getMultiMonthSummary(userId, months)
      return Response.json({ success: true, data: summary })
    }

    // Single-month summary + category breakdown
    const transMonth = url.searchParams.get("transMonth") ?? getCurrentMonth()
    if (!/^\d{4}-\d{2}$/.test(transMonth)) {
      return Response.json(
        { error: "รูปแบบเดือนไม่ถูกต้อง (YYYY-MM)" },
        { status: 400 },
      )
    }

    const [summary, categories] = await Promise.all([
      getMonthlySummary(userId, transMonth),
      getCategorySummary(userId, transMonth),
    ])

    return Response.json({ success: true, data: { summary, categories } })
  } catch (error) {
    console.error("[GET /api/expenses/summary]", error)
    return Response.json({ error: "ไม่สามารถดึงสรุปได้" }, { status: 500 })
  }
}

export const Route = createFileRoute("/api/expenses/summary")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
})

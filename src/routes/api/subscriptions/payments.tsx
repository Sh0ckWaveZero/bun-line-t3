/**
 * Subscription Payments API
 * GET   /api/subscriptions/payments?subscriptionId=...&billingMonth=YYYY-MM
 * PATCH /api/subscriptions/payments?paymentId=...&action=paid|unpaid|skip
 */

import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { getServerAuthSession } from "@/lib/auth/auth"
import {
  getPaymentsByMonth,
  getPaymentsByMember,
  getPendingPayments,
  markPaymentPaid,
  unmarkPaymentPaid,
  skipPayment,
  updatePayment,
  deletePayment,
  generateNextMonthPayments,
} from "@/features/subscriptions/services/payment"
import { getSubscriptionMonthlySummary } from "@/features/subscriptions/services/subscription"
import { getCurrentMonthLabel } from "@/features/subscriptions/helpers"

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get("subscriptionId")
    const memberId = searchParams.get("memberId")
    const billingMonth = searchParams.get("billingMonth") ?? getCurrentMonthLabel()
    const pending = searchParams.get("pending") === "true"
    const withSummary = searchParams.get("summary") === "true"

    if (memberId) {
      const limit = parseInt(searchParams.get("limit") ?? "12")
      const payments = await getPaymentsByMember(memberId, limit)
      return Response.json({ success: true, data: payments })
    }

    if (!subscriptionId) {
      return Response.json({ error: "กรุณาระบุ subscriptionId หรือ memberId" }, { status: 400 })
    }

    if (pending) {
      const payments = await getPendingPayments(subscriptionId)
      return Response.json({ success: true, data: payments })
    }

    const payments = await getPaymentsByMonth(subscriptionId, billingMonth)
    const result: Record<string, unknown> = { success: true, data: payments }

    if (withSummary) {
      result.summary = await getSubscriptionMonthlySummary(subscriptionId, billingMonth)
    }

    return Response.json(result)
  } catch (error) {
    console.error("[GET /api/subscriptions/payments]", error)
    return Response.json({ error: "ไม่สามารถดึงข้อมูลการจ่ายเงินได้" }, { status: 500 })
  }
}

const patchPaymentSchema = z.object({
  action: z.enum(["paid", "unpaid", "skip"]).optional(),
  paidAt: z
    .string()
    .transform((v) => new Date(v))
    .optional(),
  amount: z.number().nonnegative().optional(),
  status: z.enum(["PENDING", "PAID", "SKIPPED"]).optional(),
  note: z.string().nullable().optional(),
})

export async function PATCH(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")
    if (!paymentId) {
      return Response.json({ error: "กรุณาระบุ paymentId" }, { status: 400 })
    }

    const body = await request.json()
    const input = patchPaymentSchema.parse(body)

    // Legacy: รองรับ action-based updates (paid/unpaid/skip)
    if (input.action) {
      let updated
      switch (input.action) {
        case "paid":
          updated = await markPaymentPaid(paymentId, session.user.id, input.paidAt)
          return Response.json({ success: true, data: updated, message: "บันทึกการจ่ายเงินสำเร็จ" })
        case "unpaid":
          updated = await unmarkPaymentPaid(paymentId)
          return Response.json({ success: true, data: updated, message: "ยกเลิกการจ่ายเงินสำเร็จ" })
        case "skip":
          updated = await skipPayment(paymentId)
          return Response.json({ success: true, data: updated, message: "ข้าม payment สำเร็จ" })
        default:
          return Response.json({ error: "action ไม่ถูกต้อง" }, { status: 400 })
      }
    }

    // New: custom field updates
    const updated = await updatePayment(paymentId, {
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.paidAt !== undefined && { paidAt: input.paidAt }),
      ...(input.note !== undefined && { note: input.note }),
    })

    return Response.json({ success: true, data: updated, message: "อัปเดตการจ่ายเงินสำเร็จ" })
  } catch (error) {
    console.error("[PATCH /api/subscriptions/payments]", error)
    if (error instanceof z.ZodError) {
      return Response.json({ error: "ข้อมูลไม่ถูกต้อง", details: error.issues }, { status: 400 })
    }
    return Response.json({ error: "ไม่สามารถอัปเดตการจ่ายเงินได้" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")
    if (!paymentId) {
      return Response.json({ error: "กรุณาระบุ paymentId" }, { status: 400 })
    }

    await deletePayment(paymentId)
    return Response.json({ success: true, message: "ลบรายการจ่ายเงินสำเร็จ" })
  } catch (error) {
    console.error("[DELETE /api/subscriptions/payments]", error)
    return Response.json({ error: "ไม่สามารถลบรายการจ่ายเงินได้" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get("subscriptionId")
    if (!subscriptionId) {
      return Response.json({ error: "กรุณาระบุ subscriptionId" }, { status: 400 })
    }

    const count = await generateNextMonthPayments(subscriptionId)
    return Response.json({
      success: true,
      message: `สร้าง payment สำเร็จ ${count} รายการ`,
      created: count,
    })
  } catch (error) {
    console.error("[POST /api/subscriptions/payments]", error)
    return Response.json({ error: "ไม่สามารถสร้าง payments ได้" }, { status: 500 })
  }
}

export const Route = createFileRoute("/api/subscriptions/payments")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      PATCH: ({ request }) => PATCH(request),
      POST: ({ request }) => POST(request),
      DELETE: ({ request }) => DELETE(request),
    },
  },
})

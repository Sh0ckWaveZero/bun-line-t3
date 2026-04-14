/**
 * Subscription API — GET detail / PATCH update / DELETE deactivate
 * GET    /api/subscriptions/:subscriptionId
 * PATCH  /api/subscriptions/:subscriptionId
 * DELETE /api/subscriptions/:subscriptionId
 */

import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { getServerAuthSession } from "@/lib/auth/auth"
import {
  getSubscriptionDetail,
  updateSubscription,
  deactivateSubscription,
} from "@/features/subscriptions/services/subscription.server"
import { getCurrentMonthLabel } from "@/features/subscriptions/helpers"

const updateSubscriptionSchema = z.object({
  name: z.string().min(1).optional(),
  service: z.enum(["YOUTUBE", "SPOTIFY", "NETFLIX", "OTHER"]).optional(),
  planType: z.enum(["INDIVIDUAL", "FAMILY"]).optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
  totalPrice: z.number().positive().optional(),
  currency: z.string().optional(),
  billingDay: z.number().int().min(1).max(31).optional(),
  isActive: z.boolean().optional(),
  endDate: z
    .string()
    .transform((v) => new Date(v))
    .nullable()
    .optional(),
  logoUrl: z.string().url().nullable().optional(),
  note: z.string().nullable().optional(),
})

function getSubscriptionId(request: Request): string {
  const url = new URL(request.url)
  const parts = url.pathname.split("/")
  return parts[parts.length - 1] ?? ""
}

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const subscriptionId = getSubscriptionId(request)
    const { searchParams } = new URL(request.url)
    const billingMonth = searchParams.get("billingMonth") ?? getCurrentMonthLabel()

    const detail = await getSubscriptionDetail(subscriptionId, billingMonth)
    if (!detail) {
      return Response.json({ error: "ไม่พบ subscription" }, { status: 404 })
    }

    // ตรวจสอบสิทธิ์: ต้องเป็นเจ้าของ, admin, หรือเป็นสมาชิก
    const isMember = detail.members.some(
      (m) => m.userId === session.user.id && m.isActive,
    )
    if (!session.isAdmin && detail.ownerId !== session.user.id && !isMember) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง subscription นี้" }, { status: 403 })
    }

    return Response.json({ success: true, data: detail })
  } catch (error) {
    console.error("[GET /api/subscriptions/:id]", error)
    return Response.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    if (!session.isAdmin) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึงหน้านี้" }, { status: 403 })
    }

    const subscriptionId = getSubscriptionId(request)
    const body = await request.json()
    const input = updateSubscriptionSchema.parse(body)

    const updated = await updateSubscription(subscriptionId, input)
    return Response.json({ success: true, data: updated, message: "อัปเดตสำเร็จ" })
  } catch (error) {
    console.error("[PATCH /api/subscriptions/:id]", error)
    if (error instanceof z.ZodError) {
      return Response.json({ error: "ข้อมูลไม่ถูกต้อง", details: error.issues }, { status: 400 })
    }
    return Response.json({ error: "ไม่สามารถอัปเดตได้" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    if (!session.isAdmin) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึงหน้านี้" }, { status: 403 })
    }

    const subscriptionId = getSubscriptionId(request)
    await deactivateSubscription(subscriptionId)
    return Response.json({ success: true, message: "ยกเลิก subscription สำเร็จ" })
  } catch (error) {
    console.error("[DELETE /api/subscriptions/:id]", error)
    return Response.json({ error: "ไม่สามารถลบได้" }, { status: 500 })
  }
}

export const Route = createFileRoute("/api/subscriptions/$subscriptionId")({
  server: {
    handlers: {
      DELETE: ({ request }) => DELETE(request),
      GET: ({ request }) => GET(request),
      PATCH: ({ request }) => PATCH(request),
    },
  },
})

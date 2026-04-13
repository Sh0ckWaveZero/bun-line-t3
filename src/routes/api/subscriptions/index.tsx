/**
 * Subscription API — GET all / POST create
 * GET  /api/subscriptions
 * POST /api/subscriptions
 */

import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { getServerAuthSession } from "@/lib/auth/auth"
import {
  getSubscriptionsByOwner,
  createSubscription,
  generateMissingPayments,
} from "@/features/subscriptions/services/subscription"

const createSubscriptionSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อ subscription"),
  service: z.enum(["YOUTUBE", "SPOTIFY", "NETFLIX", "OTHER"]),
  planType: z.enum(["INDIVIDUAL", "FAMILY"]),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  totalPrice: z.number().positive("ราคาต้องมากกว่า 0"),
  currency: z.string().default("THB"),
  billingDay: z.number().int().min(1).max(31),
  startDate: z.string().transform((v) => new Date(v)),
  endDate: z
    .string()
    .transform((v) => new Date(v))
    .optional(),
  logoUrl: z.string().url().optional(),
  note: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const subscriptions = await getSubscriptionsByOwner(session.user.id)
    return Response.json({ success: true, data: subscriptions })
  } catch (error) {
    console.error("[GET /api/subscriptions]", error)
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
    const input = createSubscriptionSchema.parse(body)

    const subscription = await createSubscription({
      ...input,
      ownerId: session.user.id,
    })

    // Auto-generate payments สำหรับเดือนปัจจุบัน
    await generateMissingPayments(subscription.id)

    return Response.json(
      { success: true, data: subscription, message: "สร้าง subscription สำเร็จ" },
      { status: 201 },
    )
  } catch (error) {
    console.error("[POST /api/subscriptions]", error)
    if (error instanceof z.ZodError) {
      return Response.json({ error: "ข้อมูลไม่ถูกต้อง", details: error.issues }, { status: 400 })
    }
    return Response.json({ error: "ไม่สามารถสร้าง subscription ได้" }, { status: 500 })
  }
}

export const Route = createFileRoute("/api/subscriptions/")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
})

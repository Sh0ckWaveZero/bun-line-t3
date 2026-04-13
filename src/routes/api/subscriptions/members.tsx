/**
 * Subscription Members API
 * GET  /api/subscriptions/members?subscriptionId=...
 * POST /api/subscriptions/members
 * PATCH/DELETE /api/subscriptions/members?memberId=...
 */

import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { getServerAuthSession } from "@/lib/auth/auth"
import {
  getMembersBySubscription,
  addMember,
  updateMember,
  removeMember,
} from "@/features/subscriptions/services/member"

const addMemberSchema = z.object({
  subscriptionId: z.string().min(1),
  userId: z.string().optional(),
  name: z.string().min(1, "กรุณาระบุชื่อสมาชิก"),
  email: z.string().optional(),
  shareAmount: z.number().nonnegative("จำนวนเงินต้องไม่ติดลบ"),
  joinedAt: z
    .string()
    .transform((v) => new Date(v))
    .optional(),
  note: z.string().optional(),
  tags: z.string().optional(),
}).transform((data) => {
  // Validate email separately (only if provided and not empty)
  const email = data.email?.trim()
  if (email && email !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error("อีเมลไม่ถูกต้อง")
    }
  }

  return {
    subscriptionId: data.subscriptionId,
    userId: data.userId,
    name: data.name,
    email: email && email !== "" ? email : undefined,
    shareAmount: data.shareAmount,
    joinedAt: data.joinedAt,
    note: data.note?.trim() && data.note.trim() !== "" ? data.note.trim() : undefined,
    tags: data.tags?.trim() && data.tags.trim() !== "" ? data.tags.trim() : undefined,
  }
})

const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  shareAmount: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  leftAt: z
    .string()
    .transform((v) => new Date(v))
    .nullable()
    .optional(),
  note: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
})

export async function GET(request: Request) {
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

    const members = await getMembersBySubscription(subscriptionId)
    return Response.json({ success: true, data: members })
  } catch (error) {
    console.error("[GET /api/subscriptions/members]", error)
    return Response.json({ error: "ไม่สามารถดึงข้อมูลสมาชิกได้" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const body = await request.json()
    const input = addMemberSchema.parse(body)
    const member = await addMember(input)

    return Response.json(
      { success: true, data: member, message: "เพิ่มสมาชิกสำเร็จ" },
      { status: 201 },
    )
  } catch (error) {
    console.error("[POST /api/subscriptions/members]", error)
    if (error instanceof z.ZodError) {
      return Response.json({ error: "ข้อมูลไม่ถูกต้อง", details: error.issues }, { status: 400 })
    }
    return Response.json({ error: "ไม่สามารถเพิ่มสมาชิกได้" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")
    if (!memberId) {
      return Response.json({ error: "กรุณาระบุ memberId" }, { status: 400 })
    }

    const body = await request.json()
    const input = updateMemberSchema.parse(body)
    const updated = await updateMember(memberId, input)

    return Response.json({ success: true, data: updated, message: "อัปเดตสมาชิกสำเร็จ" })
  } catch (error) {
    console.error("[PATCH /api/subscriptions/members]", error)
    if (error instanceof z.ZodError) {
      return Response.json({ error: "ข้อมูลไม่ถูกต้อง", details: error.issues }, { status: 400 })
    }
    return Response.json({ error: "ไม่สามารถอัปเดตสมาชิกได้" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")
    if (!memberId) {
      return Response.json({ error: "กรุณาระบุ memberId" }, { status: 400 })
    }

    await removeMember(memberId)
    return Response.json({ success: true, message: "ลบสมาชิกสำเร็จ" })
  } catch (error) {
    console.error("[DELETE /api/subscriptions/members]", error)
    return Response.json({ error: "ไม่สามารถลบสมาชิกได้" }, { status: 500 })
  }
}

export const Route = createFileRoute("/api/subscriptions/members")({
  server: {
    handlers: {
      DELETE: ({ request }) => DELETE(request),
      GET: ({ request }) => GET(request),
      PATCH: ({ request }) => PATCH(request),
      POST: ({ request }) => POST(request),
    },
  },
})

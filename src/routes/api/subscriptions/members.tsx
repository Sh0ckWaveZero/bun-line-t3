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
} from "@/features/subscriptions/services/member.server"
import { BadRequestError, UnauthorizedError, ForbiddenError, createErrorResponse } from "@/lib/errors/api-error"

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
      throw new UnauthorizedError()
    }

    if (!session.isAdmin) {
      throw new ForbiddenError()
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get("subscriptionId")
    if (!subscriptionId) {
      throw new BadRequestError("กรุณาระบุ subscriptionId")
    }

    const members = await getMembersBySubscription(subscriptionId)
    return Response.json({ success: true, data: members })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    if (!session.isAdmin) {
      throw new ForbiddenError()
    }

    const body = await request.json()
    console.log("[POST /api/subscriptions/members] Request body:", body)

    const input = addMemberSchema.parse(body)
    console.log("[POST /api/subscriptions/members] Parsed input:", input)

    const member = await addMember(input)
    console.log("[POST /api/subscriptions/members] Created member:", member)

    return Response.json(
      { success: true, data: member, message: "เพิ่มสมาชิกสำเร็จ" },
      { status: 201 },
    )
  } catch (error) {
    console.error("[POST /api/subscriptions/members] Error:", error)
    if (error instanceof Error) {
      console.error("[POST /api/subscriptions/members] Error message:", error.message)
      console.error("[POST /api/subscriptions/members] Error stack:", error.stack)
    }
    if (error instanceof z.ZodError) {
      console.error("[POST /api/subscriptions/members] ZodError:", error.issues)
    }
    return createErrorResponse(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    if (!session.isAdmin) {
      throw new ForbiddenError()
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")
    if (!memberId) {
      throw new BadRequestError("กรุณาระบุ memberId")
    }

    const body = await request.json()
    const input = updateMemberSchema.parse(body)
    const updated = await updateMember(memberId, input)

    return Response.json({ success: true, data: updated, message: "อัปเดตสมาชิกสำเร็จ" })
  } catch (error) {
    console.error("[PATCH /api/subscriptions/members]", error)
    return createErrorResponse(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    if (!session.isAdmin) {
      throw new ForbiddenError()
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")
    if (!memberId) {
      throw new BadRequestError("กรุณาระบุ memberId")
    }

    await removeMember(memberId)
    return Response.json({ success: true, message: "ลบสมาชิกสำเร็จ" })
  } catch (error) {
    console.error("[DELETE /api/subscriptions/members]", error)
    return createErrorResponse(error)
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

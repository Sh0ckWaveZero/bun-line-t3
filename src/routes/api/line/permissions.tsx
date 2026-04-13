/**
 * LINE Permissions API
 * GET  /api/line/permissions - ดึงรายการ approvals ทั้งหมด (admin only)
 * GET  /api/line/permissions?lineUserId=... - เช็ค permissions ของ LINE user
 * PATCH /api/line/permissions - อัปเดต permissions (admin only)
 */

import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { getServerAuthSession } from "@/lib/auth/auth"
import { db } from "@/lib/database/db"
import { BadRequestError, UnauthorizedError, ForbiddenError, createErrorResponse } from "@/lib/errors/api-error"

const updatePermissionsSchema = z.object({
  lineUserId: z.string().min(1),
  canRequestAttendanceReport: z.boolean().optional(),
  canRequestLeave: z.boolean().optional(),
  canReceiveReminders: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request)
    if (!session?.user?.id) {
      throw new UnauthorizedError()
    }

    const { searchParams } = new URL(request.url)
    const lineUserId = searchParams.get("lineUserId")

    // Case 1: เช็ค permissions ของ LINE user คนอื่น (ต้องเป็น admin)
    if (lineUserId) {
      if (!session.isAdmin) {
        throw new ForbiddenError()
      }

      const approval = await db.lineApprovalRequest.findUnique({
        where: { lineUserId },
      })

      if (!approval) {
        return Response.json({
          success: true,
          data: {
            lineUserId,
            canRequestAttendanceReport: false,
            canRequestLeave: false,
            canReceiveReminders: false,
          },
        })
      }

      return Response.json({
        success: true,
        data: {
          lineUserId: approval.lineUserId,
          displayName: approval.displayName,
          pictureUrl: approval.pictureUrl,
          status: approval.status,
          canRequestAttendanceReport: approval.canRequestAttendanceReport ?? false,
          canRequestLeave: approval.canRequestLeave ?? false,
          canReceiveReminders: approval.canReceiveReminders ?? false,
        },
      })
    }

    // Case 2: ดึงรายการ approvals ทั้งหมด (admin only)
    if (!session.isAdmin) {
      throw new ForbiddenError()
    }

    const approvals = await db.lineApprovalRequest.findMany({
      orderBy: { createdAt: "desc" },
    })

    return Response.json({ success: true, data: approvals })
  } catch (error) {
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

    const body = await request.json()
    const input = updatePermissionsSchema.parse(body)

    // ตรวจสอบว่ามี lineUserId นี้อยู่จริง
    const existing = await db.lineApprovalRequest.findUnique({
      where: { lineUserId: input.lineUserId },
    })

    if (!existing) {
      throw new BadRequestError("ไม่พบ LINE user นี้ในระบบ")
    }

    // อัปเดต permissions
    const updated = await db.lineApprovalRequest.update({
      where: { lineUserId: input.lineUserId },
      data: {
        ...(input.canRequestAttendanceReport !== undefined && {
          canRequestAttendanceReport: input.canRequestAttendanceReport,
        }),
        ...(input.canRequestLeave !== undefined && {
          canRequestLeave: input.canRequestLeave,
        }),
        ...(input.canReceiveReminders !== undefined && {
          canReceiveReminders: input.canReceiveReminders,
        }),
      },
    })

    return Response.json({
      success: true,
      data: updated,
      message: "อัปเดตสิทธิ์สำเร็จ",
    })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export const Route = createFileRoute("/api/line/permissions")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      PATCH: ({ request }) => PATCH(request),
    },
  },
})

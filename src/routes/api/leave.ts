import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getServerAuthSession } from "@/lib";
import { leaveService } from "@/features/attendance/services/leave.server";
import { db } from "@/lib/database/db";
import { canRequestLeave } from "@/features/line/line/permissions";
import { CALENDAR_LEAVE_TYPES } from "@/features/calendar/lib/day-event-form";

const updateLeaveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง"),
  type: z.enum(CALENDAR_LEAVE_TYPES),
  reason: z.string().max(500).optional(),
});

/**
 * ตรวจ session + สิทธิ์ขอลา (LINE Permission) — ใช้ร่วมกันทั้ง POST (สร้างวันลา)
 * และ PUT (เปลี่ยนวันลา) ให้ gate เดียวกัน คืน session เมื่อผ่าน หรือ Response error
 */
async function resolveLeaveAccess(
  req: Request,
): Promise<
  | { session: NonNullable<Awaited<ReturnType<typeof getServerAuthSession>>> }
  | { error: Response }
> {
  const session = await getServerAuthSession(req);
  if (!session?.user?.id) {
    return {
      error: Response.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 },
      ),
    };
  }

  // LINE Permission check - ต้องได้รับอนุมัติให้ขอลา
  const lineAccount = await db.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "line",
    },
    select: {
      accountId: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (lineAccount) {
    const hasPermission = await canRequestLeave(lineAccount.accountId);
    if (!hasPermission) {
      return {
        error: Response.json(
          {
            success: false,
            message: "คุณยังไม่ได้รับอนุมัติให้ขอลางาน กรุณาติดต่อผู้ดูแลระบบ",
          },
          { status: 403 },
        ),
      };
    }
  }

  return { session };
}

export async function POST(req: Request) {
  try {
    const access = await resolveLeaveAccess(req);
    if ("error" in access) return access.error;
    const session = access.session;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { success: false, message: "ข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }
    const { date, type, reason } = body;
    if (!date) {
      return Response.json(
        { success: false, message: "กรุณาระบุวันที่ลา" },
        { status: 422 },
      );
    }
    // ตรวจสอบรูปแบบวันที่ (yyyy-mm-dd)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json(
        { success: false, message: "รูปแบบวันที่ไม่ถูกต้อง" },
        { status: 422 },
      );
    }
    try {
      await leaveService.createLeave({
        userId: session.user.id,
        date,
        type: type || "personal",
        reason,
        isActive: true,
      });
    } catch (err: any) {
      // ตรวจสอบ error จากฐานข้อมูลหรือ business logic
      if (err?.code === "P2002") {
        // ตัวอย่าง: Prisma unique constraint
        return Response.json(
          { success: false, message: "มีการบันทึกวันลานี้แล้ว" },
          { status: 409 },
        );
      }
      return Response.json(
        {
          success: false,
          message: err?.message || "เกิดข้อผิดพลาดขณะบันทึกวันลา",
        },
        { status: 400 },
      );
    }
    return Response.json({ success: true, message: "บันทึกวันลาสำเร็จ" });
  } catch {
    // กรณี error ที่ไม่คาดคิดเท่านั้นจึงจะตอบ 500
    return Response.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่หรือติดต่อผู้ดูแล",
      },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/leave")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
      PUT: ({ request }) => PUT(request),
      DELETE: ({ request }) => DELETE(request),
    },
  },
});

/**
 * เปลี่ยนวันลาที่บันทึกไว้แล้ว (ประเภท/เหตุผล) — ใช้โดยโหมด "เปลี่ยนวันลา" ของปฏิทิน
 * body: { date: "YYYY-MM-DD", type: "personal" | "sick" | "vacation", reason? }
 */
export async function PUT(req: Request) {
  try {
    const access = await resolveLeaveAccess(req);
    if ("error" in access) return access.error;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { success: false, message: "ข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const parsed = updateLeaveSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
        },
        { status: 422 },
      );
    }

    try {
      await leaveService.updateLeaveForDate({
        userId: access.session.user.id,
        date: parsed.data.date,
        type: parsed.data.type,
        reason: parsed.data.reason,
      });
    } catch (err: any) {
      return Response.json(
        {
          success: false,
          message: err?.message || "เกิดข้อผิดพลาดขณะเปลี่ยนวันลา",
        },
        { status: 400 },
      );
    }
    return Response.json({ success: true, message: "เปลี่ยนวันลาสำเร็จ" });
  } catch {
    return Response.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่หรือติดต่อผู้ดูแล",
      },
      { status: 500 },
    );
  }
}

/**
 * ยกเลิกวันลาที่บันทึกไว้แล้ว — ใช้โดยปุ่ม "ยกเลิกวันลา" ของปฏิทิน
 * query: ?date=YYYY-MM-DD (soft delete + ลบ attendance auto-stamp คู่กัน)
 */
export async function DELETE(req: Request) {
  try {
    const access = await resolveLeaveAccess(req);
    if ("error" in access) return access.error;

    const date = new URL(req.url).searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json(
        { success: false, message: "รูปแบบวันที่ไม่ถูกต้อง" },
        { status: 422 },
      );
    }

    try {
      await leaveService.cancelLeaveForDate({
        userId: access.session.user.id,
        date,
      });
    } catch (err: any) {
      return Response.json(
        {
          success: false,
          message: err?.message || "เกิดข้อผิดพลาดขณะยกเลิกวันลา",
        },
        { status: 400 },
      );
    }
    return Response.json({ success: true, message: "ยกเลิกวันลาสำเร็จ" });
  } catch {
    return Response.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่หรือติดต่อผู้ดูแล",
      },
      { status: 500 },
    );
  }
}

// เพิ่ม endpoint สำหรับดึงวันลาทั้งหมดของ user
export async function GET(req: Request) {
  try {
    const session = await getServerAuthSession(req);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 },
      );
    }
    // รับ query string เช่น ?month=2025-06
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    if (!month) {
      return Response.json(
        { success: false, message: "กรุณาระบุเดือน (YYYY-MM)" },
        { status: 422 },
      );
    }
    const leaves = await leaveService.getUserLeavesInMonth(
      session.user.id,
      month,
    );
    return Response.json({ success: true, leaves });
  } catch {
    return Response.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่หรือติดต่อผู้ดูแล",
      },
      { status: 500 },
    );
  }
}

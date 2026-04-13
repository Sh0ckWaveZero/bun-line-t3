import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib";
import { leaveService } from "@/features/attendance/services/leave";
import { db } from "@/lib/database/db";
import { canRequestLeave } from "@/lib/line/permissions";

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession(req);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 },
      );
    }

    // LINE Permission check - ต้องได้รับอนุมัติให้ขอลา
    const lineAccount = await db.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "line",
      },
      select: {
        providerAccountId: true,
      },
    });

    if (lineAccount) {
      const hasPermission = await canRequestLeave(lineAccount.providerAccountId);
      if (!hasPermission) {
        return Response.json(
          {
            success: false,
            message: "คุณยังไม่ได้รับอนุมัติให้ขอลางาน กรุณาติดต่อผู้ดูแลระบบ",
          },
          { status: 403 },
        );
      }
    }

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
    },
  },
});

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

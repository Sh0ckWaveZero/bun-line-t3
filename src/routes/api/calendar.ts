import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getServerAuthSession } from "@/lib";
import { holidayService } from "@/features/attendance/services/holidays.server";
import { leaveService } from "@/features/attendance/services/leave.server";
import { workModeService } from "@/features/attendance/services/work-mode.server";

const CalendarQuerySchema = z.object({
  year: z.coerce.number().int().min(1970).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

/**
 * ข้อมูลปฏิทินทั้งหมดใน request เดียว — วันหยุด (รายปี) + วันลา + WFH/On Site (รายเดือนของ user)
 * อ่านอย่างเดียว; การ mark/cancel ยังใช้ /api/leave, /api/work-modes, /api/holidays เดิม
 */
export async function GET(req: Request) {
  try {
    const session = await getServerAuthSession(req);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = CalendarQuerySchema.safeParse({
      year: searchParams.get("year"),
      month: searchParams.get("month"),
    });
    if (!parsed.success) {
      return Response.json(
        { success: false, message: "กรุณาระบุ year และ month ให้ถูกต้อง" },
        { status: 422 },
      );
    }

    const { year, month } = parsed.data;
    const monthLabel = `${year}-${String(month).padStart(2, "0")}`;
    const [holidays, leaves, workModeDays] = await Promise.all([
      holidayService.getHolidaysByYear(year),
      leaveService.getUserLeavesInMonth(session.user.id, monthLabel),
      workModeService.getUserWorkModeDaysInMonth(session.user.id, monthLabel),
    ]);

    return Response.json({
      success: true,
      holidays,
      leaves,
      workModeDays,
    });
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

export const Route = createFileRoute("/api/calendar")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});

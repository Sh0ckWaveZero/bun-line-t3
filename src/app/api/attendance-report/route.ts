import { NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { attendanceService } from "@/features/attendance/services/attendance";
import { leaveService } from "@/features/attendance/services/leave";

// Validation schema for query parameters
const AttendanceReportQuerySchema = z.object({
  userId: z.string().min(1, "userId is required"),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Invalid month format. Use YYYY-MM")
    .refine((month) => {
      const [year, monthNum] = month.split("-").map(Number);
      if (!year || !monthNum) return false;
      return (
        year >= 2020 &&
        year <= 2100 &&
        monthNum >= 1 &&
        monthNum <= 12
      );
    }, "Month must be valid (2020-2100, 01-12)"),
});

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json(
        {
          error: "Unauthorized - Authentication required",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const month = searchParams.get("month");

    // Validate query parameters with Zod
    const validationResult = AttendanceReportQuerySchema.safeParse({
      userId,
      month,
    });

    if (!validationResult.success) {
      return Response.json(
        {
          error: "Validation error",
          details: validationResult.error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const validatedData = validationResult.data;

    // Authorization check - users can only access their own data
    if (session.user.id !== validatedData.userId) {
      return Response.json(
        {
          error: "Forbidden - You can only access your own attendance data",
        },
        { status: 403 },
      );
    }

    const report = await attendanceService.getMonthlyAttendanceReport(
      validatedData.userId,
      validatedData.month,
    );

    // ดึงวันลาของ user ในเดือนนั้น
    const leaves = await leaveService.getUserLeavesInMonth(
      validatedData.userId,
      validatedData.month,
    );
    // สร้าง map ของวันที่ลาพร้อมข้อมูล leave
    const leaveMap = new Map(leaves.map((leave) => [leave.date, leave]));
    // สร้างรายงานใหม่โดยนับวันที่ลาเป็น "ไม่ขาดงาน"
    if (report) {
      // เพิ่ม attendanceRecords สำหรับวันลาที่ไม่มีบันทึกเข้างาน
      const allDates = new Set([
        ...report.attendanceRecords.map((r) => r.workDate),
        ...leaves.map((l) => l.date),
      ]);
      const recordsWithLeave = Array.from(allDates)
        .map((date) => {
          const existingRecord = report.attendanceRecords.find(
            (r) => r.workDate === date,
          );
          const leaveRecord = leaveMap.get(date);

          if (existingRecord) {
            // เพิ่มข้อมูล leave ให้กับ record ที่มีอยู่ (ถ้าเป็นวันลา)
            if (leaveRecord) {
              return {
                ...existingRecord,
                leaveInfo: {
                  id: leaveRecord.id,
                  type: leaveRecord.type,
                  reason: leaveRecord.reason,
                  createdAt: leaveRecord.createdAt.toISOString(),
                },
              };
            }
            return existingRecord;
          }

          // สร้าง record ใหม่สำหรับวันลา (Auto-Stamp System)
          // Check-in: 01:00 UTC (08:00 Bangkok), Check-out: 10:00 UTC (17:00 Bangkok)
          if (leaveRecord) {
            return {
              id: `leave-${date}`,
              workDate: date,
              checkInTime: `${date}T01:00:00.000Z`, // Auto-stamped leave check-in
              checkOutTime: `${date}T10:00:00.000Z`, // Auto-stamped leave check-out
              status: "LEAVE",
              hoursWorked: 9.0, // Standard work hours for leave days
              leaveInfo: {
                id: leaveRecord.id,
                type: leaveRecord.type,
                reason: leaveRecord.reason,
                createdAt: leaveRecord.createdAt.toISOString(),
              },
            };
          }
          return null;
        })
        .filter(Boolean);
      // นับ totalDaysWorked ใหม่ (วันลานับเป็นมาทำงาน)
      const totalDaysWorked = recordsWithLeave.length;
      // ส่งข้อมูลใหม่กลับไป
      return Response.json(
        {
          success: true,
          data: {
            ...report,
            attendanceRecords: recordsWithLeave,
            totalDaysWorked,
          },
        },
        { status: 200 },
      );
    }

    if (!report) {
      return Response.json(
        {
          error: "Failed to generate attendance report",
        },
        { status: 500 },
      );
    }

    return Response.json(
      {
        success: true,
        data: report,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in attendance report API:", error);
    return Response.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

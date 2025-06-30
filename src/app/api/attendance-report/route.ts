import { NextRequest } from "next/server";
import { attendanceService } from "@/features/attendance/services/attendance";
import { leaveService } from "@/features/attendance/services/leave";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const month = searchParams.get("month");

    if (!userId || !month) {
      return Response.json(
        {
          error: "Missing required parameters: userId and month",
        },
        { status: 400 },
      );
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return Response.json(
        {
          error: "Invalid month format. Use YYYY-MM",
        },
        { status: 400 },
      );
    }

    const report = await attendanceService.getMonthlyAttendanceReport(
      userId,
      month,
    );

    // ดึงวันลาของ user ในเดือนนั้น
    const leaves = await leaveService.getUserLeavesInMonth(userId, month);
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
                }
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
              }
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

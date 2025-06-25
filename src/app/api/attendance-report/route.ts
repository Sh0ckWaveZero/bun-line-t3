import { NextRequest } from 'next/server';
import { attendanceService } from '@/features/attendance/services/attendance';
import { leaveService } from '@/features/attendance/services/leave';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');

    if (!userId || !month) {
      return Response.json({ 
        error: 'Missing required parameters: userId and month' 
      }, { status: 400 });
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return Response.json({ 
        error: 'Invalid month format. Use YYYY-MM' 
      }, { status: 400 });
    }

    const report = await attendanceService.getMonthlyAttendanceReport(userId, month);

    // ดึงวันลาของ user ในเดือนนั้น
    const leaves = await leaveService.getUserLeavesInMonth(userId, month);
    // สร้าง set ของวันที่ลา
    const leaveDates = new Set(leaves.map(l => l.date));
    // สร้างรายงานใหม่โดยนับวันที่ลาเป็น "ไม่ขาดงาน"
    if (report) {
      // เพิ่ม attendanceRecords สำหรับวันลาที่ไม่มีบันทึกเข้างาน
      const allDates = new Set([
        ...report.attendanceRecords.map(r => r.workDate),
        ...leaves.map(l => l.date)
      ]);
      const recordsWithLeave = Array.from(allDates).map(date => {
        const found = report.attendanceRecords.find(r => r.workDate === date);
        if (found) return found;
        if (leaveDates.has(date)) {
          return {
            id: `leave-${date}`,
            workDate: date,
            checkInTime: null,
            checkOutTime: null,
            status: 'LEAVE',
            hoursWorked: null
          };
        }
        return null;
      }).filter(Boolean);
      // นับ totalDaysWorked ใหม่ (วันลานับเป็นมาทำงาน)
      const totalDaysWorked = recordsWithLeave.length;
      // ส่งข้อมูลใหม่กลับไป
      return Response.json({
        success: true,
        data: {
          ...report,
          attendanceRecords: recordsWithLeave,
          totalDaysWorked
        }
      }, { status: 200 });
    }

    if (!report) {
      return Response.json({ 
        error: 'Failed to generate attendance report' 
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      data: report
    }, { status: 200 });

  } catch (error) {
    console.error('Error in attendance report API:', error);
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

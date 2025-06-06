import { db } from "~/lib/database/db";

interface CheckInResult {
  success: boolean;
  message: string;
  checkInTime?: Date;
  expectedCheckOutTime?: Date;
  alreadyCheckedIn?: boolean;
}

interface MonthlyAttendanceReport {
  userId: string;
  month: string; // YYYY-MM format
  totalDaysWorked: number;
  totalHoursWorked: number;
  attendanceRecords: AttendanceRecord[];
  workingDaysInMonth: number;
  attendanceRate: number; // percentage
}

interface AttendanceRecord {
  id: string;
  workDate: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  status: string;
  hoursWorked: number | null;
}

const formatThaiTime = (date: Date): string => {
  return date.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatThaiTimeOnly = (date: Date): string => {
  return date.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getTodayDateString = (): string => {
  const today = new Date();
  const bangkokTime = new Date(today.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
  return bangkokTime.toISOString().split('T')[0] || ''; // YYYY-MM-DD format
};

const checkIn = async (userId: string): Promise<CheckInResult> => {
  try {
    const todayDate = getTodayDateString();
    const checkInTime = new Date();
    
    // Check if user already checked in today
    const existingAttendance = await db.workAttendance.findUnique({
      where: {
        userId_workDate: {
          userId: userId,
          workDate: todayDate
        }
      }
    });

    if (existingAttendance) {
      // If already checked out, allow check in again by updating the record
      if (existingAttendance.status === "checked_out") {
        // Calculate expected check-out time (9 hours later)
        const expectedCheckOutTime = new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000);
        
        // Update existing record with new check-in time
        await db.workAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            checkInTime: checkInTime,
            checkOutTime: null, // Reset check-out time
            status: "checked_in"
          }
        });
        
        return {
          success: true,
          message: "ลงชื่อเข้างานสำเร็จ",
          checkInTime: checkInTime,
          expectedCheckOutTime: expectedCheckOutTime
        };
      }
      
      // If still checked in, return already checked in message
      return {
        success: false,
        message: "คุณได้ลงชื่อเข้างานวันนี้แล้ว",
        alreadyCheckedIn: true,
        checkInTime: existingAttendance.checkInTime,
        expectedCheckOutTime: new Date(existingAttendance.checkInTime.getTime() + 9 * 60 * 60 * 1000)
      };
    }

    // Calculate expected check-out time (9 hours later)
    const expectedCheckOutTime = new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000);

    // Create new attendance record
    await db.workAttendance.create({
      data: {
        userId: userId,
        checkInTime: checkInTime,
        workDate: todayDate,
        status: "checked_in"
      }
    });

    return {
      success: true,
      message: "ลงชื่อเข้างานสำเร็จ",
      checkInTime: checkInTime,
      expectedCheckOutTime: expectedCheckOutTime
    };

  } catch (error) {
    console.error('Error during check-in:', error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลงชื่อเข้างาน"
    };
  }
};

const checkOut = async (userId: string): Promise<CheckInResult> => {
  try {
    const todayDate = getTodayDateString();
    const checkOutTime = new Date();
    
    // Find today's attendance record
    const attendance = await db.workAttendance.findUnique({
      where: {
        userId_workDate: {
          userId: userId,
          workDate: todayDate
        }
      }
    });

    if (!attendance) {
      return {
        success: false,
        message: "ไม่พบการลงชื่อเข้างานวันนี้"
      };
    }

    if (attendance.status === "checked_out") {
      return {
        success: false,
        message: "คุณได้ลงชื่อออกงานแล้ว",
        checkInTime: attendance.checkInTime,
        expectedCheckOutTime: attendance.checkOutTime || new Date()
      };
    }

    // Update attendance record with check-out time
    await db.workAttendance.update({
      where: {
        id: attendance.id
      },
      data: {
        checkOutTime: checkOutTime,
        status: "checked_out"
      }
    });

    return {
      success: true,
      message: "ลงชื่อออกงานสำเร็จ",
      checkInTime: attendance.checkInTime,
      expectedCheckOutTime: checkOutTime
    };

  } catch (error) {
    console.error('Error during check-out:', error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลงชื่อออกงาน"
    };
  }
};

const getTodayAttendance = async (userId: string) => {
  try {
    const todayDate = getTodayDateString();
    
    const attendance = await db.workAttendance.findUnique({
      where: {
        userId_workDate: {
          userId: userId,
          workDate: todayDate
        }
      }
    });

    return attendance;
  } catch (error) {
    console.error('Error getting today attendance:', error);
    return null;
  }
};

const getMonthlyAttendanceReport = async (userId: string, month: string): Promise<MonthlyAttendanceReport | null> => {
  try {
    // Parse month (YYYY-MM format)
    const [year, monthNum] = month.split('-');
    if (!year || !monthNum) {
      throw new Error('Invalid month format. Use YYYY-MM');
    }

    // Get first and last day of the month in YYYY-MM-DD format
    const firstDay = `${year}-${monthNum.padStart(2, '0')}-01`;
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const lastDayStr = `${year}-${monthNum.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    // Get attendance records for the month
    const attendanceRecords = await db.workAttendance.findMany({
      where: {
        userId: userId,
        workDate: {
          gte: firstDay,
          lte: lastDayStr,
        }
      },
      orderBy: {
        workDate: 'asc'
      }
    });

    // Calculate total working days in month (excluding weekends)
    const workingDaysInMonth = getWorkingDaysInMonth(parseInt(year), parseInt(monthNum) - 1);

    // Process attendance records
    const processedRecords: AttendanceRecord[] = attendanceRecords.map(record => {
      let hoursWorked: number | null = null;
      
      if (record.checkInTime && record.checkOutTime) {
        const timeDiff = record.checkOutTime.getTime() - record.checkInTime.getTime();
        hoursWorked = timeDiff / (1000 * 60 * 60); // Convert to hours
      }

      return {
        id: record.id,
        workDate: record.workDate,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        status: record.status,
        hoursWorked: hoursWorked
      };
    });

    // Calculate statistics
    const totalDaysWorked = processedRecords.length;
    const totalHoursWorked = processedRecords.reduce((total, record) => {
      return total + (record.hoursWorked || 0);
    }, 0);
    const attendanceRate = workingDaysInMonth > 0 ? (totalDaysWorked / workingDaysInMonth) * 100 : 0;

    return {
      userId,
      month,
      totalDaysWorked,
      totalHoursWorked: Math.round(totalHoursWorked * 100) / 100, // Round to 2 decimal places
      attendanceRecords: processedRecords,
      workingDaysInMonth,
      attendanceRate: Math.round(attendanceRate * 100) / 100
    };

  } catch (error) {
    console.error('Error getting monthly attendance report:', error);
    return null;
  }
};

const getWorkingDaysInMonth = (year: number, month: number): number => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    // Count weekdays only (Monday = 1, Sunday = 0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  return workingDays;
};

export const attendanceService = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMonthlyAttendanceReport,
  formatThaiTime,
  formatThaiTimeOnly
};

import { prisma } from "~/server/db";

interface CheckInResult {
  success: boolean;
  message: string;
  checkInTime?: Date;
  expectedCheckOutTime?: Date;
  alreadyCheckedIn?: boolean;
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
    const existingAttendance = await prisma.workAttendance.findUnique({
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
        await prisma.workAttendance.update({
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
    await prisma.workAttendance.create({
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
    const attendance = await prisma.workAttendance.findUnique({
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
    await prisma.workAttendance.update({
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
    
    const attendance = await prisma.workAttendance.findUnique({
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

export const attendanceService = {
  checkIn,
  checkOut,
  getTodayAttendance,
  formatThaiTime,
  formatThaiTimeOnly
};

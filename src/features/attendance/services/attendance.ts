import { db } from "~/lib/database/db";
import { holidayService } from "./holidays";

// Company workplace policies (based on Thai requirements)
const WORKPLACE_POLICIES = {
  // Working days: Monday to Friday (1-5, where Sunday = 0)
  WORKING_DAYS: [1, 2, 3, 4, 5] as const,
  
  // Flexible working hours: 08:00 - 11:00 start time
  EARLIEST_CHECK_IN: { hour: 8, minute: 0 },
  LATEST_CHECK_IN: { hour: 11, minute: 0 },
  
  // Total working hours including lunch break
  TOTAL_HOURS_PER_DAY: 9,
  ACTUAL_WORKING_HOURS: 8, // Excluding 1-hour lunch break
  LUNCH_BREAK_HOURS: 1,
  
  // Time zone
  TIMEZONE: 'Asia/Bangkok'
};

interface CheckInResult {
  success: boolean;
  message: string;
  checkInTime?: Date;
  expectedCheckOutTime?: Date;
  alreadyCheckedIn?: boolean;
  isEarlyCheckIn?: boolean;
  actualCheckInTime?: Date;
}

interface MonthlyAttendanceReport {
  userId: string;
  month: string; // YYYY-MM format
  totalDaysWorked: number;
  totalHoursWorked: number;
  attendanceRecords: AttendanceRecord[];
  workingDaysInMonth: number;
  attendanceRate: number; // percentage
  complianceRate: number; // percentage of days with full 9-hour work
  averageHoursPerDay: number;
  completeDays: number; // number of days with complete 9-hour work
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

// Policy validation functions
const isWorkingDay = async (date: Date): Promise<boolean> => {
  // Check if it's a weekend (Saturday = 6, Sunday = 0)
  const dayOfWeek = date.getDay();
  if (!(WORKPLACE_POLICIES.WORKING_DAYS as readonly number[]).includes(dayOfWeek)) {
    return false;
  }
  
  // Check if it's a public holiday using database
  const isHoliday = await holidayService.isPublicHoliday(date);
  if (isHoliday) {
    return false;
  }
  
  return true;
};

const isPublicHoliday = async (date: Date): Promise<boolean> => {
  return await holidayService.isPublicHoliday(date);
};

const isValidCheckInTime = (date: Date): { valid: boolean; message?: string; isEarlyCheckIn?: boolean } => {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  const earliestTime = WORKPLACE_POLICIES.EARLIEST_CHECK_IN.hour * 60 + WORKPLACE_POLICIES.EARLIEST_CHECK_IN.minute;
  const latestTime = WORKPLACE_POLICIES.LATEST_CHECK_IN.hour * 60 + WORKPLACE_POLICIES.LATEST_CHECK_IN.minute;
  
  // Allow check-in from midnight (00:00) to before earliest time (08:00) as early check-in
  if (hour >= 0 && hour < WORKPLACE_POLICIES.EARLIEST_CHECK_IN.hour) {
    return {
      valid: true,
      isEarlyCheckIn: true,
      message: `ลงชื่อเข้างานล่วงหน้า (บันทึกเวลาตามจริง แต่เลิกงาน 17:00 น.)`
    };
  }
  
  // Allow early check-in (exactly at 8:00 but before normal start time window)
  if (timeInMinutes < earliestTime) {
    return {
      valid: true,
      isEarlyCheckIn: true,
      message: `ลงชื่อเข้างานล่วงหน้า (บันทึกเวลาตามจริง แต่เลิกงาน 17:00 น.)`
    };
  }
  
  if (timeInMinutes > latestTime) {
    return {
      valid: false,
      message: `เวลาเข้างานสายเกินไป กรุณาเข้างานก่อน ${WORKPLACE_POLICIES.LATEST_CHECK_IN.hour}:${WORKPLACE_POLICIES.LATEST_CHECK_IN.minute.toString().padStart(2, '0')} น.`
    };
  }
  
  return { valid: true };
};

const calculateExpectedCheckOutTime = (checkInTime: Date): Date => {
  return new Date(checkInTime.getTime() + WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY * 60 * 60 * 1000);
};

const getWorkingHoursInfo = (checkInTime: Date, checkOutTime?: Date) => {
  const expectedCheckOut = calculateExpectedCheckOutTime(checkInTime);
  
  if (!checkOutTime) {
    return {
      expectedCheckOutTime: expectedCheckOut,
      isCompleteWorkDay: false,
      actualHours: 0,
      status: 'in_progress' as const
    };
  }
  
  const actualWorkingMs = checkOutTime.getTime() - checkInTime.getTime();
  const actualHours = actualWorkingMs / (1000 * 60 * 60);
  const isCompleteWorkDay = actualHours >= WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY;
  
  return {
    expectedCheckOutTime: expectedCheckOut,
    actualCheckOutTime: checkOutTime,
    isCompleteWorkDay,
    actualHours: Math.round(actualHours * 100) / 100,
    status: isCompleteWorkDay ? 'complete' as const : 'incomplete' as const
  };
};

const getTodayDateString = (): string => {
  const today = new Date();
  // Convert to Bangkok timezone and format as YYYY-MM-DD
  const bangkokDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(today);
  return bangkokDate; // Already in YYYY-MM-DD format
};

const getCurrentBangkokTime = (): Date => {
  const now = new Date();
  // Get current time in Bangkok timezone
  const bangkokTimeString = now.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Parse the Bangkok time string back to a Date object
  const bangkokTime = new Date(bangkokTimeString);
  return bangkokTime;
};

const checkIn = async (userId: string): Promise<CheckInResult> => {
  try {
    const todayDate = getTodayDateString();
    const actualCheckInTime = getCurrentBangkokTime();
    
    // Debug current time
    console.log('=== Check-in Debug ===');
    console.log('User ID:', userId);
    console.log('Today Date:', todayDate);
    console.log('Actual Check-in Time:', formatThaiTime(actualCheckInTime));
    console.log('Hour:', actualCheckInTime.getHours(), 'Minute:', actualCheckInTime.getMinutes());
    
    // Policy validation: Check if today is a working day
    const isWorking = await isWorkingDay(actualCheckInTime);
    console.log('Is Working Day:', isWorking);
    
    if (!isWorking) {
      const dayName = actualCheckInTime.toLocaleDateString('th-TH', { 
        weekday: 'long',
        timeZone: 'Asia/Bangkok'
      });
      
      // Check if it's a public holiday
      const isHoliday = await isPublicHoliday(actualCheckInTime);
      if (isHoliday) {
        return {
          success: false,
          message: `วันนี้เป็นวันหยุดประจำปี ไม่สามารถลงชื่อเข้างานได้`
        };
      }
      
      // If not a public holiday, it must be a weekend
      return {
        success: false,
        message: `วันนี้เป็น${dayName} ไม่ใช่วันทำงาน (จันทร์-ศุกร์เท่านั้น)`
      };
    }
    
    // Policy validation: Check if check-in time is within allowed hours
    const timeValidation = isValidCheckInTime(actualCheckInTime);
    console.log('Time Validation:', timeValidation);
    
    if (!timeValidation.valid) {
      return {
        success: false,
        message: timeValidation.message || 'เวลาเข้างานไม่ถูกต้อง'
      };
    }
    
    // For early check-in, record actual time but calculate expected checkout differently
    let recordedCheckInTime = actualCheckInTime;
    let calculatedExpectedCheckOutTime: Date;
    
    if (timeValidation.isEarlyCheckIn) {
      // Record actual check-in time
      recordedCheckInTime = actualCheckInTime;
      
      // For early check-in (before 08:00), set checkout time to 17:00
      const year = actualCheckInTime.getFullYear();
      const month = actualCheckInTime.getMonth();
      const date = actualCheckInTime.getDate();
      calculatedExpectedCheckOutTime = new Date(year, month, date, 17, 0, 0, 0);
    } else {
      // Normal check-in: calculate expected checkout from actual check-in time
      calculatedExpectedCheckOutTime = calculateExpectedCheckOutTime(recordedCheckInTime);
    }
    
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
        // Update existing record with new check-in time
        await db.workAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            checkInTime: recordedCheckInTime,
            checkOutTime: null, // Reset check-out time
            status: "checked_in"
          }
        });
        
        return {
          success: true,
          message: "ลงชื่อเข้างานสำเร็จ (ครึ่งวันหลัง)",
          checkInTime: recordedCheckInTime,
          expectedCheckOutTime: calculatedExpectedCheckOutTime
        };
      }
      
      // If still checked in, return already checked in message
      return {
        success: false,
        message: "คุณได้ลงชื่อเข้างานวันนี้แล้ว",
        alreadyCheckedIn: true,
        checkInTime: existingAttendance.checkInTime,
        expectedCheckOutTime: calculateExpectedCheckOutTime(existingAttendance.checkInTime)
      };
    }

    // Create new attendance record
    await db.workAttendance.create({
      data: {
        userId: userId,
        checkInTime: recordedCheckInTime,
        workDate: todayDate,
        status: "checked_in"
      }
    });

    const checkInTimeStr = formatThaiTimeOnly(recordedCheckInTime);
    const expectedCheckOutStr = formatThaiTimeOnly(calculatedExpectedCheckOutTime);
    
    // Create message with early check-in info if applicable
    let message = `ลงชื่อเข้างานสำเร็จ เวลา ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`;
    if (timeValidation.isEarlyCheckIn) {
      message += `\n⏰ มาถึงสำนักงานตั้งแต่ ${checkInTimeStr} น. (เลิกงาน 17:00 น.)`;
    }

    return {
      success: true,
      message: message,
      checkInTime: recordedCheckInTime,
      expectedCheckOutTime: calculatedExpectedCheckOutTime,
      isEarlyCheckIn: timeValidation.isEarlyCheckIn,
      actualCheckInTime: timeValidation.isEarlyCheckIn ? actualCheckInTime : undefined
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
    const checkOutTime = getCurrentBangkokTime();
    
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
      const workInfo = getWorkingHoursInfo(attendance.checkInTime, attendance.checkOutTime || checkOutTime);
      return {
        success: false,
        message: `คุณได้ลงชื่อออกงานแล้ว (ทำงาน ${workInfo.actualHours.toFixed(1)} ชม.)`,
        checkInTime: attendance.checkInTime,
        expectedCheckOutTime: attendance.checkOutTime || checkOutTime
      };
    }

    // Calculate working hours and validate
    const workInfo = getWorkingHoursInfo(attendance.checkInTime, checkOutTime);
    
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

    const checkInTimeStr = formatThaiTimeOnly(attendance.checkInTime);
    const checkOutTimeStr = formatThaiTimeOnly(checkOutTime);
    
    let message = `ลงชื่อออกงานสำเร็จ\nเข้างาน: ${checkInTimeStr} น.\nออกงาน: ${checkOutTimeStr} น.\nรวม: ${workInfo.actualHours.toFixed(1)} ชม.`;
    
    if (!workInfo.isCompleteWorkDay) {
      const shortHours = WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY - workInfo.actualHours;
      message += `\n⚠️ ทำงานไม่ครบ (ขาด ${shortHours.toFixed(1)} ชม.)`;
    } else {
      message += `\n✅ ทำงานครบตามนโยบาย`;
    }

    return {
      success: true,
      message: message,
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

    // Calculate total working days in month (excluding weekends and holidays)
    const workingDaysInMonth = await getWorkingDaysInMonth(parseInt(year), parseInt(monthNum) - 1);

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

    // Calculate statistics with policy compliance
    const totalDaysWorked = processedRecords.length;
    const totalHoursWorked = processedRecords.reduce((total, record) => {
      return total + (record.hoursWorked || 0);
    }, 0);
    const attendanceRate = workingDaysInMonth > 0 ? (totalDaysWorked / workingDaysInMonth) * 100 : 0;
    
    // Calculate policy compliance metrics
    const completeDays = processedRecords.filter(record => 
      record.hoursWorked && record.hoursWorked >= WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY
    ).length;
    const complianceRate = totalDaysWorked > 0 ? (completeDays / totalDaysWorked) * 100 : 0;
    const averageHoursPerDay = totalDaysWorked > 0 ? totalHoursWorked / totalDaysWorked : 0;

    return {
      userId,
      month,
      totalDaysWorked,
      totalHoursWorked: Math.round(totalHoursWorked * 100) / 100, // Round to 2 decimal places
      attendanceRecords: processedRecords,
      workingDaysInMonth,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      complianceRate: Math.round(complianceRate * 100) / 100,
      averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
      completeDays
    };

  } catch (error) {
    console.error('Error getting monthly attendance report:', error);
    return null;
  }
};

const getWorkingDaysInMonth = async (year: number, month: number): Promise<number> => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    
    // Use the isWorkingDay function which checks both weekends and public holidays
    const isWorking = await isWorkingDay(date);
    if (isWorking) {
      workingDays++;
    }
  }

  return workingDays;
};

// Debug function to check current time and validation
const debugTimeValidation = () => {
  const currentTime = getCurrentBangkokTime();
  const timeValidation = isValidCheckInTime(currentTime);
  const todayDate = getTodayDateString();
  
  console.log('=== Debug Time Validation ===');
  console.log('Current Bangkok Time:', formatThaiTime(currentTime));
  console.log('Current Hour:', currentTime.getHours());
  console.log('Current Minute:', currentTime.getMinutes());
  console.log('Today Date String:', todayDate);
  console.log('Time Validation:', timeValidation);
  console.log('Is Early Check-in:', timeValidation.isEarlyCheckIn);
  console.log('============================');
  
  return {
    currentTime,
    timeValidation,
    todayDate,
    formattedTime: formatThaiTime(currentTime)
  };
};

export const attendanceService = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMonthlyAttendanceReport,
  formatThaiTime,
  formatThaiTimeOnly,
  isWorkingDay,
  isPublicHoliday,
  isValidCheckInTime,
  calculateExpectedCheckOutTime,
  getWorkingHoursInfo,
  getWorkingDaysInMonth,
  getCurrentBangkokTime,
  debugTimeValidation,
  WORKPLACE_POLICIES
};

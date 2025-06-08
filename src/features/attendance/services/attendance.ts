import { db } from "~/lib/database/db";
import { holidayService } from "./holidays";
import { selectRandomElement } from "~/lib/crypto-random";
import { 
  roundToTwoDecimals, 
  roundToOneDecimal, 
  calculatePercentage,
  calculateAverage
} from "~/lib/utils/number";

// Company workplace policies (based on Thai requirements)
const WORKPLACE_POLICIES = {
  // Working days: Monday to Friday (1-5, where Sunday = 0)
  WORKING_DAYS: [1, 2, 3, 4, 5] as const,
  
  // Flexible working hours: 08:00 - 11:00 start time
  // NOTE: Early check-in allowed from 00:01-07:59, recording actual time but setting checkout to 17:00
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
  
  // Allow check-in from 00:01 to before earliest time (08:00) as early check-in
  if ((hour === 0 && minute >= 1) || (hour > 0 && hour < WORKPLACE_POLICIES.EARLIEST_CHECK_IN.hour)) {
    return {
      valid: true,
      isEarlyCheckIn: true,
      message: `ลงชื่อเข้างานช่วงเช้า 00:01-07:59 น. (บันทึกเวลาตามจริง แต่เลิกงาน 17:00 น.)`
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
    const lateMessages = [
      `เวลาเข้างานสายเกินไป กรุณาเข้างานก่อน ${WORKPLACE_POLICIES.LATEST_CHECK_IN.hour}:${WORKPLACE_POLICIES.LATEST_CHECK_IN.minute.toString().padStart(2, '0')} น.`,
      `อุ๊ย สายไปแล้ว! 🙈 พรุ่งนี้ตั้งนาฬิกาปลุกเร็วหน่อยนะ`,
      `หลับหลือ? 😴 เข้างานทันเวลาดีกว่า (ก่อน 11:00 น.)`,
      `เอาใจช่วยนาฬิกาปลุกด้วยนะ ⏰ เข้างานช้าไปแล้วจ้า`,
      `แปะ! สายเกินไปแล้ว 🏃‍♂️💨 พรุ่งนี้มาเร็วกว่านี้นะ`,
      `เฮ้อ... สายอีกแล้ว 😅 ไปกินข้าวเช้าแล้วมาใหม่พรุ่งนี้`,
      `มองนาฬิกาซิ สายแล้วค่ะ 🕐 เข้างานก่อน 11:00 น. นะ`
    ] as const;
    const randomMessage = selectRandomElement(lateMessages);
    return {
      valid: false,
      message: randomMessage
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
    actualHours: roundToTwoDecimals(actualHours), // 🚀 ใช้ utility function
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
        const holidayMessages = [
          `วันนี้วันหยุดนักขัตฤกษ์ ไม่ต้องมาทำงานครับ 🎉 พักผ่อนได้เลย`,
          `เฮ้ย! วันนี้วันหยุดใหญ่นะ ไปเที่ยวเลย 🏖️ อย่ามาทำงาน`,
          `วันนี้หยุดยาวๆ นอนดึกได้ แล้วไปกินข้าวอร่อยๆ 😴🍜`,
          `เป็นวันหยุดแล้วยังมาทำงาน? พักบ้างสิคะ 😅 ไปผ่อนคลายได้`,
          `อิอิ วันนี้หยุดนะจ๊ะ ไปเที่ยวกับครอบครัวดีกว่า 👨‍👩‍👧‍👦✨`,
          `หยุดแล้วหยุดแล้ว! เก็บโน๊ตบุ๊คไว้ ไปทำกิจกรรมสนุกๆ 🎮🎨`,
          `วันนี้วันพักผ่อน อย่าเครียดกับงานนะ ไปออกกำลังกายมั้ย? 🏃‍♂️💪`
        ] as const;
        const randomMessage = selectRandomElement(holidayMessages);
        return {
          success: false,
          message: randomMessage
        };
      }
      
      // If not a public holiday, it must be a weekend
      const weekendMessages = [
        `วันนี้${dayName}หยุดนะครับ 😴 มาทำงานวันจันทร์-ศุกร์เท่านั้น`,
        `เอ่อ... วันนี้${dayName}แล้วนะ 🤔 ไปนอนต่อดีกว่า หรือไปเที่ยว!`,
        `${dayName}แล้วยังมาทำงาน? แรงมากเลย 💪 แต่ว่าไปพักดีกว่า`,
        `ปกติ${dayName}นี่นอนดึกได้นะ 😆 ไปทำอะไรสนุกๆ มาเถอะ`,
        `${dayName}หยุดจ้า ไปกินข้าวเที่ยงอร่อยๆ แล้วไปดูหนัง 🍽️🎬`,
        `วันหยุด${dayName} ไปช็อปปิ้งหรือไปตลาดนัดมั้ย? 🛍️✨`,
        `${dayName}นี้พักเบรกๆ ไปออกกำลังกายหรือไปสปาก็ได้ 🧘‍♀️💆‍♂️`
      ] as const;
      const randomMessage = selectRandomElement(weekendMessages);
      return {
        success: false,
        message: randomMessage
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
        
        const afternoonMessages = [
          "ยิ้มๆ กลับมาแล้ว! (ครึ่งวันหลัง) 🌇",
          "ยินดีต้อนรับกลับ! 🌇 เข้างานช่วงบ่ายแล้ว",
          "กลับมาแล้ว! 😊 เข้างานช่วงบ่าย",
          "เริ่มงานช่วงบ่ายกันเลย! ☀️",
          "ช่วงบ่ายมาแล้ว 🕐 เริ่มทำงานต่อ",
          "เข้างานครึ่งวันหลังเรียบร้อย! 👌"
        ] as const;
        const randomMessage = selectRandomElement(afternoonMessages);
        
        return {
          success: true,
          message: randomMessage,
          checkInTime: recordedCheckInTime,
          expectedCheckOutTime: calculatedExpectedCheckOutTime
        };
      }
      
      // If still checked in, return already checked in message
      const alreadyCheckedInMessages = [
        "คุณได้ลงชื่อเข้างานวันนี้แล้ว",
        "เฮ้ย! เข้างานไปแล้วนะ 🤔 จำไม่ได้เหรอ?",
        "มาแล้วค่ะ มาแล้ว! 😄 เข้างานไปตั้งแต่เช้าแล้ว",
        "อิอิ ลืมแล้วเหรอ? เช็คอินไปแล้วนะจ๊ะ ✅",
        "เอ๊ะ? เข้างานไปแล้วนี่นา 🙃 ความจำไม่ดีแล้วเหรอ",
        "มาเก็บข้าวแกงมั้ย? เพราะเข้างานไปแล้ว 😂🍱",
        "ระวังหลงทางในออฟฟิศนะ เข้างานไปแล้วน้า 🗺️"
      ] as const;
      const randomMessage = selectRandomElement(alreadyCheckedInMessages);
      return {
        success: false,
        message: randomMessage,
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
    
    // Create success messages
    const successMessages = [
      `เยี่ยม! เข้างานแล้ว 🌟 ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
      `เย่! เข้างานแล้ว 🎉 ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
      `ยินดีต้อนรับสู่ออฟฟิศ! ⭐ ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
      `สู้ๆ วันนี้นะ! 💪 เข้างาน ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
      `เริ่มต้นวันใหม่แล้ว ✨ ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
      `มาแล้วจ้า! 😊 เข้างาน ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
      `พร้อมทำงานแล้ว! 🚀 ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`
    ] as const;
    
    let message = selectRandomElement(successMessages);
    
    if (timeValidation.isEarlyCheckIn) {
      const hour = actualCheckInTime.getHours();
      // 🚀 คำนวณ string ครั้งเดียว
      const checkInStr = checkInTimeStr;
      const checkOutStr = "17:00 น.";
      
      const earlyMessages = [
        `\n⏰ มาถึงสำนักงานตั้งแต่ ${checkInStr} น. (เลิกงาน ${checkOutStr})`,
        `\n🌅 มาเช้ามากเลย! ${checkInStr} น. (เลิกงาน ${checkOutStr})`,
        `\n⭐ ขยันจัง! มาตั้งแต่ ${checkInStr} น. (เลิกงาน ${checkOutStr})`,
        `\n🐓 ไก่ยังไม่ขัน! ${checkInStr} น. (เลิกงาน ${checkOutStr})`
      ] as const;
      
      if (hour < 1) {
        message += `\n🌙 มาถึงสำนักงานหลังเที่ยงคืน ${checkInStr} น. (เลิกงาน ${checkOutStr})`;
      } else {
        message += selectRandomElement(earlyMessages);
      }
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
    const gentleErrorMessages = [
      "อุ๊ปส์ ระบบมีอาการงัวเงียนิดหน่อย 🌸 รอซักครู่แล้วลองใหม่นะคะ",
      "เอ๊ะ มีอะไรผิดปกติเล็กน้อย 🦋 ช่วยลองใหม่อีกครั้งได้มั้ยคะ",
      "โทษทีนะคะ ระบบกำลังหลับในค่ะ 😴💤 ลองกดใหม่ดูนะ",
      "อ่าว มีบางอย่างไม่ค่อยเรียบร้อย 🌺 ขอโทษด้วยนะ ลองใหม่ได้เลย",
      "โอ้โห ระบบงงๆ นิดหน่อย 🌙✨ รอหน่อยแล้วลองใหม่ดูนะคะ",
      "ขออภัยค่ะ มีเรื่องไม่คาดฝันเกิดขึ้น 🌿 ลองอีกครั้งได้มั้ยคะ",
      "เสียใจด้วยนะ ระบบค้างซักหน่อย 🕊️ ช่วยรอแป้บแล้วลองใหม่ค่ะ"
    ] as const;
    const randomMessage = selectRandomElement(gentleErrorMessages);
    return {
      success: false,
      message: randomMessage
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
      const gentleNotFoundMessages = [
        "หืม... ดูเหมือนว่าวันนี้ยังไม่ได้เข้างานเลยนะ 🌸 ลองเข้างานก่อนไหมคะ",
        "อ่าว ไม่เจอการลงชื่อเข้างานวันนี้เลย 🦋 เข้างานก่อนแล้วค่อยออกนะ",
        "เอ๊ะ วันนี้ยังไม่ได้เซ็นชื่อเข้างานเหรอคะ 😴 ลองเข้างานก่อนดูนะ",
        "โอ้โห ยังไม่เจอรอยเท้าการเข้างานวันนี้เลย 🌺 เข้างานก่อนไหมคะ",
        "ดูสิ ยังไม่มีการเข้างานวันนี้เลย 🌙 ลองเข้างานก่อนแล้วค่อยออกนะ",
        "อุ๊ปส์ วันนี้ยังไม่ได้เริ่มงานเหรอคะ 🌿 เข้างานก่อนแล้วค่อยออกนะ",
        "เฮ้ย ยังไม่เจอข้อมูลการเข้างานวันนี้เลย 🕊️ ลองเข้างานก่อนดูไหม"
      ] as const;
      const randomMessage = selectRandomElement(gentleNotFoundMessages);
      return {
        success: false,
        message: randomMessage
      };
    }

    if (attendance.status === "checked_out") {
      const workInfo = getWorkingHoursInfo(attendance.checkInTime, attendance.checkOutTime || checkOutTime);
      const workHours = roundToOneDecimal(workInfo.actualHours); // 🚀 ใช้ utility function
      const alreadyCheckedOutMessages = [
        `เฮ้ย ออกงานไปแล้วนะ 😄 ทำงานมา ${workHours} ชม. เก่งมาก!`,
        `อ่าว ลงชื่อออกไปแล้วจ้า 🎉 วันนี้ทำงาน ${workHours} ชม. เลย`,
        `โอ้โห ออกงานไปแล้วหรอ 😊 ทำงานครบ ${workHours} ชม. แล้วนะ`,
        `เออ ออกงานไปแล้วแหละ ✨ วันนี้ทำงาน ${workHours} ชม. เหนื่อยมั้ย`,
        `เฮ้ อ๊ากกก ออกไปแล้วจ้า 💪 ทำงานมา ${workHours} ชม. เก่งสุดๆ`,
        `หืม... ออกงานไปแล้วนะคะ 🚀 วันนี้ทำงาน ${workHours} ชม.`,
        `อุ๊ปส์ ออกไปแล้วแหละ 😌 ทำงานได้ ${workHours} ชม. ดีมาก!`
      ] as const;
      const randomMessage = selectRandomElement(alreadyCheckedOutMessages);
      return {
        success: false,
        message: randomMessage,
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
    
    const successCheckoutMessages = [
      "ยิ้มๆ เสร็จงานเรียบร้อยแล้ว! 🎉",
      "ออกงานแล้วจ้า ดีมากก! ✨",
      "เก่งมาก! ทำงานจบแล้ว 💪",
      "สุดยอด! วันนี้ทำงานเสร็จแล้ว 😊",
      "โอเค! ออกงานเรียบร้อย 🚀",
      "ได้แล้ว! เลิกงานแล้วจ้า 😌",
      "เยี่ยม! ลงชื่อออกงานสำเร็จ 🌟"
    ] as const;
    const randomSuccessMessage = selectRandomElement(successCheckoutMessages);
    
    // 🚀 คำนวณค่าต่างๆ ครั้งเดียว
    const workHours = roundToOneDecimal(workInfo.actualHours);
    let message = `${randomSuccessMessage}\nเข้างาน: ${checkInTimeStr} น.\nออกงาน: ${checkOutTimeStr} น.\nรวม: ${workHours} ชม.`;
    
    if (!workInfo.isCompleteWorkDay) {
      const shortHours = WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY - workInfo.actualHours;
      const shortHoursStr = roundToOneDecimal(shortHours); // 🚀 ใช้ utility function
      const shortWorkMessages = [
        `💭 วันนี้ทำงานเร็วไปนิดนึง (ขาด ${shortHoursStr} ชม.)`,
        `🤔 อ่าว เลิกเร็วไปหน่อยนะ (ขาด ${shortHoursStr} ชม.)`,
        `😊 วันนี้เลิกงานเร็วนะ (ขาด ${shortHoursStr} ชม.)`,
        `🌸 ทำงานสั้นไปนิดหน่อย (ขาด ${shortHoursStr} ชม.)`
      ] as const;
      const randomShortMessage = selectRandomElement(shortWorkMessages);
      message += `\n${randomShortMessage}`;
    } else {
      const completeWorkMessages = [
        "✨ ทำงานครบตามนโยบาย เก่งมาก!",
        "🎯 สุดยอด! ทำงานครบแล้ว",
        "💪 เยี่ยม! ทำงานครบ 8 ชม.",
        "🌟 ดีมาก! ครบตามนโยบาย",
        "🎉 เก่งจัง! ทำงานครบเวลา"
      ] as const;
      const randomCompleteMessage = selectRandomElement(completeWorkMessages);
      message += `\n${randomCompleteMessage}`;
    }

    return {
      success: true,
      message: message,
      checkInTime: attendance.checkInTime,
      expectedCheckOutTime: checkOutTime
    };

  } catch (error) {
    console.error('Error during check-out:', error);
    const gentleErrorMessages = [
      "อุ๊ปส์ ระบบมีอาการงัวเงียนิดหน่อย 🌸 รอซักครู่แล้วลองใหม่นะคะ",
      "เอ๊ะ มีอะไรผิดปกติเล็กน้อย 🦋 ช่วยลองใหม่อีกครั้งได้มั้ยคะ",
      "โทษทีนะคะ ระบบกำลังหลับในค่ะ 😴💤 ลองกดใหม่ดูนะ",
      "อ่าว มีบางอย่างไม่ค่อยเรียบร้อย 🌺 ขอโทษด้วยนะ ลองใหม่ได้เลย",
      "โอ้โห ระบบงงๆ นิดหน่อย 🌙✨ รอหน่อยแล้วลองใหม่ดูนะคะ",
      "ขออภัยค่ะ มีเรื่องไม่คาดฝันเกิดขึ้น 🌿 ลองอีกครั้งได้มั้ยคะ",
      "เสียใจด้วยนะ ระบบค้างซักหน่อย 🕊️ ช่วยรอแป้บแล้วลองใหม่ค่ะ"
    ] as const;
    const randomMessage = selectRandomElement(gentleErrorMessages);
    return {
      success: false,
      message: randomMessage
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
    // Calculate metrics
    const attendanceRate = calculatePercentage(totalDaysWorked, workingDaysInMonth);
    
    // Calculate policy compliance metrics
    const completeDays = processedRecords.filter(record => 
      record.hoursWorked && record.hoursWorked >= WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY
    ).length;
    const complianceRate = calculatePercentage(completeDays, totalDaysWorked);
    const averageHoursPerDay = calculateAverage(totalHoursWorked, totalDaysWorked);

    // 🚀 คำนวณค่าต่างๆ ครั้งเดียว
    const roundedTotalHours = roundToTwoDecimals(totalHoursWorked);
    const roundedAttendanceRate = roundToTwoDecimals(attendanceRate);
    const roundedComplianceRate = roundToTwoDecimals(complianceRate);
    const roundedAverageHours = roundToTwoDecimals(averageHoursPerDay);

    return {
      userId,
      month,
      totalDaysWorked,
      totalHoursWorked: roundedTotalHours,
      attendanceRecords: processedRecords,
      workingDaysInMonth,
      attendanceRate: roundedAttendanceRate,
      complianceRate: roundedComplianceRate,
      averageHoursPerDay: roundedAverageHours,
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

/**
 * Finds all users who checked in today but haven't checked out yet
 * @returns Array of user IDs who need checkout reminders
 */
const getUsersWithPendingCheckout = async (): Promise<string[]> => {
  try {
    const todayDate = getTodayDateString();
    
    // Get all attendance records for today with status "checked_in"
    const pendingCheckouts = await db.workAttendance.findMany({
      where: {
        workDate: todayDate,
        status: "checked_in",
      },
      select: {
        userId: true
      }
    });
    
    // Extract just the user IDs
    return pendingCheckouts.map(record => record.userId);
  } catch (error) {
    console.error('Error finding users with pending checkouts:', error);
    return [];
  }
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
  WORKPLACE_POLICIES,
  getUsersWithPendingCheckout
};

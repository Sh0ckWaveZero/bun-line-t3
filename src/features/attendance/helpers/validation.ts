// Attendance validation helpers
import { WORKPLACE_POLICIES } from "~/features/attendance/constants/workplace-policies";
import { holidayService } from "~/features/attendance/services/holidays";

export const isWorkingDay = async (date: Date): Promise<boolean> => {
  // Check if it's a weekend (Saturday = 6, Sunday = 0)
  // Date object already converted to Bangkok time, use UTC method to avoid double conversion
  const dayOfWeek = date.getUTCDay();
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

export const isPublicHoliday = async (date: Date): Promise<boolean> => {
  return await holidayService.isPublicHoliday(date);
};

export const isValidCheckInTime = (date: Date): { valid: boolean; message?: string; isEarlyCheckIn?: boolean; isLateCheckIn?: boolean } => {
  // Date object already converted to Bangkok time, use UTC methods to avoid double conversion
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
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
    return {
      valid: true,
      message: `โอ้โห่ววว! สายยยกว่าแม่หมดรอบเดือนอีกกก! 😱 แต่ไม่เป็นไรจ้าาาา เข้างานได้ทั้งวันเลยยย! 🎉 มาแล้วมีชัยไปกว่าครึ่งนะจ๊ะคนดี! 🥰 ระบบบันทึกเวลามาสายให้แล้วจ้า! ไม่ต้องเศร้าเสียใจไป! 💓 สายแค่ไหนก็เข้าได้! ดีกว่าหนีงานแน่นอนนนน! 😂 เราเชื่อในตัวคุณณณณ! 🚀✨`,
      isLateCheckIn: true
    };
  }
  
  return { valid: true };
};

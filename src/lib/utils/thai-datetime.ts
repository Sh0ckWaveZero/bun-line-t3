/**
 * Thai datetime utilities
 * ฟังก์ชันสำหรับจัดการวันที่และเวลาในรูปแบบไทย
 */

// ชื่อวันและเดือนในภาษาไทย
export const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

/**
 * แปลงเวลา UTC เป็นเวลาไทย (UTC+7)
 * @param utcTime เวลา UTC
 * @returns เวลาไทย (UTC+7) ในรูปแบบ Date
 */
export const convertToThaiTime = (utcTime: Date): Date => {
  const thailandTime = new Date(utcTime);
  thailandTime.setUTCHours(utcTime.getUTCHours() + 7); // เพิ่ม 7 ชั่วโมงสำหรับเวลาไทย
  return thailandTime;
};

/**
 * แปลงวันที่เป็นคำอธิบายวันที่แบบไทย
 * @param date วันที่ที่ต้องการแปลง
 * @returns วันที่แบบไทย เช่น "วันจันทร์ที่ 9 มิถุนายน 2568"
 */
export const formatThaiDate = (date: Date): string => {
  const thaiDate = convertToThaiTime(date);
  
  const day = thaiDate.getUTCDate();
  const month = thaiDate.getUTCMonth();
  const year = thaiDate.getUTCFullYear() + 543; // แปลงเป็นปีพุทธศักราช
  const dayOfWeek = thaiDate.getUTCDay(); // 0 = อาทิตย์, 1 = จันทร์, ...
  
  return `วัน${thaiDays[dayOfWeek]}ที่ ${day} ${thaiMonths[month]} ${year}`;
};

/**
 * แปลงเวลาเป็นรูปแบบชั่วโมง:นาที
 * @param date วันที่และเวลา
 * @param useThaiTime แปลงเป็นเวลาไทยก่อนหรือไม่
 * @returns เวลาในรูปแบบชั่วโมง:นาที เช่น "08:30"
 */
export const formatTimeHM = (date: Date, useThaiTime = true): string => {
  let hours: number;
  
  if (useThaiTime) {
    // ใช้ getUTCHours แล้วบวก 7 ชั่วโมงสำหรับเวลาไทย (UTC+7)
    hours = (date.getUTCHours() + 7) % 24;
  } else {
    hours = date.getHours();
  }
  
  const minutes = useThaiTime ? date.getUTCMinutes() : date.getMinutes();
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * แสดงเวลาเป็นรูปแบบที่อ่านง่ายสำหรับคนไทย
 * @param date วันที่และเวลา
 * @returns เวลาในรูปแบบ "HH:MM น."
 */
export const formatThaiTimeString = (date: Date): string => {
  return `${formatTimeHM(date)} น.`;
};

/**
 * คำนวณเวลาเลิกงานจากเวลาเข้างาน (9 ชั่วโมงหลังเข้างาน)
 * @param checkInTime เวลาเข้างาน
 * @returns เวลาเลิกงานที่คาดการณ์
 */
export const calculateExpectedCheckOutTime = (checkInTime: Date): Date => {
  return new Date(checkInTime.getTime() + 9 * 60 * 60 * 1000); // เพิ่ม 9 ชั่วโมง
};

/**
 * คำนวณระยะเวลาการทำงานระหว่างสองช่วงเวลา
 * @param startTime เวลาเริ่มต้น
 * @param endTime เวลาสิ้นสุด
 * @returns ข้อความแสดงระยะเวลาในรูปแบบ "X ชั่วโมง Y นาที"
 */
export const calculateWorkDuration = (startTime: Date, endTime: Date): { hours: number; minutes: number; formatted: string } => {
  const durationMs = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  const formatted = hours > 0
    ? `${hours} ชั่วโมง ${minutes} นาที`
    : `${minutes} นาที`;
  
  return { hours, minutes, formatted };
};

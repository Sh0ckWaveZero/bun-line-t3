/**
 * ไทป์และอินเทอร์เฟซสำหรับระบบลงเวลาทำงาน
 */

/**
 * ผลลัพธ์การลงเวลาเข้างานหรือออกงาน
 */
export interface CheckInResult {
  success: boolean;
  message: string;
  checkInTime?: Date;
  expectedCheckOutTime?: Date;
  alreadyCheckedIn?: boolean;
  isEarlyCheckIn?: boolean;
  isLateCheckIn?: boolean;
  actualCheckInTime?: Date;
}

/**
 * รายงานการลงเวลาทำงานรายเดือน
 */
export interface MonthlyAttendanceReport {
  userId: string;
  month: string; // รูปแบบ YYYY-MM
  totalDaysWorked: number;
  totalHoursWorked: number;
  attendanceRecords: AttendanceRecord[];
  workingDaysInMonth: number;
  attendanceRate: number; // เปอร์เซ็นต์
  complianceRate: number; // เปอร์เซ็นต์ของวันที่ทำงานครบ 9 ชั่วโมง
  averageHoursPerDay: number;
  completeDays: number; // จำนวนวันที่ทำงานครบ 9 ชั่วโมง
}

/**
 * บันทึกการลงเวลาทำงาน
 */
export interface AttendanceRecord {
  id: string;
  workDate: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  status: string;
  hoursWorked: number | null;
}

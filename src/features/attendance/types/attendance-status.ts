// Enum สำหรับใช้ฝั่ง client เท่านั้น เพื่อความปลอดภัยและลด dependency จาก @prisma/client
// หากมีการเปลี่ยนแปลง schema ให้ sync ค่านี้กับฝั่ง server เสมอ

export enum AttendanceStatusType {
  CHECKED_IN_ON_TIME = 'CHECKED_IN_ON_TIME',
  CHECKED_IN_LATE = 'CHECKED_IN_LATE', 
  CHECKED_OUT = 'CHECKED_OUT',
}

// Export สำหรับการใช้งานแบบ type-safe
export const ATTENDANCE_STATUS = AttendanceStatusType;

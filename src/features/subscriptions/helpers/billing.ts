/**
 * Helper functions สำหรับคำนวณวันที่เรียกเก็บเงิน
 */

import { format, setDate, lastDayOfMonth, isBefore, isAfter, startOfMonth } from "date-fns"

/**
 * คำนวณวันครบกำหนดจ่ายเงินในเดือนที่กำหนด
 * รองรับกรณีวันที่เกินจำนวนวันในเดือน (เช่น 31 ใน ก.พ. → ใช้วันสุดท้ายของเดือน)
 */
export function getDueDate(billingDay: number, billingMonth: string): Date {
  const [year, month] = billingMonth.split("-").map(Number) as [number, number]
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = lastDayOfMonth(firstDay)
  const safeDay = Math.min(billingDay, lastDay.getDate())
  return setDate(firstDay, safeDay)
}

/**
 * สร้าง billing month string (YYYY-MM) จาก Date
 */
export function toBillingMonth(date: Date): string {
  return format(date, "yyyy-MM")
}

/**
 * สร้าง billing months ล่วงหน้า N เดือน
 */
export function getUpcomingBillingMonths(fromDate: Date, count: number): string[] {
  const months: string[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(fromDate.getFullYear(), fromDate.getMonth() + i, 1)
    months.push(format(d, "yyyy-MM"))
  }
  return months
}

/**
 * ตรวจสอบว่าวันครบกำหนดผ่านไปแล้วหรือยัง
 */
export function isOverdue(dueDate: Date, paidAt?: Date | null): boolean {
  if (paidAt) return false
  return isBefore(dueDate, new Date())
}

/**
 * คำนวณ share amount ของแต่ละสมาชิกในกรณี family plan (แบ่งเท่ากัน)
 */
export function calculateEqualShare(totalPrice: number, memberCount: number): number {
  if (memberCount <= 0) return totalPrice
  return Math.ceil((totalPrice / memberCount) * 100) / 100
}

/**
 * แปลง billingMonth เป็นชื่อเดือนภาษาไทย
 */
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
] as const

export function formatBillingMonthThai(billingMonth: string): string {
  const [year, month] = billingMonth.split("-").map(Number) as [number, number]
  const thaiYear = year + 543
  return `${THAI_MONTHS[month - 1]} ${thaiYear}`
}

/**
 * ดึง billing months ที่ยังไม่ได้ generate payments (ตั้งแต่ startDate จนถึงเดือนปัจจุบัน)
 */
export function getMissingBillingMonths(
  startDate: Date,
  existingMonths: string[],
): string[] {
  const existing = new Set(existingMonths)
  const result: string[] = []
  const now = new Date()
  const current = startOfMonth(now)
  const start = startOfMonth(startDate)

  let cursor = start
  while (!isAfter(cursor, current)) {
    const monthStr = format(cursor, "yyyy-MM")
    if (!existing.has(monthStr)) {
      result.push(monthStr)
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }
  return result
}

/**
 * สรุปสถานะการจ่ายเงินในเดือนนี้
 */
export function getCurrentMonthLabel(): string {
  return format(new Date(), "yyyy-MM")
}

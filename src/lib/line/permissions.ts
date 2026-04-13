/**
 * LINE Permission Helpers
 * ฟังก์ชันช่วยตรวจสอบ permissions สำหรับ LINE features
 */

import { db } from "@/lib/database/db"

export interface LinePermissions {
  canRequestAttendanceReport: boolean
  canRequestLeave: boolean
  canReceiveReminders: boolean
}

/**
 * ดึง permissions ของ LINE user
 * @param lineUserId - LINE user ID
 * @returns permissions ของ user นั้น (ถ้าไม่เจอ return default false ทั้งหมด)
 */
export async function getLinePermissions(lineUserId: string): Promise<LinePermissions> {
  const approval = await db.lineApprovalRequest.findUnique({
    where: { lineUserId },
  })

  if (!approval) {
    return {
      canRequestAttendanceReport: false,
      canRequestLeave: false,
      canReceiveReminders: false,
    }
  }

  // ถ้ายังไม่ได้อนุมัติ ให้ return false ทั้งหมด
  if (approval.status !== "APPROVED") {
    return {
      canRequestAttendanceReport: false,
      canRequestLeave: false,
      canReceiveReminders: false,
    }
  }

  return {
    canRequestAttendanceReport: approval.canRequestAttendanceReport ?? false,
    canRequestLeave: approval.canRequestLeave ?? false,
    canReceiveReminders: approval.canReceiveReminders ?? false,
  }
}

/**
 * เช็คว่า LINE user มีสิทธิ์ขอรายงานเข้างานหรือไม่
 */
export async function canRequestAttendanceReport(lineUserId: string): Promise<boolean> {
  const perms = await getLinePermissions(lineUserId)
  return perms.canRequestAttendanceReport
}

/**
 * เช็คว่า LINE user มีสิทธิ์ขอลาหรือไม่
 */
export async function canRequestLeave(lineUserId: string): Promise<boolean> {
  const perms = await getLinePermissions(lineUserId)
  return perms.canRequestLeave
}

/**
 * เช็คว่า LINE user มีสิทธิ์รับการแจ้งเตือนเช็คอิน/เอาท์หรือไม่
 */
export async function canReceiveReminders(lineUserId: string): Promise<boolean> {
  const perms = await getLinePermissions(lineUserId)
  return perms.canReceiveReminders
}

/**
 * เช็ค permissions หลายอย่างพร้อมกัน
 */
export async function checkLinePermissions(
  lineUserId: string,
  requiredPermissions: (keyof LinePermissions)[],
): Promise<boolean> {
  const perms = await getLinePermissions(lineUserId)
  return requiredPermissions.every((perm) => perms[perm])
}

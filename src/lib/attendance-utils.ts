// Shared utilities for attendance commands
// ✅ ยูทิลิตี้ร่วมสำหรับคำสั่งการทำงาน

import { db } from '@/lib/database'
import { attendanceService } from '@/features/attendance/services/attendance'
import { utils } from '@/lib/validation'

export interface UserAuthResult {
  userAccount: any | null
  userId: string | null
  isExpired: boolean
  needsSignIn: boolean
}

export interface AttendanceStatusResult {
  attendance: any | null
  hasAttendance: boolean
  canCheckIn: boolean
}

/**
 * ตรวจสอบสิทธิ์ผู้ใช้และสถานะการยืนยันตัวตน
 * @param lineUserId LINE User ID
 * @returns ข้อมูลสิทธิ์ผู้ใช้
 */
export const checkUserAuth = async (lineUserId: string): Promise<UserAuthResult> => {
  try {
    const userAccount = await db.account.findFirst({
      where: { providerAccountId: lineUserId }
    })

    if (!userAccount) {
      return {
        userAccount: null,
        userId: null,
        isExpired: true,
        needsSignIn: true
      }
    }

    const isExpired = !userAccount.expires_at || 
      !utils.compareDate(userAccount.expires_at.toString(), new Date().toISOString())

    return {
      userAccount,
      userId: userAccount.userId,
      isExpired,
      needsSignIn: isExpired
    }
  } catch (error) {
    console.error('Error checking user auth:', error)
    return {
      userAccount: null,
      userId: null,
      isExpired: true,
      needsSignIn: true
    }
  }
}

/**
 * ตรวจสอบสถานะการทำงานของผู้ใช้วันนี้
 * @param userId Internal User ID
 * @returns สถานะการทำงาน
 */
export const checkAttendanceStatus = async (userId: string): Promise<AttendanceStatusResult> => {
  try {
    const attendance = await attendanceService.getTodayAttendance(userId)

    return {
      attendance,
      hasAttendance: !!attendance,
      canCheckIn: !attendance // สามารถเช็คอินได้ถ้ายังไม่มีการเช็คอิน
    }
  } catch (error) {
    console.error('Error checking attendance status:', error)
    return {
      attendance: null,
      hasAttendance: false,
      canCheckIn: false
    }
  }
}

/**
 * ตรวจสอบสิทธิ์และสถานะการทำงานพร้อมกัน
 * @param lineUserId LINE User ID
 * @returns ข้อมูลรวมสิทธิ์และสถานะการทำงาน
 */
export const checkUserAuthAndAttendance = async (lineUserId: string) => {
  const authResult = await checkUserAuth(lineUserId)
  
  if (authResult.needsSignIn || !authResult.userId) {
    return {
      auth: authResult,
      attendance: null
    }
  }

  const attendanceResult = await checkAttendanceStatus(authResult.userId)
  
  return {
    auth: authResult,
    attendance: attendanceResult
  }
}

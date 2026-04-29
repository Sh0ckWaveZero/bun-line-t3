/**
 * Server-only service สำหรับจัดการ UserSettings
 * ใช้ร่วมกันระหว่าง Web UI และ LINE Bot
 */

import { db } from "@/lib/database/db"
import type { UserSettingsData, UpdateSettingsPayload } from "../types"
import { DEFAULT_USER_SETTINGS } from "../constants"

/**
 * ดึงการตั้งค่าของผู้ใช้ — สร้างค่า default อัตโนมัติถ้ายังไม่มี
 */
export async function getUserSettings(userId: string): Promise<UserSettingsData> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
  })

  if (!settings) {
    return { ...DEFAULT_USER_SETTINGS }
  }

  return {
    enableCheckInReminders: settings.enableCheckInReminders,
    enableCheckOutReminders: settings.enableCheckOutReminders,
    enableHolidayNotifications: settings.enableHolidayNotifications,
    hideAmountsLinePersonal: settings.hideAmountsLinePersonal,
    hideAmountsLineGroup: settings.hideAmountsLineGroup,
    hideAmountsWeb: settings.hideAmountsWeb,
    timezone: settings.timezone,
    language: settings.language,
  }
}

/**
 * อัปเดตการตั้งค่า — upsert เพื่อสร้างถ้ายังไม่มี
 */
export async function updateUserSettings(
  userId: string,
  payload: UpdateSettingsPayload,
): Promise<UserSettingsData> {
  const updated = await db.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...DEFAULT_USER_SETTINGS,
      ...payload,
    },
    update: payload,
  })

  return {
    enableCheckInReminders: updated.enableCheckInReminders,
    enableCheckOutReminders: updated.enableCheckOutReminders,
    enableHolidayNotifications: updated.enableHolidayNotifications,
    hideAmountsLinePersonal: updated.hideAmountsLinePersonal,
    hideAmountsLineGroup: updated.hideAmountsLineGroup,
    hideAmountsWeb: updated.hideAmountsWeb,
    timezone: updated.timezone,
    language: updated.language,
  }
}

/**
 * ดึงค่าความเป็นส่วนตัวเฉพาะ — สำหรับใช้ใน LINE Bot command handlers
 * @param userId - user ID จาก database (ไม่ใช่ LINE userId)
 * @param isGroup - ข้อความมาจากกลุ่มหรือไม่
 */
export async function shouldHideAmountsForLine(
  userId: string,
  isGroup: boolean,
): Promise<boolean> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: {
      hideAmountsLinePersonal: true,
      hideAmountsLineGroup: true,
    },
  })

  if (!settings) return false

  return isGroup ? settings.hideAmountsLineGroup : settings.hideAmountsLinePersonal
}

/**
 * ค่าเริ่มต้นสำหรับ UserSettings
 */

import type { UserSettingsData } from "../types"

export const DEFAULT_USER_SETTINGS: UserSettingsData = {
  enableCheckInReminders: true,
  enableCheckOutReminders: true,
  enableHolidayNotifications: false,
  hideAmountsLinePersonal: false,
  hideAmountsLineGroup: false,
  hideAmountsWeb: false,
  timezone: "Asia/Bangkok",
  language: "th",
}

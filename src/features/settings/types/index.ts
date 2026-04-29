/**
 * Types สำหรับระบบตั้งค่าผู้ใช้
 */

export interface UserSettingsData {
  // Notification preferences
  enableCheckInReminders: boolean
  enableCheckOutReminders: boolean
  enableHolidayNotifications: boolean
  // Privacy — ซ่อนจำนวนเงิน
  hideAmountsLinePersonal: boolean
  hideAmountsLineGroup: boolean
  hideAmountsWeb: boolean
  // Locale
  timezone: string
  language: string
}

export interface UpdateSettingsPayload {
  enableCheckInReminders?: boolean
  enableCheckOutReminders?: boolean
  enableHolidayNotifications?: boolean
  hideAmountsLinePersonal?: boolean
  hideAmountsLineGroup?: boolean
  hideAmountsWeb?: boolean
  timezone?: string
  language?: string
}

export interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

export interface SettingsToggleProps {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

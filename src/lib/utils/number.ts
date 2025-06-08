/**
 * Number formatting utilities
 * Utility functions สำหรับการจัดรูปแบบตัวเลข
 */

/**
 * Format hours to display format
 * จัดรูปแบบชั่วโมงสำหรับการแสดงผล
 */
export const formatHours = (hours: number): string => {
  if (hours === 0) return '0 ชม.'
  
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  
  if (minutes === 0) {
    return `${wholeHours} ชม.`
  }
  
  return `${wholeHours} ชม. ${minutes} นาที`
}

/**
 * Format percentage to display format
 * จัดรูปแบบเปอร์เซ็นต์สำหรับการแสดงผล
 */
export const formatPercentage = (percentage: number): string => {
  const rounded = Math.round(percentage * 100) / 100
  return `${rounded}%`
}

/**
 * Format number with commas as thousand separators
 * จัดรูปแบบตัวเลขด้วยเครื่องหมายจุลภาคคั่นหลักพัน
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('th-TH')
}

/**
 * Format currency in Thai Baht
 * จัดรูปแบบสกุลเงินบาทไทย
 */
export const formatCurrency = (amount: number): string => {
  return `฿${formatNumber(amount)}`
}

/**
 * Format decimal places
 * จัดรูปแบบทศนิยม
 */
export const formatDecimal = (num: number, places: number = 2): string => {
  return num.toFixed(places)
}

/**
 * Round number to two decimal places
 * ปัดเศษตัวเลขให้เป็นทศนิยม 2 ตำแหน่ง
 */
export const roundToTwoDecimals = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

/**
 * Round number to one decimal place
 * ปัดเศษตัวเลขให้เป็นทศนิยม 1 ตำแหน่ง
 */
export const roundToOneDecimal = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 10) / 10
}

/**
 * Calculate percentage with safe division
 * คำนวณเปอร์เซ็นต์ด้วยการหารที่ปลอดภัย
 */
export const calculatePercentage = (numerator: number, denominator: number): number => {
  if (denominator === 0) return 0
  return (numerator / denominator) * 100
}

/**
 * Calculate average with safe division
 * คำนวณค่าเฉลี่ยด้วยการหารที่ปลอดภัย
 */
export const calculateAverage = (total: number, count: number): number => {
  if (count === 0) return 0
  return total / count
}

/**
 * LINE Approval Type Definitions
 * ประเภทข้อมูลสำหรับระบบอนุมัติ LINE Messaging API
 */

/**
 * ผลลัพธ์การตรวจสอบสถานะอนุมัติ
 * - "APPROVED"  → ผ่านอนุมัติแล้ว ใช้งานได้ปกติ
 * - "PENDING"   → รอการอนุมัติ
 * - "REJECTED"  → ถูกปฏิเสธ
 * - "NEW"       → ยังไม่เคยขอ (เพิ่งสร้าง request ใหม่)
 */
export type ApprovalCheckResult = "APPROVED" | "PENDING" | "REJECTED" | "NEW";

/**
 * Constants สำหรับสถานะการตรวจสอบ
 * ใช้แทน hardcoded strings เพื่อความชัดเจนและป้องกัน typing errors
 */
export const APPROVAL_CHECK_RESULT = {
  APPROVED: "APPROVED" as const,
  PENDING: "PENDING" as const,
  REJECTED: "REJECTED" as const,
  NEW: "NEW" as const,
} as const;

/**
 * Type guard สำหรับตรวจสอบค่า ApprovalCheckResult
 */
export const isValidApprovalCheckResult = (
  value: string,
): value is ApprovalCheckResult => {
  return Object.values(APPROVAL_CHECK_RESULT).includes(value as ApprovalCheckResult);
};

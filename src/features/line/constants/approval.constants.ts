/**
 * LINE Approval Constants
 * Constants สำหรับ ApprovalStatus enum จาก Prisma schema
 *
 * ค่าเหล่านี้ต้องตรงกับ enum ApprovalStatus ใน prisma/schema.prisma:
 * enum ApprovalStatus {
 *   PENDING
 *   APPROVED
 *   REJECTED
 * }
 */

/**
 * Constants สำหรับ ApprovalStatus enum values
 * ใช้ใน repository layer และ database operations
 */
export const APPROVAL_STATUS = {
  PENDING: "PENDING" as const,
  APPROVED: "APPROVED" as const,
  REJECTED: "REJECTED" as const,
} as const;

/**
 * Type สำหรับ ApprovalStatus enum values
 * ใช้สำหรับ type safety เมื่อต้องการ type แทนการใช้ import จาก @prisma/client
 */
export type ApprovalStatusValue =
  (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];

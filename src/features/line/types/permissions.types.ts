/**
 * LINE Permissions Type Definitions
 * ประเภทข้อมูลสำหรับหน้าจัดการสิทธิ์ LINE Features (admin)
 */

export type LineApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

/** สิทธิ์ฟีเจอร์ทั้งหมดที่ PATCH /api/line/permissions รองรับ */
export const PERMISSION_KEYS = [
  "canRequestAttendanceReport",
  "canRequestLeave",
  "canReceiveReminders",
  "canAutoRecordDca",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type PermissionUpdate = Partial<Record<PermissionKey, boolean>>;

export interface LineApproval {
  id: string;
  lineUserId: string;
  displayName: string | null;
  pictureUrl: string | null;
  status: LineApprovalStatus;
  canRequestAttendanceReport: boolean;
  canRequestLeave: boolean;
  canReceiveReminders: boolean;
  canAutoRecordDca: boolean;
  createdAt: string;
  approvedAt: string | null;
}

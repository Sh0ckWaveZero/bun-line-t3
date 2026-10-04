// src/features/attendance/types/leave.ts

/**
 * บันทึกประวัติการลา 1 รายการ
 */
export interface LeaveRecord {
  id: string;
  date: string;
  type: string;
  reason?: string | null;
  createdAt: string;
}

/**
 * Props ของ LeaveForm
 */
export interface LeaveFormProps {
  onSubmit?: () => void;
}

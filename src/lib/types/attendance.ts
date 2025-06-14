// 🔐 Attendance System Types
// Security-First Type Definitions for Attendance Management

import { AttendanceStatusType } from '@/features/attendance/types/attendance-status';

// 👤 Core User Interface
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// 📊 Attendance Record Interface
export interface AttendanceRecord {
  id: string;
  workDate: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: AttendanceStatusType;
  hoursWorked: number | null;
}

// 📈 Monthly Report Interface
export interface MonthlyAttendanceReport {
  userId: string;
  month: string;
  totalDaysWorked: number;
  totalHoursWorked: number;
  attendanceRecords: AttendanceRecord[];
  workingDaysInMonth: number;
  attendanceRate: number;
  complianceRate: number;
  averageHoursPerDay: number;
  completeDays: number;
}

// ✏️ Edit Form Data Interface
export interface EditAttendanceData {
  checkInTime: string;
  checkOutTime: string;
}

// 📋 Props Interfaces for Components
export interface AttendanceTableProps {
  records: AttendanceRecord[];
  onEditRecord: (record: AttendanceRecord) => void;
}

export interface AttendanceSummaryCardsProps {
  report: MonthlyAttendanceReport;
}

export interface AttendanceChartsProps {
  report: MonthlyAttendanceReport;
}

export interface EditAttendanceModalProps {
  isOpen: boolean;
  editingRecord: AttendanceRecord | null;
  editData: EditAttendanceData;
  updateLoading: boolean;
  onClose: () => void;
  onEditDataChange: (data: EditAttendanceData) => void;
  onUpdate: () => Promise<void>;
}

export interface UserInfoCardProps {
  user: User;
}

export interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export interface LoadingSpinnerProps {
  message?: string;
}

export interface ErrorMessageProps {
  message: string;
}

// 🎣 Hook Return Type
export interface UseAttendanceReportReturn {
  // Session
  session: any;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  
  // Report Data
  report: MonthlyAttendanceReport | null;
  loading: boolean;
  error: string | null;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  
  // Edit Modal
  editModalOpen: boolean;
  editingRecord: AttendanceRecord | null;
  editData: EditAttendanceData;
  setEditData: (data: EditAttendanceData) => void;
  updateLoading: boolean;
  
  // Functions
  fetchReport: () => Promise<void>;
  openEditModal: (record: AttendanceRecord) => void;
  closeEditModal: () => void;
  updateAttendance: () => Promise<void>;
}

// Re-export AttendanceStatusType for convenience (as both type and value)
export { AttendanceStatusType } from '@/features/attendance/types/attendance-status';
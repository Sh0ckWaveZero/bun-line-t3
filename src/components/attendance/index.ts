// 🚀 Attendance Report Components | Export Index
// Security-First Component Library for Attendance Reporting

export { EditAttendanceModal } from "./EditAttendanceModal";
export { AttendanceSummaryCards } from "./AttendanceSummaryCards";
export { AttendanceCharts } from "./AttendanceCharts";
export { AttendanceTable } from "./AttendanceTable";
export {
  UserInfoCard,
  LoadingSpinner,
  AuthLoadingScreen,
  LoginPrompt,
  ErrorMessage,
  MonthSelector,
} from "./AttendanceUI";

// Export types for TypeScript (re-export from lib/types)
export type {
  AttendanceRecord,
  MonthlyAttendanceReport,
  EditAttendanceData,
  User,
  AttendanceStatusType,
} from "@/lib/types";

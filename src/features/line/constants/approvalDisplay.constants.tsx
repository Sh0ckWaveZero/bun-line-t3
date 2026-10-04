/**
 * LINE Approval display constants
 * statusConfig / tabConfig (รวม icon) สำหรับหน้า LINE Approval
 */
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle, Clock, Users, XCircle } from "lucide-react";

import type {
  ApprovalTab,
  DisplayApprovalStatus,
} from "@/features/line/helpers/approvalDisplay.helpers";

interface ApprovalStatusConfig {
  label: string;
  color: string;
  icon: ReactNode;
}

export const statusConfig: Record<DisplayApprovalStatus, ApprovalStatusConfig> =
  {
    UNREQUESTED: {
      label: "ยังไม่มีคำขอ",
      color:
        "border border-slate-300 bg-slate-200 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
    PENDING: {
      label: "รอการอนุมัติ",
      color:
        "border border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-300",
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    APPROVED: {
      label: "อนุมัติแล้ว",
      color:
        "border border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
    },
    REJECTED: {
      label: "ปฏิเสธแล้ว",
      color:
        "border border-red-300 bg-red-100 text-red-900 dark:border-red-700/60 dark:bg-red-900/30 dark:text-red-300",
      icon: <XCircle className="h-3.5 w-3.5" />,
    },
  };

interface ApprovalTabConfig {
  label: string;
  icon: ReactNode;
}

export const tabConfig: Record<ApprovalTab, ApprovalTabConfig> = {
  ALL: {
    label: "ทั้งหมด",
    icon: <Users className="h-3.5 w-3.5" />,
  },
  PENDING: {
    label: statusConfig.PENDING.label,
    icon: statusConfig.PENDING.icon,
  },
  APPROVED: {
    label: statusConfig.APPROVED.label,
    icon: statusConfig.APPROVED.icon,
  },
  REJECTED: {
    label: statusConfig.REJECTED.label,
    icon: statusConfig.REJECTED.icon,
  },
};

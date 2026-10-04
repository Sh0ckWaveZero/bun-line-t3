/**
 * ApprovalToast
 * Toast แจ้งเตือนมุมขวาบน (สำเร็จ/ผิดพลาด)
 */
import { AlertCircle, CheckCircle } from "lucide-react";

import type { ApprovalToastState } from "@/features/line/helpers/approvalDisplay.helpers";

interface ApprovalToastProps {
  toast: ApprovalToastState | null;
}

export function ApprovalToast({ toast }: ApprovalToastProps) {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-colors ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
    >
      {toast.type === "success" ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {toast.msg}
    </div>
  );
}

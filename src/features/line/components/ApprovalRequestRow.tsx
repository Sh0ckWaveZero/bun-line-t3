/**
 * ApprovalRequestRow
 * แถวแสดงข้อมูลผู้ใช้ที่ยื่นคำขอ 1 รายการ (โปรไฟล์ + badge + actions)
 */
import { ShieldCheck } from "lucide-react";
import { ApprovalRequestActions } from "@/features/line/components/ApprovalRequestActions";
import { ApprovalStatusBadge } from "@/features/line/components/ApprovalStatusBadge";
import { ApprovalUserAvatar } from "@/features/line/components/ApprovalUserAvatar";
import {
  formatDate,
  type ApprovalRequest,
} from "@/features/line/helpers/approvalDisplay.helpers";

interface ApprovalRequestRowProps {
  req: ApprovalRequest;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onSetAdmin: (req: ApprovalRequest, isAdmin: boolean) => void;
  onUnlock: (req: ApprovalRequest) => void;
  onReject: (req: ApprovalRequest) => void;
}

export function ApprovalRequestRow({
  req,
  actionLoading,
  onApprove,
  onSetAdmin,
  onUnlock,
  onReject,
}: ApprovalRequestRowProps) {
  return (
    <div
      id={`approval-row-${req.id}`}
      className="grid gap-4 p-4 transition-colors hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center dark:hover:bg-white/[0.03]"
    >
      <div className="flex min-w-0 items-start gap-3">
        <ApprovalUserAvatar
          pictureUrl={req.pictureUrl}
          displayName={req.displayName}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-950 dark:text-slate-50">
            {req.displayName ?? "ไม่ระบุชื่อ"}
          </p>
          <p className="truncate font-mono text-xs text-slate-600 dark:text-slate-400">
            {req.lineUserId}
          </p>
          {req.userEmail && (
            <p className="truncate text-xs text-slate-600 dark:text-slate-400">
              {req.userEmail}
            </p>
          )}
          {req.statusMessage && (
            <p className="truncate text-xs text-slate-600 italic dark:text-slate-400">
              &quot;{req.statusMessage}&quot;
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {req.isAdmin && (
              <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-sky-300 bg-sky-100 px-2.5 text-xs leading-none font-medium text-sky-900 dark:border-sky-700/60 dark:bg-sky-900/35 dark:text-sky-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </span>
            )}
            <ApprovalStatusBadge status={req.status} />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {formatDate(req.createdAt)}
            </span>
          </div>
          {req.rejectReason && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              เหตุผล: {req.rejectReason}
            </p>
          )}
        </div>
      </div>

      <ApprovalRequestActions
        req={req}
        actionLoading={actionLoading}
        onApprove={onApprove}
        onSetAdmin={onSetAdmin}
        onUnlock={onUnlock}
        onReject={onReject}
      />
    </div>
  );
}

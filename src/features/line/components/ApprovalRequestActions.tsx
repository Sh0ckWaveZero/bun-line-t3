/**
 * ApprovalRequestActions
 * ปุ่ม actions ของแต่ละรายการคำขอ (ตั้ง/ยกเลิก Admin, อนุมัติ, ปฏิเสธ, ขอใหม่)
 */
import {
  CheckCircle,
  RefreshCw,
  ShieldCheck,
  ShieldPlus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApprovalRequest } from "@/features/line/helpers/approvalDisplay.helpers";

interface ApprovalRequestActionsProps {
  req: ApprovalRequest;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onSetAdmin: (req: ApprovalRequest, isAdmin: boolean) => void;
  onUnlock: (req: ApprovalRequest) => void;
  onReject: (req: ApprovalRequest) => void;
}

export function ApprovalRequestActions({
  req,
  actionLoading,
  onApprove,
  onSetAdmin,
  onUnlock,
  onReject,
}: ApprovalRequestActionsProps) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
      <Button
        size="sm"
        variant={req.isAdmin ? "outline" : "default"}
        className={
          req.isAdmin
            ? "gap-1.5 border-sky-300 text-sky-800 hover:bg-sky-50 dark:border-sky-700/60 dark:text-sky-300 dark:hover:bg-sky-900/20"
            : "gap-1.5 bg-sky-600 text-white hover:bg-sky-700"
        }
        onClick={() => onSetAdmin(req, !req.isAdmin)}
        disabled={actionLoading === `admin:${req.lineUserId}`}
      >
        {req.isAdmin ? (
          <ShieldCheck className="h-4 w-4" />
        ) : (
          <ShieldPlus className="h-4 w-4" />
        )}
        {actionLoading === `admin:${req.lineUserId}`
          ? "กำลังดำเนินการ..."
          : req.isAdmin
            ? "ยกเลิก Admin"
            : "ตั้งเป็น Admin"}
      </Button>
      {req.status === "REJECTED" && req.approvalId ? (
        <Button
          size="sm"
          className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => onUnlock(req)}
          disabled={actionLoading === req.id}
        >
          <RefreshCw className="h-4 w-4" />
          {actionLoading === req.id ? "กำลังดำเนินการ..." : "ขอใหม่"}
        </Button>
      ) : (
        <>
          {req.status === "PENDING" && (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => onApprove(req.id)}
              disabled={actionLoading === req.id}
            >
              <CheckCircle className="h-4 w-4" />
              {actionLoading === req.id ? "กำลังดำเนินการ..." : "อนุมัติ"}
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            onClick={() => onReject(req)}
            disabled={actionLoading === req.id}
          >
            <XCircle className="h-4 w-4" />
            ปฏิเสธ
          </Button>
        </>
      )}
    </div>
  );
}

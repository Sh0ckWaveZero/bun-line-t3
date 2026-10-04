/**
 * ApprovalStatusBadge
 * Badge แสดงสถานะคำขอ LINE Approval (PENDING/APPROVED/REJECTED/UNREQUESTED)
 */
import { statusConfig } from "@/features/line/constants/approvalDisplay.constants";
import type { DisplayApprovalStatus } from "@/features/line/helpers/approvalDisplay.helpers";

interface ApprovalStatusBadgeProps {
  status: DisplayApprovalStatus;
}

export function ApprovalStatusBadge({ status }: ApprovalStatusBadgeProps) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs leading-none font-medium ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

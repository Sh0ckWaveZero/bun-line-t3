import { memo } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PermissionCheckbox } from "./PermissionCheckbox";
import type { LineApproval, PermissionKey } from "../types/permissions.types";

interface PermissionRowProps {
  approval: LineApproval;
  onTogglePermission: (
    lineUserId: string,
    permission: PermissionKey,
    value: boolean,
  ) => void;
}

const PERMISSION_CONTROLS: {
  permission: PermissionKey;
  ariaLabel: (lineUserId: string) => string;
}[] = [
  {
    permission: "canRequestAttendanceReport",
    ariaLabel: (lineUserId) => `อนุญาตให้ ${lineUserId} ขอรายงานเวลาเข้างาน`,
  },
  {
    permission: "canRequestLeave",
    ariaLabel: (lineUserId) => `อนุญาตให้ ${lineUserId} ส่งคำขอลา`,
  },
  {
    permission: "canReceiveReminders",
    ariaLabel: (lineUserId) => `อนุญาตให้ ${lineUserId} รับการแจ้งเตือน`,
  },
  {
    permission: "canAutoRecordDca",
    ariaLabel: (lineUserId) =>
      `อนุญาตให้ ${lineUserId} บันทึก DCA จากข้อความในแชตส่วนตัวอัตโนมัติ`,
  },
];

function getStatusMeta(status: LineApproval["status"]) {
  switch (status) {
    case "APPROVED":
      return {
        label: "อนุมัติแล้ว",
        className:
          "border-emerald-400/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      };
    case "REJECTED":
      return {
        label: "ปฏิเสธ",
        className:
          "border-rose-400/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      };
    default:
      return {
        label: "รออนุมัติ",
        className:
          "border-amber-400/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      };
  }
}

export const PermissionRow = memo(function PermissionRow({
  approval,
  onTogglePermission,
}: PermissionRowProps) {
  const statusMeta = getStatusMeta(approval.status);

  return (
    <tr className="border-t border-slate-200/80 transition-colors hover:bg-slate-50 dark:border-white/[0.07] dark:hover:bg-white/[0.025]">
      <td className="min-w-[260px] px-3 py-4">
        <div className="flex items-center gap-3">
          {approval.pictureUrl && (
            <TooltipProvider delayDuration={80}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <img
                    src={approval.pictureUrl}
                    alt={approval.displayName || approval.lineUserId}
                    className="size-10 shrink-0 cursor-default rounded-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={approval.pictureUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">
                        {approval.displayName || "ไม่ระบุชื่อ"}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] opacity-75">
                        {approval.lineUserId}
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
              {approval.displayName || "ไม่ระบุชื่อ"}
            </p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {approval.lineUserId}
            </p>
          </div>
        </div>
      </td>

      <td className="min-w-[130px] px-3 py-4">
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
            statusMeta.className,
          )}
        >
          {statusMeta.label}
        </span>
      </td>

      {PERMISSION_CONTROLS.map(({ permission, ariaLabel }) => (
        <td key={permission} className="min-w-[120px] px-3 py-4 text-center">
          <PermissionCheckbox
            checked={approval[permission]}
            disabled={approval.status !== "APPROVED"}
            ariaLabel={ariaLabel(approval.lineUserId)}
            onCheckedChange={(value) =>
              onTogglePermission(approval.lineUserId, permission, value)
            }
          />
        </td>
      ))}
    </tr>
  );
});

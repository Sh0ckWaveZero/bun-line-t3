// src/features/attendance/components/LeaveHistoryItem.tsx
"use client";
import { Badge } from "@/components/ui/badge";
import { LEAVE_TYPE_MAP } from "@/features/attendance/constants/leave-form";
import { formatThaiShortDate } from "@/features/attendance/helpers/leave-date";
import type { LeaveRecord } from "@/features/attendance/types/leave";

interface LeaveHistoryItemProps {
  leave: LeaveRecord;
}

/** รายการวันลา 1 แถวในประวัติการลา */
export const LeaveHistoryItem = ({ leave }: LeaveHistoryItemProps) => {
  const lt = LEAVE_TYPE_MAP[leave.type];
  const Icon = lt?.icon;
  return (
    <li
      id={`leave-history-item-${leave.id}`}
      className="bg-card hover:bg-accent/30 flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors"
    >
      <div className="flex items-center gap-3">
        {Icon ? (
          <div
            className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            aria-hidden="true"
          >
            <Icon className="text-muted-foreground h-4 w-4" />
          </div>
        ) : null}
        <div>
          <p className="text-sm font-medium">
            {formatThaiShortDate(leave.date)}
          </p>
          {leave.reason ? (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {leave.reason}
            </p>
          ) : null}
        </div>
      </div>

      <Badge variant="outline" className="shrink-0 text-xs">
        {lt?.label ?? leave.type}
      </Badge>
    </li>
  );
};

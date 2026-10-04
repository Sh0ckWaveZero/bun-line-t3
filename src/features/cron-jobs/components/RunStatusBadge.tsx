import { cn } from "@/lib/utils";
import { RUN_STATUS_META } from "@/features/cron-jobs/constants/run-status";
import type { RunStatus } from "@/features/cron-jobs/types";

interface RunStatusBadgeProps {
  status: RunStatus;
}

export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  const meta = RUN_STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        meta.badgeClass,
      )}
    >
      {meta.label}
    </span>
  );
}

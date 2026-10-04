import { cn } from "@/lib/utils";
import { getSparkHeight } from "@/features/cron-jobs/helpers";
import type { RunStatus } from "@/features/cron-jobs/types";

interface SuccessRateChartProps {
  history: RunStatus[];
}

export function SuccessRateChart({ history }: SuccessRateChartProps) {
  const recentHistory = history.slice(-24);

  if (recentHistory.length === 0) {
    return (
      <p className="mt-5 text-xs text-slate-500">
        ยังไม่ได้เปิด execution history ของ cron worker
      </p>
    );
  }

  return (
    <div className="mt-4">
      <div className="relative h-12 overflow-hidden">
        <div className="absolute top-2 right-0 left-0 border-t border-dashed border-emerald-400/60" />
        <span className="absolute top-0 left-0 text-[10px] text-slate-500">
          SLO 99.5%
        </span>
        <div className="absolute inset-x-0 bottom-0 flex h-8 items-end gap-1">
          {recentHistory.map((status, index) => (
            <span
              key={`${status}-${index}`}
              className={cn(
                "w-full min-w-0 rounded-t-sm",
                status === "failed"
                  ? "bg-rose-400/90"
                  : status === "timed-out"
                    ? "bg-amber-400/90"
                    : "bg-emerald-500/75 dark:bg-emerald-400/70",
              )}
              style={{ height: `${getSparkHeight(status, index)}%` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          รอบสำเร็จ
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-400" />
          รอบมีปัญหา
        </span>
      </div>
    </div>
  );
}

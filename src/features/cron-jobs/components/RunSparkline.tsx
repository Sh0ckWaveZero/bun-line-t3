import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RUN_STATUS_META } from "@/features/cron-jobs/constants/run-status";
import { getSparkHeight } from "@/features/cron-jobs/helpers";
import type { CronJobRunDetail, RunStatus } from "@/features/cron-jobs/types";

interface RunSparklineProps {
  history: RunStatus[];
  details: CronJobRunDetail[];
}

export function RunSparkline({ history, details }: RunSparklineProps) {
  return (
    <TooltipProvider delayDuration={180} disableHoverableContent>
      <div
        className="flex h-8 items-end gap-0.5"
        role="group"
        aria-label={`ผลการทำงานย้อนหลัง ${history.length} รอบ`}
      >
        {history.length > 0 ? (
          history.map((status, index) => {
            const detail = details[index];
            const resolvedStatus = detail?.status ?? status;
            const meta = RUN_STATUS_META[resolvedStatus];
            const runLabel = detail
              ? `${meta.label} · ${detail.relative} · ${detail.duration}${detail.httpStatus ? ` · HTTP ${detail.httpStatus}` : ""}`
              : `${meta.label} · รอบที่ ${index + 1}`;

            return (
              <Tooltip
                key={
                  detail?.id ??
                  `${resolvedStatus}-${detail?.relative ?? "unknown"}`
                }
              >
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    role="img"
                    aria-label={runLabel}
                    className={cn(
                      "w-1.5 rounded-t-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#151719]",
                      meta.barClass,
                    )}
                    style={{
                      height: `${getSparkHeight(resolvedStatus, index)}%`,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="center"
                  className="max-w-[280px] border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white dark:bg-slate-800"
                >
                  <p className="font-semibold">{meta.label}</p>
                  <p className="mt-0.5 text-slate-300">
                    {detail
                      ? `${detail.relative} · ${detail.duration}${detail.httpStatus ? ` · HTTP ${detail.httpStatus}` : ""}`
                      : `รอบที่ ${index + 1}`}
                  </p>
                  {detail?.message && (
                    <p
                      className={cn(
                        "mt-1 break-words",
                        resolvedStatus === "failed" ||
                          resolvedStatus === "timed-out"
                          ? "text-rose-200"
                          : "text-slate-300",
                      )}
                    >
                      {detail.message}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })
        ) : (
          <span className="text-[11px] text-slate-400">ยังไม่มีข้อมูล</span>
        )}
      </div>
    </TooltipProvider>
  );
}

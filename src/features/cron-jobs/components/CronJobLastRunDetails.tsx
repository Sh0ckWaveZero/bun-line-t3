import { cn } from "@/lib/utils";
import type { CronJob } from "@/features/cron-jobs/types";
import { RunStatusBadge } from "@/features/cron-jobs/components/RunStatusBadge";

interface CronJobLastRunDetailsProps {
  lastRun: CronJob["lastRun"];
}

export function CronJobLastRunDetails({ lastRun }: CronJobLastRunDetailsProps) {
  const isFailure =
    lastRun.status === "failed" || lastRun.status === "timed-out";

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        isFailure
          ? "border-rose-400/25 bg-rose-500/10"
          : "border-slate-200 bg-slate-50 dark:border-white/[0.1] dark:bg-white/[0.04]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          ผลการรันล่าสุด
        </p>
        <RunStatusBadge status={lastRun.status} />
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        {lastRun.relative} · {lastRun.duration}
        {lastRun.httpStatus ? ` · HTTP ${lastRun.httpStatus}` : ""}
      </p>
      {lastRun.message && (
        <p
          className={cn(
            "mt-2 text-xs leading-5",
            isFailure
              ? "text-rose-800 dark:text-rose-200"
              : "text-slate-600 dark:text-slate-300",
          )}
        >
          {isFailure ? "สาเหตุ: " : "รายละเอียด: "}
          {lastRun.message}
        </p>
      )}
      {isFailure && !lastRun.message && (
        <p className="mt-2 text-xs text-rose-800 dark:text-rose-200">
          ไม่พบรายละเอียดสาเหตุจาก endpoint
        </p>
      )}
    </div>
  );
}

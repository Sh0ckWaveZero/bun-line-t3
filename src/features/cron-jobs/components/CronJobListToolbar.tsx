import { SlidersHorizontal } from "lucide-react";
import type { DisplayMode } from "@/features/cron-jobs/types";

interface CronJobListToolbarProps {
  jobsCount: number;
  failingJobs: number;
  displayMode: DisplayMode;
  onToggleDisplayMode: () => void;
}

export function CronJobListToolbar({
  jobsCount,
  failingJobs,
  displayMode,
  onToggleDisplayMode,
}: CronJobListToolbarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-white/[0.08]">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          งานทั้งหมด
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {jobsCount} งาน · {failingJobs} ล้มเหลว
        </p>
      </div>
      <button
        type="button"
        aria-pressed={displayMode === "compact"}
        onClick={onToggleDisplayMode}
        aria-label={`แสดงผล: ${displayMode === "compact" ? "โหมดกระชับ" : "โหมดสบาย"}`}
        className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none sm:self-auto dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08]"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        แสดงผล
      </button>
    </div>
  );
}

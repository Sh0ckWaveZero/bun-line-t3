import { cn } from "@/lib/utils";
import type { CronJobStatusCounts } from "@/features/cron-jobs/helpers";
import type { JobFilter } from "@/features/cron-jobs/types";

interface CronJobStatusTabsProps {
  statusCounts: CronJobStatusCounts;
  activeFilter: JobFilter;
  onSelectFilter: (filter: JobFilter) => void;
}

const STATUS_TABS = [
  ["all", "ทั้งหมด"],
  ["healthy", "ปกติ"],
  ["failing", "ล้มเหลว"],
  ["paused", "หยุดชั่วคราว"],
] as const;

export function CronJobStatusTabs({
  statusCounts,
  activeFilter,
  onSelectFilter,
}: CronJobStatusTabsProps) {
  return (
    <div
      className="flex gap-6 overflow-x-auto border-b border-slate-200 px-5 sm:px-6 dark:border-white/[0.08]"
      role="group"
      aria-label="กรองตามสถานะ"
    >
      {STATUS_TABS.map(([filter, label]) => {
        const count = statusCounts[filter];
        const isActive = activeFilter === filter;

        return (
          <button
            key={filter}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectFilter(filter)}
            className={cn(
              "relative flex shrink-0 cursor-pointer items-center gap-2 py-3.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none",
              isActive
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            {label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                isActive
                  ? "bg-slate-100 text-slate-700 dark:bg-white/[0.1] dark:text-slate-200"
                  : "bg-slate-100/70 text-slate-500 dark:bg-white/[0.06]",
              )}
            >
              {count}
            </span>
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-slate-900 dark:bg-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}

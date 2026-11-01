import { cn } from "@/lib/utils";
import { PERMISSION_TABS } from "@/features/line/line-utils/permissions";
import type {
  FilterStatus,
  PermissionStatusCounts,
} from "@/features/line/line-utils/permissions";

export function PermissionFilterTabs({
  filterStatus,
  statusCounts,
  onFilterChange,
}: {
  filterStatus: FilterStatus;
  statusCounts: PermissionStatusCounts;
  onFilterChange: (status: FilterStatus) => void;
}) {
  return (
    <div
      className="flex gap-6 overflow-x-auto border-b border-slate-200 px-5 sm:px-6 dark:border-white/[0.08]"
      role="group"
      aria-label="กรองตามสถานะ"
    >
      {PERMISSION_TABS.map(([value, label]) => {
        const isActive = filterStatus === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onFilterChange(value)}
            className={cn(
              "relative flex shrink-0 cursor-pointer items-center gap-2 py-3.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none",
              isActive
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            {label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                isActive
                  ? "bg-slate-100 text-slate-700 dark:bg-white/[0.1] dark:text-slate-200"
                  : "bg-slate-100/70 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400",
              )}
            >
              {statusCounts[value]}
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

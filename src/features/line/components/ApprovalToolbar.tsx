import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { APPROVAL_TABS } from "@/features/line/line-utils/approvals";
import type { ApprovalTab } from "@/features/line/line-utils/approvals";

export function ApprovalToolbar({
  activeTab,
  counts,
  onTabChange,
  searchQuery,
  onSearchChange,
}: {
  activeTab: ApprovalTab;
  counts: Record<ApprovalTab, number>;
  onTabChange: (tab: ApprovalTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  return (
    <>
      <div
        className="flex gap-6 overflow-x-auto border-b border-slate-200 px-5 sm:px-6 dark:border-white/[0.08]"
        role="group"
        aria-label="กรองตามสถานะ"
      >
        {APPROVAL_TABS.map(([value, label]) => {
          const isActive = activeTab === value;

          return (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onTabChange(value)}
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
                {counts[value]}
              </span>
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-slate-900 dark:bg-white" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-white/[0.08]">
        <div className="relative w-full sm:max-w-[340px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <label htmlFor="approval-search" className="sr-only">
            ค้นหาผู้ใช้
          </label>
          <input
            id="approval-search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="ค้นหาชื่อ อีเมล หรือ LINE User ID…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-600"
          />
        </div>
      </div>
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ListFilter, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TARGET_FILTER_OPTIONS } from "@/features/cron-jobs/constants/targets";
import type { TargetKind } from "@/features/cron-jobs/types";

interface CronJobFiltersBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  targetFilter: "all" | TargetKind;
  onTargetFilterChange: (value: "all" | TargetKind) => void;
  onResetFilters: () => void;
}

export function CronJobFiltersBar({
  query,
  onQueryChange,
  targetFilter,
  onTargetFilterChange,
  onResetFilters,
}: CronJobFiltersBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterTargetRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!filterOpen) return;

    requestAnimationFrame(() => filterTargetRef.current?.focus());
  }, [filterOpen]);

  const handleCloseFilter = () => {
    setFilterOpen(false);
    requestAnimationFrame(() => filterButtonRef.current?.focus());
  };

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-white/[0.08]">
      <div className="relative w-full sm:max-w-[340px]">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <label htmlFor="job-search" className="sr-only">
          ค้นหางาน
        </label>
        <input
          id="job-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="ค้นหาชื่องานหรือคำสั่ง…"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-600"
        />
      </div>
      <div className="relative flex items-center gap-2 self-end sm:self-auto">
        {filterOpen && (
          <dialog
            open
            id="cron-filter-panel"
            aria-labelledby="cron-filter-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                handleCloseFilter();
              }
            }}
            className="absolute top-11 right-0 z-20 m-0 w-64 max-w-none rounded-xl border border-slate-200 bg-white p-4 text-inherit shadow-xl dark:border-white/[0.1] dark:bg-[#1b1e22]"
          >
            <div className="flex items-center justify-between">
              <p
                id="cron-filter-title"
                className="text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                ตัวกรองเพิ่มเติม
              </p>
              <button
                type="button"
                onClick={handleCloseFilter}
                aria-label="ปิดตัวกรอง"
                className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:hover:bg-white/[0.08]"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <label
              htmlFor="target-filter"
              className="mt-4 block text-xs font-medium text-slate-500"
            >
              เป้าหมาย
            </label>
            <div className="relative mt-1.5">
              <select
                id="target-filter"
                ref={filterTargetRef}
                value={targetFilter}
                onChange={(event) =>
                  onTargetFilterChange(event.target.value as "all" | TargetKind)
                }
                className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pr-8 text-sm text-slate-700 outline-none focus:border-emerald-500 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-200"
              >
                {TARGET_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
            </div>
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-3 cursor-pointer rounded-sm text-xs font-medium text-emerald-600 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </dialog>
        )}
        <button
          type="button"
          aria-expanded={filterOpen}
          aria-haspopup="dialog"
          aria-controls="cron-filter-panel"
          ref={filterButtonRef}
          onClick={() => setFilterOpen((open) => !open)}
          className={cn(
            "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none",
            filterOpen || targetFilter !== "all"
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08]",
          )}
        >
          <ListFilter className="size-4" aria-hidden="true" />
          ตัวกรอง
          {targetFilter !== "all" && (
            <span className="size-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>
    </div>
  );
}

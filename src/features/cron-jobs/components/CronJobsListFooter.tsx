import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

interface CronJobsListFooterProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  firstVisibleRow: number;
  lastVisibleRow: number;
  totalCount: number;
  currentPage: number;
  pageCount: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onSelectPage: (pageNumber: number) => void;
}

export function CronJobsListFooter({
  pageSize,
  onPageSizeChange,
  firstVisibleRow,
  lastVisibleRow,
  totalCount,
  currentPage,
  pageCount,
  onPreviousPage,
  onNextPage,
  onSelectPage,
}: CronJobsListFooterProps) {
  return (
    <footer className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-white/[0.08]">
      <label className="flex items-center gap-2">
        แถวต่อหน้า
        <span className="relative">
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-2.5 pr-7 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-200"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </span>
      </label>
      <div className="flex items-center gap-3">
        <span>
          {firstVisibleRow}–{lastVisibleRow} จาก {totalCount} งาน
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={onPreviousPage}
            aria-label="ไปหน้าก่อนหน้า"
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white/[0.08]"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1)
            .slice(0, 5)
            .map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                aria-current={currentPage === pageNumber ? "page" : undefined}
                onClick={() => onSelectPage(pageNumber)}
                className={cn(
                  "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none",
                  currentPage === pageNumber
                    ? "bg-slate-200 text-slate-900 dark:bg-white/[0.12] dark:text-white"
                    : "hover:bg-slate-100 dark:hover:bg-white/[0.08]",
                )}
              >
                {pageNumber}
              </button>
            ))}
          <button
            type="button"
            disabled={currentPage === pageCount}
            onClick={onNextPage}
            aria-label="ไปหน้าถัดไป"
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white/[0.08]"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TablePageSizeSelectProps {
  value: number;
  options: readonly number[];
  onChange: (value: number) => void;
}

/** เลือกจำนวนแถวต่อหน้าของตาราง admin — ใช้ร่วมกับ TablePagination */
export const TablePageSizeSelect = ({
  value,
  options,
  onChange,
}: TablePageSizeSelectProps) => (
  <label className="flex items-center gap-2">
    แถวต่อหน้า
    <span className="relative">
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-8 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-2.5 pr-7 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-200"
      >
        {options.map((option) => (
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
);

interface TablePaginationProps {
  firstVisibleRow: number;
  lastVisibleRow: number;
  total: number;
  /** คำบอกชนิดข้อมูล เช่น "งาน" / "คน" */
  unit: string;
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

/** แถบ pagination ของตาราง admin — ใช้ร่วมกันทุกหน้า (cron-jobs, line-approval, line-permissions) */
export const TablePagination = ({
  firstVisibleRow,
  lastVisibleRow,
  total,
  unit,
  currentPage,
  pageCount,
  onPageChange,
}: TablePaginationProps) => (
  <div className="flex items-center gap-3">
    <span>
      {firstVisibleRow}–{lastVisibleRow} จาก {total} {unit}
    </span>
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
            onClick={() => onPageChange(pageNumber)}
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
        onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
        aria-label="ไปหน้าถัดไป"
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white/[0.08]"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  </div>
);

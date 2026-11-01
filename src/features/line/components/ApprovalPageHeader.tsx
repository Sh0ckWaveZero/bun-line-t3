import { Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalTab } from "@/features/line/line-utils/approvals";

export function ApprovalPageHeader({
  counts,
  isFetchingList,
  onRefresh,
}: {
  counts: Record<ApprovalTab, number>;
  isFetchingList: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] leading-none font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
            LINE Approval
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <Clock className="size-3.5" aria-hidden="true" />
            {counts.PENDING} รออนุมัติ
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          จัดการคำขอใช้งาน LINE Messaging API · {counts.all} บัญชี LINE
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        aria-label="รีเฟรชรายการคำขออนุมัติ"
        className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-white/[0.1] dark:bg-[#151719] dark:text-slate-200 dark:hover:bg-white/[0.06]"
      >
        <RefreshCw
          className={cn(
            "size-4 motion-reduce:animate-none",
            isFetchingList && "animate-spin",
          )}
          aria-hidden="true"
        />
        รีเฟรช
      </button>
    </header>
  );
}

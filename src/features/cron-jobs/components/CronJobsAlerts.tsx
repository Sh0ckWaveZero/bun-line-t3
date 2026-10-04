import { AlertTriangle, Check, LoaderCircle, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CronJobDataSource, CronJobNotice } from "@/features/cron-jobs/types";

interface CronJobsAlertsProps {
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  source: CronJobDataSource | null;
  notice: CronJobNotice | null;
  onRefresh: () => void;
  onDismissNotice: () => void;
}

export function CronJobsAlerts({
  isLoading,
  error,
  isRefreshing,
  source,
  notice,
  onRefresh,
  onDismissNotice,
}: CronJobsAlertsProps) {
  return (
    <>
      {isLoading && (
        <div
          className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-white/[0.08] dark:bg-[#151719] dark:text-slate-300"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle
            className="size-4 animate-spin text-emerald-500"
            aria-hidden="true"
          />
          กำลังอ่านสถานะจากระบบ Cron จริง…
        </div>
      )}
      {error && (
        <div
          className="mt-5 flex flex-col gap-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between dark:text-rose-200"
          role="alert"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-lg border border-rose-400/30 px-3 text-xs font-semibold transition-colors hover:bg-rose-500/10 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={cn("size-3.5", isRefreshing && "animate-spin")}
              aria-hidden="true"
            />
            ลองใหม่
          </button>
        </div>
      )}
      {source && !source.readOnly && !error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          <Check className="size-4 shrink-0" aria-hidden="true" />
          ตารางเวลาและ execution history อ่านจาก PostgreSQL; container cron
          ทำหน้าที่ปลุก dispatcher ทุกนาที
        </div>
      )}
      {notice && (
        <div
          className={cn(
            "mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm",
            notice.type === "success"
              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : "border-rose-400/25 bg-rose-500/10 text-rose-800 dark:text-rose-200",
          )}
          role={notice.type === "error" ? "alert" : "status"}
          aria-live={notice.type === "error" ? "assertive" : "polite"}
        >
          {notice.type === "success" ? (
            <Check className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          )}
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={onDismissNotice}
            aria-label="ปิดข้อความแจ้งเตือน"
            className="ml-auto flex min-h-6 min-w-6 cursor-pointer items-center justify-center rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:hover:bg-white/[0.08]"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}

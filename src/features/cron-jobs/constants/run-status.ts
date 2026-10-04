import type { RunStatus } from "@/features/cron-jobs/types";

export const RUN_STATUS_META: Record<
  RunStatus,
  { label: string; badgeClass: string; textClass: string; barClass: string }
> = {
  succeeded: {
    label: "สำเร็จ",
    badgeClass:
      "border-emerald-400/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    textClass: "text-emerald-700 dark:text-emerald-300",
    barClass: "bg-emerald-500/70 dark:bg-emerald-400/60",
  },
  failed: {
    label: "ล้มเหลว",
    badgeClass:
      "border-rose-400/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    textClass: "text-rose-700 dark:text-rose-300",
    barClass: "bg-rose-500/80 dark:bg-rose-400/80",
  },
  "timed-out": {
    label: "หมดเวลา",
    badgeClass:
      "border-amber-400/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    textClass: "text-amber-700 dark:text-amber-300",
    barClass: "bg-amber-500/80 dark:bg-amber-400/80",
  },
  skipped: {
    label: "ข้าม",
    badgeClass:
      "border-slate-400/20 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    textClass: "text-slate-600 dark:text-slate-300",
    barClass: "bg-slate-400/70 dark:bg-slate-500/70",
  },
  pending: {
    label: "กำลังทำงาน",
    badgeClass:
      "border-sky-400/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    textClass: "text-sky-700 dark:text-sky-300",
    barClass: "bg-sky-400/70 dark:bg-sky-300/60",
  },
  unknown: {
    label: "ยังไม่มีข้อมูล",
    badgeClass:
      "border-slate-400/20 bg-slate-500/10 text-slate-500 dark:text-slate-400",
    textClass: "text-slate-500 dark:text-slate-400",
    barClass: "bg-slate-300/50 dark:bg-slate-600/50",
  },
};

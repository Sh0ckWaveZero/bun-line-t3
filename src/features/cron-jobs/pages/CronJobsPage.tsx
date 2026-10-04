"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  Database,
  ListFilter,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  ServerCog,
  SlidersHorizontal,
  Timer,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/common/ToastProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCronJobStatus, getCronJobStatusCounts } from "../helpers";
import { useCronJobs, type CronJobMutationInput } from "../hooks/useCronJobs";
import type {
  CronJob,
  CronJobRunDetail,
  JobEnvironment,
  RunStatus,
  TargetKind,
} from "../types";

type JobFilter = "all" | "healthy" | "failing" | "paused";
type EnvironmentFilter = "all" | JobEnvironment;
type DisplayMode = "comfortable" | "compact";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const TARGET_FILTER_OPTIONS: Array<{
  value: "all" | TargetKind;
  label: string;
}> = [
  { value: "all", label: "ทุกเป้าหมาย" },
  { value: "attendance", label: "Attendance" },
  { value: "webhook", label: "Webhook" },
  { value: "database", label: "ฐานข้อมูล" },
  { value: "search", label: "Search" },
  { value: "notifications", label: "Notifications" },
  { value: "payments", label: "Payments" },
  { value: "reports", label: "Reports" },
  { value: "storage", label: "Storage" },
  { value: "security", label: "Security" },
];

const RUN_STATUS_META: Record<
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

const TARGET_ICONS: Record<TargetKind, LucideIcon> = {
  attendance: CalendarClock,
  webhook: Activity,
  database: Database,
  search: Search,
  notifications: Bell,
  payments: Timer,
  fraud: CircleAlert,
  reports: CalendarClock,
  storage: ServerCog,
  sync: Activity,
  security: CircleCheck,
};

const BAR_HEIGHTS = [
  42, 58, 70, 48, 64, 52, 76, 46, 61, 55, 72, 48, 67, 57, 75, 51, 64, 43, 69,
  58,
];

function getSparkHeight(status: RunStatus, index: number): number {
  const base = BAR_HEIGHTS[index % BAR_HEIGHTS.length] ?? 55;

  if (status === "failed") return Math.max(42, base - 8);
  if (status === "timed-out") return Math.min(96, base + 18);
  return base;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <article className="border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(16,24,40,0.04)] dark:border-white/[0.08] dark:bg-[#151719] dark:shadow-none">
      <div className="flex items-start gap-3 p-5 pb-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-slate-200">
          <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {label}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
            {detail}
          </p>
        </div>
      </div>
      <div className="px-5 pb-4">
        <p className="text-[27px] leading-tight font-semibold tracking-[-0.04em] text-slate-900 tabular-nums dark:text-white">
          {value}
        </p>
        {children}
      </div>
    </article>
  );
}

function StatusSegments({
  healthy,
  failing,
  paused,
}: {
  healthy: number;
  failing: number;
  paused: number;
}) {
  const segments = [
    ...Array.from({ length: healthy }, () => "healthy" as const),
    ...Array.from({ length: failing }, () => "failing" as const),
    ...Array.from({ length: paused }, () => "paused" as const),
  ];

  return (
    <div className="mt-5 flex h-5 items-end gap-1" aria-hidden="true">
      {segments.map((status, index) => (
        <span
          key={`${status}-${index}`}
          className={cn(
            "w-1 rounded-full",
            status === "healthy" &&
              "h-5 bg-emerald-500/80 dark:bg-emerald-400/80",
            status === "failing" && "h-5 bg-rose-500/80 dark:bg-rose-400/80",
            status === "paused" && "h-4 bg-violet-500/80 dark:bg-violet-400/80",
          )}
        />
      ))}
    </div>
  );
}

function SuccessRateChart({ history }: { history: RunStatus[] }) {
  const recentHistory = history.slice(-24);

  if (recentHistory.length === 0) {
    return (
      <p className="mt-5 text-xs text-slate-500">
        ยังไม่ได้เปิด execution history ของ cron worker
      </p>
    );
  }

  return (
    <div className="mt-4">
      <div className="relative h-12 overflow-hidden">
        <div className="absolute top-2 right-0 left-0 border-t border-dashed border-emerald-400/60" />
        <span className="absolute top-0 left-0 text-[10px] text-slate-500">
          SLO 99.5%
        </span>
        <div className="absolute inset-x-0 bottom-0 flex h-8 items-end gap-1">
          {recentHistory.map((status, index) => (
            <span
              key={`${status}-${index}`}
              className={cn(
                "w-full min-w-0 rounded-t-sm",
                status === "failed"
                  ? "bg-rose-400/90"
                  : status === "timed-out"
                    ? "bg-amber-400/90"
                    : "bg-emerald-500/75 dark:bg-emerald-400/70",
              )}
              style={{ height: `${getSparkHeight(status, index)}%` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          รอบสำเร็จ
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-400" />
          รอบมีปัญหา
        </span>
      </div>
    </div>
  );
}

function FailedRunsChart({
  failed,
  timedOut,
}: {
  failed: number;
  timedOut: number;
}) {
  const total = failed + timedOut;
  const failedWidth = total === 0 ? 0 : (failed / total) * 100;
  const timedOutWidth = total === 0 ? 0 : (timedOut / total) * 100;

  return (
    <div className="mt-5">
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
        <span
          className="bg-rose-400 dark:bg-rose-400/90"
          style={{ width: `${failedWidth}%` }}
        />
        <span
          className="bg-amber-400 dark:bg-amber-400/90"
          style={{ width: `${timedOutWidth}%` }}
        />
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-rose-400" />
          {failed} ล้มเหลว
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-400" />
          {timedOut} หมดเวลา
        </span>
      </div>
    </div>
  );
}

function NextRunPreview({ jobs }: { jobs: CronJob[] }) {
  const nextJob = jobs
    .filter((job) => job.enabled && job.nextRun.iso)
    .sort(
      (left, right) =>
        new Date(left.nextRun.iso ?? 0).getTime() -
        new Date(right.nextRun.iso ?? 0).getTime(),
    )[0];
  const nextFailingJob = jobs.find(
    (job) => getCronJobStatus(job) === "failing",
  );
  const jobToShow = nextJob ?? nextFailingJob;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          รอบถัดไปที่กำลังจะทำงาน
        </span>
        <span className="text-sm font-semibold text-slate-800 tabular-nums dark:text-slate-100">
          {nextJob?.nextRun.relative ?? "—"}
        </span>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
        <span className="w-1/2 bg-slate-400/60 dark:bg-slate-500/70" />
        <span className="w-1/2 bg-slate-200 dark:bg-white/[0.12]" />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <Activity className="size-3.5 text-slate-500" aria-hidden="true" />
        <span className="truncate text-slate-700 dark:text-slate-300">
          {jobToShow?.name ?? "ยังไม่มีงานที่พร้อมทำงาน"}
        </span>
        <span className="shrink-0 rounded-md border border-slate-400/20 bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
          {nextFailingJob ? "มีงานล้มเหลว" : "กำลังจะทำงาน"}
        </span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
        <CalendarClock className="size-3.5" aria-hidden="true" />
        {jobToShow?.nextRun.at ?? "รอข้อมูลจาก scheduler"}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: RunStatus }) {
  const meta = RUN_STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        meta.badgeClass,
      )}
    >
      {meta.label}
    </span>
  );
}

function RunSparkline({
  history,
  details,
}: {
  history: RunStatus[];
  details: CronJobRunDetail[];
}) {
  return (
    <TooltipProvider delayDuration={180} disableHoverableContent>
      <div
        className="flex h-8 items-end gap-0.5"
        role="group"
        aria-label={`ผลการทำงานย้อนหลัง ${history.length} รอบ`}
      >
        {history.length > 0 ? (
          history.map((status, index) => {
            const detail = details[index];
            const resolvedStatus = detail?.status ?? status;
            const meta = RUN_STATUS_META[resolvedStatus];
            const runLabel = detail
              ? `${meta.label} · ${detail.relative} · ${detail.duration}${detail.httpStatus ? ` · HTTP ${detail.httpStatus}` : ""}`
              : `${meta.label} · รอบที่ ${index + 1}`;

            return (
              <Tooltip
                key={
                  detail?.id ??
                  `${resolvedStatus}-${detail?.relative ?? "unknown"}`
                }
              >
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    role="img"
                    aria-label={runLabel}
                    className={cn(
                      "w-1.5 rounded-t-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#151719]",
                      meta.barClass,
                    )}
                    style={{
                      height: `${getSparkHeight(resolvedStatus, index)}%`,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="center"
                  className="max-w-[280px] border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white dark:bg-slate-800"
                >
                  <p className="font-semibold">{meta.label}</p>
                  <p className="mt-0.5 text-slate-300">
                    {detail
                      ? `${detail.relative} · ${detail.duration}${detail.httpStatus ? ` · HTTP ${detail.httpStatus}` : ""}`
                      : `รอบที่ ${index + 1}`}
                  </p>
                  {detail?.message && (
                    <p
                      className={cn(
                        "mt-1 break-words",
                        resolvedStatus === "failed" ||
                          resolvedStatus === "timed-out"
                          ? "text-rose-200"
                          : "text-slate-300",
                      )}
                    >
                      {detail.message}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })
        ) : (
          <span className="text-[11px] text-slate-400">ยังไม่มีข้อมูล</span>
        )}
      </div>
    </TooltipProvider>
  );
}

function JobToggle({
  enabled,
  disabled,
  onChange,
}: {
  enabled: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "หยุด Cron Job" : "เปิดใช้งาน Cron Job"}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        enabled
          ? "border-emerald-600 bg-emerald-600"
          : "border-slate-300 bg-slate-200 dark:border-white/[0.15] dark:bg-white/[0.1]",
      )}
    >
      <span
        className={cn(
          "size-4 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}

function JobRow({
  job,
  compact,
  onToggle,
  onMenu,
  toggleDisabled,
}: {
  job: CronJob;
  compact: boolean;
  onToggle: (job: CronJob) => void;
  onMenu: (job: CronJob) => void;
  toggleDisabled: boolean;
}) {
  const targetIcon = TARGET_ICONS[job.target.kind];
  const TargetIcon = targetIcon ?? ServerCog;

  return (
    <tr className="group border-t border-slate-200/80 transition-colors hover:bg-slate-50 dark:border-white/[0.07] dark:hover:bg-white/[0.025]">
      <td className={cn("min-w-[280px] px-3", compact ? "py-2.5" : "py-4")}>
        <div className="max-w-[300px]">
          <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
            {job.name}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
            {job.command}
          </p>
        </div>
      </td>
      <td className={cn("min-w-[165px] px-3", compact ? "py-2.5" : "py-4")}>
        <p className="text-[13px] text-slate-700 dark:text-slate-200">
          {job.scheduleLabel}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-slate-500">
          {job.cronExpression}
        </p>
      </td>
      <td className={cn("w-24 px-3 text-center", compact ? "py-2.5" : "py-4")}>
        <JobToggle
          enabled={job.enabled}
          disabled={toggleDisabled}
          onChange={() => onToggle(job)}
        />
      </td>
      <td className={cn("min-w-[150px] px-3", compact ? "py-2.5" : "py-4")}>
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={job.lastRun.status} />
          <span className="text-[11px] text-slate-500">
            {job.lastRun.relative} · {job.lastRun.duration}
          </span>
          {(job.lastRun.status === "failed" ||
            job.lastRun.status === "timed-out") && (
            <span
              className="max-w-[145px] truncate text-[10px] text-rose-700 dark:text-rose-300"
              title={job.lastRun.message ?? "ไม่พบรายละเอียดสาเหตุ"}
            >
              สาเหตุ: {job.lastRun.message ?? "ไม่พบรายละเอียดสาเหตุ"}
            </span>
          )}
        </div>
      </td>
      <td className={cn("min-w-[150px] px-3", compact ? "py-2.5" : "py-4")}>
        <RunSparkline history={job.runHistory} details={job.runDetails} />
      </td>
      <td className={cn("min-w-[130px] px-3", compact ? "py-2.5" : "py-4")}>
        <p className="text-[13px] text-slate-800 tabular-nums dark:text-slate-100">
          {job.nextRun.relative}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">{job.nextRun.at}</p>
      </td>
      <td className={cn("min-w-[195px] px-3", compact ? "py-2.5" : "py-4")}>
        <div className="flex items-center gap-2.5">
          <TargetIcon
            className="size-4 shrink-0 text-slate-500"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="truncate text-[13px] text-slate-700 dark:text-slate-200">
              {job.target.name}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {job.target.environment}
            </p>
          </div>
        </div>
      </td>
      <td className={cn("min-w-[155px] px-3", compact ? "py-2.5" : "py-4")}>
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: job.owner.color }}
            aria-hidden="true"
          >
            {job.owner.initials}
          </span>
          <span className="truncate text-[13px] text-slate-700 dark:text-slate-200">
            {job.owner.name}
          </span>
        </div>
      </td>
      <td className={cn("w-12 px-2 text-right", compact ? "py-2.5" : "py-4")}>
        <button
          type="button"
          onClick={() => onMenu(job)}
          aria-label={`จัดการ ${job.name}`}
          className="rounded-lg p-1.5 text-slate-400 opacity-70 transition-colors group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:hover:bg-white/[0.08] dark:hover:text-slate-200"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

function EmptyJobsState({
  hasFilters,
  isLoading = false,
}: {
  hasFilters: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 dark:border-white/[0.1] dark:bg-white/[0.06]">
        <Search className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {isLoading
          ? "กำลังโหลด Cron Jobs"
          : hasFilters
            ? "ไม่พบงานที่ตรงกับตัวกรอง"
            : "ยังไม่มี Cron job"}
      </h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {isLoading
          ? "กำลังอ่านรายการจาก scheduler จริง"
          : hasFilters
            ? "ลองเปลี่ยนคำค้นหา สถานะ หรือเป้าหมาย แล้วค้นหาอีกครั้ง"
            : "เพิ่มงานแรกเพื่อให้ dispatcher เริ่มจัดการตามตารางเวลา"}
      </p>
    </div>
  );
}

const DIALOG_INPUT_CLASS =
  "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100";

const EMPTY_CRON_JOB_FORM: CronJobMutationInput = {
  key: "new-cron-job",
  name: "งานใหม่",
  method: "GET",
  endpoint: "/api/cron/new-job",
  cronExpression: "*/5 * * * *",
  scheduleLabel: "ทุก 5 นาที",
  timezone: "Asia/Bangkok",
  environment: "production",
  targetName: "Application endpoint",
  targetKind: "security",
  ownerName: "ทีมระบบ",
  ownerInitials: "SYS",
  ownerColor: "#0f9f72",
  enabled: true,
};

function jobToForm(job: CronJob | null): CronJobMutationInput {
  if (!job) return EMPTY_CRON_JOB_FORM;

  return {
    key: job.key,
    name: job.name,
    method: job.method,
    endpoint: job.endpoint,
    cronExpression: job.cronExpression,
    scheduleLabel: job.scheduleLabel,
    timezone: job.timezone,
    environment: job.target.environment,
    targetName: job.target.name,
    targetKind: job.target.kind,
    ownerName: job.owner.name,
    ownerInitials: job.owner.initials,
    ownerColor: job.owner.color,
    enabled: job.enabled,
  };
}

function DialogShell({
  open,
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={cn(
          "max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/[0.1] dark:bg-[#17191c]",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cron-dialog-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="cron-dialog-title"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-slate-200"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

function CronJobFormDialog({
  open,
  job,
  isSaving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  job: CronJob | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: CronJobMutationInput) => Promise<void>;
}) {
  const [form, setForm] = useState<CronJobMutationInput>(() => jobToForm(job));
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = (
    field: keyof CronJobMutationInput,
    value: string | boolean,
  ) => {
    setForm(
      (current) => ({ ...current, [field]: value }) as CronJobMutationInput,
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      await onSubmit(form);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "บันทึก Cron Job ไม่สำเร็จ",
      );
    }
  };

  return (
    <DialogShell
      open={open}
      title={job ? "แก้ไข Cron Job" : "สร้าง Cron Job ใหม่"}
      description="กำหนด endpoint และ cron expression ที่ dispatcher จะอ่านจาก PostgreSQL"
      onClose={onClose}
      wide
    >
      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            ชื่องาน
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={DIALOG_INPUT_CLASS}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Key
            <input
              required
              pattern="[a-z0-9][a-z0-9\-]*"
              value={form.key}
              onChange={(event) => updateField("key", event.target.value)}
              className={`${DIALOG_INPUT_CLASS} font-mono`}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Method
            <select
              value={form.method}
              onChange={(event) =>
                updateField(
                  "method",
                  event.target.value as CronJobMutationInput["method"],
                )
              }
              className={DIALOG_INPUT_CLASS}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Endpoint
            <input
              required
              value={form.endpoint}
              onChange={(event) => updateField("endpoint", event.target.value)}
              placeholder="/api/cron/example"
              className={`${DIALOG_INPUT_CLASS} font-mono`}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            ชื่อตารางเวลา
            <input
              required
              value={form.scheduleLabel}
              onChange={(event) =>
                updateField("scheduleLabel", event.target.value)
              }
              placeholder="ทุก 5 นาที"
              className={DIALOG_INPUT_CLASS}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Cron expression
            <input
              required
              value={form.cronExpression}
              onChange={(event) =>
                updateField("cronExpression", event.target.value)
              }
              placeholder="*/5 * * * *"
              className={`${DIALOG_INPUT_CLASS} font-mono`}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Timezone
            <input
              required
              readOnly
              value={form.timezone}
              className={DIALOG_INPUT_CLASS}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Environment
            <select
              value={form.environment}
              onChange={(event) =>
                updateField(
                  "environment",
                  event.target.value as CronJobMutationInput["environment"],
                )
              }
              className={DIALOG_INPUT_CLASS}
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => updateField("enabled", event.target.checked)}
              className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            เปิดใช้งานทันที
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Target
            <input
              required
              value={form.targetName}
              onChange={(event) =>
                updateField("targetName", event.target.value)
              }
              className={DIALOG_INPUT_CLASS}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            ประเภท target
            <select
              value={form.targetKind}
              onChange={(event) =>
                updateField(
                  "targetKind",
                  event.target.value as CronJobMutationInput["targetKind"],
                )
              }
              className={DIALOG_INPUT_CLASS}
            >
              {TARGET_FILTER_OPTIONS.filter(
                (option) => option.value !== "all",
              ).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_100px_120px]">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            เจ้าของ
            <input
              required
              value={form.ownerName}
              onChange={(event) => updateField("ownerName", event.target.value)}
              className={DIALOG_INPUT_CLASS}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Initials
            <input
              required
              maxLength={8}
              value={form.ownerInitials}
              onChange={(event) =>
                updateField("ownerInitials", event.target.value.toUpperCase())
              }
              className={`${DIALOG_INPUT_CLASS} uppercase`}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            สี owner
            <input
              required
              type="color"
              value={form.ownerColor}
              onChange={(event) =>
                updateField("ownerColor", event.target.value)
              }
              className="mt-1.5 h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-white/[0.1] dark:bg-white/[0.04]"
            />
          </label>
        </div>

        {formError && (
          <p className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.08]"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <LoaderCircle className="size-3.5 animate-spin" />}
            บันทึก Cron Job
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function CronJobActionsDialog({
  job,
  isBusy,
  onClose,
  onEdit,
  onRun,
  onToggle,
  onDelete,
}: {
  job: CronJob | null;
  isBusy: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRun: () => Promise<void>;
  onToggle: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!job) return null;

  return (
    <DialogShell
      open
      title={job.name}
      description={`${job.command} · ${job.scheduleLabel}`}
      onClose={onClose}
    >
      <div className="space-y-2">
        <CronJobLastRunDetails lastRun={job.lastRun} />
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void onRun()}
          className="flex w-full items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-left text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-300"
        >
          <Play className="size-4" aria-hidden="true" />
          <span>
            รันทันที
            <span className="mt-0.5 block text-[11px] font-normal opacity-75">
              เรียก endpoint จริงและบันทึก execution history
            </span>
          </span>
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={onEdit}
          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-white/[0.1] dark:text-slate-200 dark:hover:bg-white/[0.06]"
        >
          <Pencil className="size-4" aria-hidden="true" />
          แก้ไขรายละเอียดและตารางเวลา
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void onToggle()}
          className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-white/[0.1] dark:text-slate-200 dark:hover:bg-white/[0.06]"
        >
          {job.enabled ? (
            <CircleX className="size-4" aria-hidden="true" />
          ) : (
            <Check className="size-4" aria-hidden="true" />
          )}
          {job.enabled ? "หยุดชั่วคราว" : "เปิดใช้งาน"}
        </button>

        <div className="border-t border-slate-200 pt-2 dark:border-white/[0.08]">
          {!confirmDelete ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/10 disabled:opacity-60 dark:text-rose-300"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              ลบ Cron Job
            </button>
          ) : (
            <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3">
              <p className="text-xs leading-5 text-rose-800 dark:text-rose-200">
                ลบงานนี้และ execution history ทั้งหมดหรือไม่?
                การลบย้อนกลับไม่ได้
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-8 rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/[0.08]"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void onDelete()}
                  className="h-8 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogShell>
  );
}

function CronJobLastRunDetails({ lastRun }: { lastRun: CronJob["lastRun"] }) {
  const isFailure =
    lastRun.status === "failed" || lastRun.status === "timed-out";

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        isFailure
          ? "border-rose-400/25 bg-rose-500/10"
          : "border-slate-200 bg-slate-50 dark:border-white/[0.1] dark:bg-white/[0.04]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          ผลการรันล่าสุด
        </p>
        <StatusBadge status={lastRun.status} />
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        {lastRun.relative} · {lastRun.duration}
        {lastRun.httpStatus ? ` · HTTP ${lastRun.httpStatus}` : ""}
      </p>
      {lastRun.message && (
        <p
          className={cn(
            "mt-2 text-xs leading-5",
            isFailure
              ? "text-rose-800 dark:text-rose-200"
              : "text-slate-600 dark:text-slate-300",
          )}
        >
          {isFailure ? "สาเหตุ: " : "รายละเอียด: "}
          {lastRun.message}
        </p>
      )}
      {isFailure && !lastRun.message && (
        <p className="mt-2 text-xs text-rose-800 dark:text-rose-200">
          ไม่พบรายละเอียดสาเหตุจาก endpoint
        </p>
      )}
    </div>
  );
}

export function CronJobsPage() {
  const { showToast } = useToast();
  const {
    jobs,
    source,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    createJob,
    updateJob,
    deleteJob,
    runJob,
  } = useCronJobs();
  const [activeFilter, setActiveFilter] = useState<JobFilter>("all");
  const [environmentFilter, setEnvironmentFilter] =
    useState<EnvironmentFilter>("all");
  const [targetFilter, setTargetFilter] = useState<"all" | TargetKind>("all");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("comfortable");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const statusCounts = useMemo(() => getCronJobStatusCounts(jobs), [jobs]);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesStatus =
        activeFilter === "all" || getCronJobStatus(job) === activeFilter;
      const matchesEnvironment =
        environmentFilter === "all" ||
        job.target.environment === environmentFilter;
      const matchesTarget =
        targetFilter === "all" || job.target.kind === targetFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        job.name.toLowerCase().includes(normalizedQuery) ||
        job.command.toLowerCase().includes(normalizedQuery) ||
        job.target.name.toLowerCase().includes(normalizedQuery);

      return (
        matchesStatus && matchesEnvironment && matchesTarget && matchesQuery
      );
    });
  }, [activeFilter, environmentFilter, jobs, query, targetFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleJobs = filteredJobs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstVisibleRow =
    filteredJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleRow = Math.min(currentPage * pageSize, filteredJobs.length);

  const activeJobs = jobs.filter((job) => job.enabled).length;
  const failingJobs = statusCounts.failing;
  const executionHistory = jobs.flatMap((job) => job.runHistory);
  const successfulRuns = executionHistory.filter(
    (status) => status === "succeeded",
  ).length;
  const failedRuns = executionHistory.filter(
    (status) => status === "failed",
  ).length;
  const timedOutRuns = executionHistory.filter(
    (status) => status === "timed-out",
  ).length;
  const recordedRuns = executionHistory.filter(
    (status) =>
      status === "succeeded" || status === "failed" || status === "timed-out",
  ).length;
  const successRate =
    recordedRuns > 0
      ? `${((successfulRuns / recordedRuns) * 100).toFixed(1)}%`
      : "—";
  const nextHourRunCount = jobs.filter((job) => {
    if (!job.enabled || !job.nextRun.iso) return false;
    const nextRunAt = new Date(job.nextRun.iso).getTime();
    const now = source?.generatedAt
      ? new Date(source.generatedAt).getTime()
      : 0;
    return nextRunAt <= now + 60 * 60 * 1000;
  }).length;
  const worstJob = jobs.find((job) => getCronJobStatus(job) === "failing");

  const handleResetFilters = () => {
    setActiveFilter("all");
    setEnvironmentFilter("all");
    setTargetFilter("all");
    setQuery("");
    setPage(1);
  };

  const handleOpenCreate = () => {
    setNotice(null);
    setEditingJob(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (job: CronJob) => {
    setNotice(null);
    setSelectedJob(null);
    setEditingJob(job);
    setFormOpen(true);
  };

  const handleSaveJob = async (input: CronJobMutationInput) => {
    if (editingJob) {
      await updateJob(editingJob.id, input);
      setNotice({ type: "success", message: "แก้ไข Cron Job เรียบร้อยแล้ว" });
    } else {
      await createJob(input);
      setNotice({ type: "success", message: "สร้าง Cron Job เรียบร้อยแล้ว" });
    }

    setFormOpen(false);
    setEditingJob(null);
  };

  const handleToggleJob = async (job: CronJob) => {
    try {
      await updateJob(job.id, { enabled: !job.enabled });
      setSelectedJob(null);
      setNotice(null);
      showToast({
        title: job.enabled
          ? "หยุด Cron Job ชั่วคราวแล้ว"
          : "เปิดใช้งาน Cron Job แล้ว",
        description: job.name,
        type: "success",
      });
    } catch (toggleError) {
      setNotice(null);
      showToast({
        title: "เปลี่ยนสถานะ Cron Job ไม่สำเร็จ",
        description:
          toggleError instanceof Error
            ? toggleError.message
            : "กรุณาลองใหม่อีกครั้ง",
        type: "error",
      });
    }
  };

  const handleRunJob = async (job: CronJob) => {
    try {
      const result = await runJob(job.id);
      setSelectedJob(null);
      setNotice({
        type: result.status === "succeeded" ? "success" : "error",
        message: `${job.name}: ${result.message}`,
      });
    } catch (runError) {
      setNotice({
        type: "error",
        message:
          runError instanceof Error
            ? runError.message
            : "รัน Cron Job ไม่สำเร็จ",
      });
    }
  };

  const handleDeleteJob = async (job: CronJob) => {
    try {
      await deleteJob(job.id);
      setSelectedJob(null);
      setNotice({ type: "success", message: "ลบ Cron Job เรียบร้อยแล้ว" });
    } catch (deleteError) {
      setNotice({
        type: "error",
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "ลบ Cron Job ไม่สำเร็จ",
      });
    }
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#f5f7f8] px-4 py-7 text-slate-900 sm:px-6 lg:px-8 dark:bg-[#0d0f11] dark:text-slate-100">
      <div className="mx-auto max-w-[1640px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] leading-none font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                Cron Jobs
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Database className="size-3.5" aria-hidden="true" />
                {failingJobs > 0 ? `${failingJobs} ล้มเหลว` : "PostgreSQL"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {jobs.length} งานจาก container cron · เวลา{" "}
              {source?.timezone ?? "Asia/Bangkok"}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative">
              <label htmlFor="environment-filter" className="sr-only">
                เลือกสภาพแวดล้อม
              </label>
              <select
                id="environment-filter"
                value={environmentFilter}
                onChange={(event) => {
                  setEnvironmentFilter(event.target.value as EnvironmentFilter);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 shadow-sm transition-colors outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:w-48 dark:border-white/[0.1] dark:bg-[#151719] dark:text-slate-200"
              >
                <option value="all">ทุกสภาพแวดล้อม</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Plus className="size-4" aria-hidden="true" />
              งานใหม่
            </button>
          </div>
        </header>

        {isLoading && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-white/[0.08] dark:bg-[#151719] dark:text-slate-300">
            <LoaderCircle
              className="size-4 animate-spin text-emerald-500"
              aria-hidden="true"
            />
            กำลังอ่านสถานะจากระบบ Cron จริง…
          </div>
        )}
        {error && (
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between dark:text-rose-200">
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              {error}
            </span>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={isRefreshing}
              className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-rose-400/30 px-3 text-xs font-semibold transition-colors hover:bg-rose-500/10 disabled:opacity-50"
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
            role="status"
          >
            {notice.type === "success" ? (
              <Check className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            )}
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="ปิดข้อความแจ้งเตือน"
              className="ml-auto rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/[0.08]"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        <section
          className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          aria-label="สรุปสถานะ Cron Jobs"
        >
          <MetricCard
            icon={Activity}
            label="งานที่เปิดใช้งาน"
            value={`${activeJobs} จาก ${jobs.length}`}
            detail="อ่านจากตาราง cron_jobs ใน PostgreSQL"
          >
            <StatusSegments
              healthy={statusCounts.healthy}
              failing={statusCounts.failing}
              paused={statusCounts.paused}
            />
            <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {statusCounts.healthy} ปกติ
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-rose-500" />
                {statusCounts.failing} ล้มเหลว
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-violet-500" />
                {statusCounts.paused} หยุด
              </span>
            </div>
          </MetricCard>

          <MetricCard
            icon={Activity}
            label="อัตราสำเร็จ"
            value={successRate}
            detail={
              recordedRuns > 0
                ? `${successfulRuns} จาก ${recordedRuns} รอบ`
                : "ยังไม่ได้เปิด execution history"
            }
          >
            {recordedRuns > 0 && (
              <div className="mt-1 inline-flex items-center rounded-md border border-slate-400/25 bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                คำนวณจาก telemetry จริง
              </div>
            )}
            <SuccessRateChart history={executionHistory} />
          </MetricCard>

          <MetricCard
            icon={CircleX}
            label="รอบที่ล้มเหลว"
            value={
              executionHistory.length > 0 ? `${failedRuns + timedOutRuns}` : "—"
            }
            detail={
              executionHistory.length > 0
                ? `จาก ${jobs.filter((job) => job.runHistory.some((status) => status === "failed" || status === "timed-out")).length} งาน`
                : "ยังไม่มี execution history"
            }
          >
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="text-xs text-slate-500">หนักสุด</span>
              <Database className="size-4 text-slate-500" aria-hidden="true" />
              <span className="truncate">
                {worstJob?.name ?? "ยังไม่มีรอบที่ล้มเหลว"}
              </span>
              <span className="ml-auto shrink-0 text-xs text-slate-500">
                {worstJob?.lastRun.relative ?? "—"}
              </span>
            </div>
            <FailedRunsChart failed={failedRuns} timedOut={timedOutRuns} />
          </MetricCard>

          <MetricCard
            icon={CalendarClock}
            label="รอบถัดไป"
            value={
              jobs.find((job) => job.enabled && job.nextRun.iso)?.nextRun
                .relative ?? "—"
            }
            detail={`${nextHourRunCount} งานในชั่วโมงถัดไป`}
          >
            <NextRunPreview jobs={jobs} />
          </MetricCard>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_34px_rgba(16,24,40,0.05)] dark:border-white/[0.08] dark:bg-[#151719] dark:shadow-none">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-white/[0.08]">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                งานทั้งหมด
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {jobs.length} งาน · {failingJobs} ล้มเหลว
              </p>
            </div>
            <button
              type="button"
              aria-pressed={displayMode === "compact"}
              onClick={() =>
                setDisplayMode((current) =>
                  current === "compact" ? "comfortable" : "compact",
                )
              }
              className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none sm:self-auto dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08]"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              แสดงผล
            </button>
          </div>

          <div
            className="flex gap-6 overflow-x-auto border-b border-slate-200 px-5 sm:px-6 dark:border-white/[0.08]"
            role="tablist"
            aria-label="กรองตามสถานะ"
          >
            {(
              [
                ["all", "ทั้งหมด"],
                ["healthy", "ปกติ"],
                ["failing", "ล้มเหลว"],
                ["paused", "หยุดชั่วคราว"],
              ] as const
            ).map(([filter, label]) => {
              const count = statusCounts[filter];
              const isActive = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveFilter(filter);
                    setPage(1);
                  }}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 py-3.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none",
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
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="ค้นหาชื่องานหรือคำสั่ง…"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-600"
              />
            </div>
            <div className="relative flex items-center gap-2 self-end sm:self-auto">
              {filterOpen && (
                <div className="absolute top-11 right-0 z-20 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/[0.1] dark:bg-[#1b1e22]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      ตัวกรองเพิ่มเติม
                    </p>
                    <button
                      type="button"
                      onClick={() => setFilterOpen(false)}
                      aria-label="ปิดตัวกรอง"
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
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
                      value={targetFilter}
                      onChange={(event) => {
                        setTargetFilter(
                          event.target.value as "all" | TargetKind,
                        );
                        setPage(1);
                      }}
                      className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pr-8 text-sm text-slate-700 outline-none focus:border-emerald-500 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-200"
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
                    onClick={handleResetFilters}
                    className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              )}
              <button
                type="button"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen((open) => !open)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none",
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

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1430px] border-collapse text-left">
              <caption className="sr-only">
                รายการ Cron Jobs และสถานะการทำงาน
              </caption>
              <thead className="bg-slate-50/80 dark:bg-white/[0.02]">
                <tr className="text-[11px] font-semibold tracking-wide text-slate-500">
                  {[
                    ["งาน", "min-w-[280px]"],
                    ["ตารางเวลา", "min-w-[165px]"],
                    ["เปิดใช้งาน", "w-24 text-center"],
                    ["รอบล่าสุด", "min-w-[150px]"],
                    ["20 รอบล่าสุด", "min-w-[150px]"],
                    ["รอบถัดไป", "min-w-[130px]"],
                    ["เป้าหมาย", "min-w-[195px]"],
                    ["เจ้าของ", "min-w-[155px]"],
                    ["", "w-12"],
                  ].map(([label, className]) => (
                    <th key={label} className={cn("px-3 py-3", className)}>
                      <span className="inline-flex items-center gap-1.5">
                        {label}
                        <ArrowDownUp
                          className="size-3 text-slate-400"
                          aria-hidden="true"
                        />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleJobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    compact={displayMode === "compact"}
                    onToggle={(selected) => void handleToggleJob(selected)}
                    onMenu={setSelectedJob}
                    toggleDisabled={isMutating}
                  />
                ))}
              </tbody>
            </table>
            {visibleJobs.length === 0 && (
              <EmptyJobsState
                hasFilters={Boolean(
                  query ||
                  activeFilter !== "all" ||
                  environmentFilter !== "all" ||
                  targetFilter !== "all",
                )}
                isLoading={isLoading}
              />
            )}
          </div>

          <footer className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-white/[0.08]">
            <label className="flex items-center gap-2">
              แถวต่อหน้า
              <span className="relative">
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="h-8 appearance-none rounded-lg border border-slate-200 bg-white px-2.5 pr-7 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-200"
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
                {firstVisibleRow}–{lastVisibleRow} จาก {filteredJobs.length} งาน
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  aria-label="ไปหน้าก่อนหน้า"
                  className="inline-flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white/[0.08]"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1)
                  .slice(0, 5)
                  .map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      aria-current={
                        currentPage === pageNumber ? "page" : undefined
                      }
                      onClick={() => setPage(pageNumber)}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none",
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
                  onClick={() =>
                    setPage((current) => Math.min(pageCount, current + 1))
                  }
                  aria-label="ไปหน้าถัดไป"
                  className="inline-flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white/[0.08]"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </footer>
        </section>
      </div>
      <CronJobFormDialog
        key={`form-${formOpen ? (editingJob?.id ?? "new") : "closed"}`}
        open={formOpen}
        job={editingJob}
        isSaving={isMutating}
        onClose={() => {
          if (!isMutating) {
            setFormOpen(false);
            setEditingJob(null);
          }
        }}
        onSubmit={handleSaveJob}
      />
      <CronJobActionsDialog
        key={`actions-${selectedJob?.id ?? "closed"}`}
        job={selectedJob}
        isBusy={isMutating}
        onClose={() => setSelectedJob(null)}
        onEdit={() => {
          if (selectedJob) handleOpenEdit(selectedJob);
        }}
        onRun={() =>
          selectedJob ? handleRunJob(selectedJob) : Promise.resolve()
        }
        onToggle={() =>
          selectedJob ? handleToggleJob(selectedJob) : Promise.resolve()
        }
        onDelete={() =>
          selectedJob ? handleDeleteJob(selectedJob) : Promise.resolve()
        }
      />
    </main>
  );
}

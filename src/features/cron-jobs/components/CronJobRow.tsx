import { MoreHorizontal, ServerCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { TARGET_ICONS } from "@/features/cron-jobs/constants/targets";
import type { CronJob } from "@/features/cron-jobs/types";
import { JobToggle } from "@/features/cron-jobs/components/JobToggle";
import { RunSparkline } from "@/features/cron-jobs/components/RunSparkline";
import { RunStatusBadge } from "@/features/cron-jobs/components/RunStatusBadge";

interface CronJobRowProps {
  job: CronJob;
  compact: boolean;
  onToggle: (job: CronJob) => void;
  onMenu: (job: CronJob) => void;
  toggleDisabled: boolean;
}

export function CronJobRow({
  job,
  compact,
  onToggle,
  onMenu,
  toggleDisabled,
}: CronJobRowProps) {
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
          <RunStatusBadge status={job.lastRun.status} />
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
          className="cursor-pointer rounded-lg p-1.5 text-slate-400 opacity-70 transition-colors group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:hover:bg-white/[0.08] dark:hover:text-slate-200"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

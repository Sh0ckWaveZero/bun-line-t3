import { Activity, CalendarClock } from "lucide-react";
import { getCronJobStatus } from "@/features/cron-jobs/helpers";
import type { CronJob } from "@/features/cron-jobs/types";

interface NextRunPreviewProps {
  jobs: CronJob[];
}

export function NextRunPreview({ jobs }: NextRunPreviewProps) {
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

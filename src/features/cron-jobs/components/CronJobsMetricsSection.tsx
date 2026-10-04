import { Activity, CalendarClock, CircleX, Database } from "lucide-react";
import type { CronJob } from "@/features/cron-jobs/types";
import type { CronJobMetrics } from "@/features/cron-jobs/hooks/useCronJobMetrics";
import { FailedRunsChart } from "@/features/cron-jobs/components/FailedRunsChart";
import { MetricCard } from "@/features/cron-jobs/components/MetricCard";
import { NextRunPreview } from "@/features/cron-jobs/components/NextRunPreview";
import { StatusSegments } from "@/features/cron-jobs/components/StatusSegments";
import { SuccessRateChart } from "@/features/cron-jobs/components/SuccessRateChart";

interface CronJobsMetricsSectionProps {
  metrics: CronJobMetrics;
  jobs: CronJob[];
}

export function CronJobsMetricsSection({
  metrics,
  jobs,
}: CronJobsMetricsSectionProps) {
  const {
    statusCounts,
    activeJobs,
    executionHistory,
    successfulRuns,
    failedRuns,
    timedOutRuns,
    recordedRuns,
    successRate,
    nextHourRunCount,
    worstJob,
    failingRunJobsCount,
    nextEnabledJobRelative,
  } = metrics;

  return (
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
            ? `จาก ${failingRunJobsCount} งาน`
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
        value={nextEnabledJobRelative}
        detail={`${nextHourRunCount} งานในชั่วโมงถัดไป`}
      >
        <NextRunPreview jobs={jobs} />
      </MetricCard>
    </section>
  );
}

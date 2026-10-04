import { useMemo } from "react";
import {
  getCronJobStatus,
  getCronJobStatusCounts,
  type CronJobStatusCounts,
} from "@/features/cron-jobs/helpers";
import type { CronJob, CronJobDataSource, RunStatus } from "@/features/cron-jobs/types";

export interface CronJobMetrics {
  statusCounts: CronJobStatusCounts;
  activeJobs: number;
  failingJobs: number;
  executionHistory: RunStatus[];
  successfulRuns: number;
  failedRuns: number;
  timedOutRuns: number;
  recordedRuns: number;
  successRate: string;
  nextHourRunCount: number;
  worstJob: CronJob | undefined;
  failingRunJobsCount: number;
  nextEnabledJobRelative: string;
}

export function useCronJobMetrics(
  jobs: CronJob[],
  source: CronJobDataSource | null,
): CronJobMetrics {
  const statusCounts = useMemo(() => getCronJobStatusCounts(jobs), [jobs]);

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
  const failingRunJobsCount = jobs.filter((job) =>
    job.runHistory.some(
      (status) => status === "failed" || status === "timed-out",
    ),
  ).length;
  const nextEnabledJobRelative =
    jobs.find((job) => job.enabled && job.nextRun.iso)?.nextRun.relative ?? "—";

  return {
    statusCounts,
    activeJobs,
    failingJobs,
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
  };
}

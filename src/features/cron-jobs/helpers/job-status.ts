import type { CronJob, JobStatus } from "../types";

export interface CronJobStatusCounts {
  all: number;
  healthy: number;
  failing: number;
  paused: number;
}

export function getCronJobStatus(job: CronJob): JobStatus {
  if (!job.enabled) return "paused";
  return ["failed", "timed-out"].includes(job.lastRun.status)
    ? "failing"
    : "healthy";
}

export function getCronJobStatusCounts(
  jobs: readonly CronJob[],
): CronJobStatusCounts {
  return jobs.reduce<CronJobStatusCounts>(
    (counts, job) => {
      counts[getCronJobStatus(job)] += 1;
      counts.all += 1;
      return counts;
    },
    { all: 0, healthy: 0, failing: 0, paused: 0 },
  );
}

import { Prisma } from "@prisma/client";
import { db } from "@/lib/database/db";
import {
  extractCronResponseMessage,
  formatCronDate,
  formatRelativePast,
  formatRelativeUntil,
  getNextCronOccurrence,
  isValidCronExpression,
  matchesCronOccurrence,
} from "../helpers";
import type {
  CronHttpMethod,
  CronJob,
  CronJobRunDetail,
  CronJobsSnapshot,
  RunStatus,
} from "../types";

const SCHEDULER_TIMEZONE = "Asia/Bangkok";
const RUN_TIMEOUT_MS = 30_000;

export interface CronJobInput {
  key: string;
  name: string;
  method: CronHttpMethod;
  endpoint: string;
  cronExpression: string;
  scheduleLabel: string;
  timezone: string;
  environment: string;
  targetName: string;
  targetKind: string;
  ownerName: string;
  ownerInitials: string;
  ownerColor: string;
  enabled: boolean;
}

interface CronExecutionRecord {
  id: string;
  status: string;
  startedAt: Date;
  durationMs: number | null;
  httpStatus: number | null;
  message: string | null;
}

interface CronJobRecord {
  id: string;
  key: string;
  name: string;
  method: string;
  endpoint: string;
  cronExpression: string;
  scheduleLabel: string;
  timezone: string;
  environment: string;
  targetName: string;
  targetKind: string;
  ownerName: string;
  ownerInitials: string;
  ownerColor: string;
  enabled: boolean;
  executions: CronExecutionRecord[];
}

interface CronJobRunRecord {
  id: string;
  method: string;
  endpoint: string;
}

interface CronDispatchRecord extends CronJobRunRecord {
  cronExpression: string;
}

export interface CronRunResult {
  jobId: string;
  status: RunStatus;
  httpStatus: number | null;
  message: string;
  duplicate?: boolean;
}

function toRunStatus(value: string): RunStatus {
  if (
    value === "succeeded" ||
    value === "failed" ||
    value === "timed-out" ||
    value === "skipped" ||
    value === "pending"
  ) {
    return value;
  }

  return "unknown";
}

function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return "—";

  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

function toEnvironment(value: string): CronJob["target"]["environment"] {
  if (value === "staging") return "staging";
  if (value === "development") return "development";
  return "production";
}

function toTargetKind(value: string): CronJob["target"]["kind"] {
  const supported: CronJob["target"]["kind"][] = [
    "attendance",
    "webhook",
    "database",
    "search",
    "notifications",
    "payments",
    "fraud",
    "reports",
    "storage",
    "sync",
    "security",
  ];

  return supported.includes(value as CronJob["target"]["kind"])
    ? (value as CronJob["target"]["kind"])
    : "security";
}

function toMethod(value: string): CronHttpMethod {
  return value === "POST" ? "POST" : "GET";
}

function makeCronJob(record: CronJobRecord, now: Date): CronJob {
  const latestExecution = record.executions[0];
  const history = record.executions.slice().reverse();
  const runDetails: CronJobRunDetail[] = history.map((execution) => ({
    id: execution.id,
    status: toRunStatus(execution.status),
    relative: formatRelativePast(execution.startedAt, now),
    duration: formatDuration(execution.durationMs),
    httpStatus: execution.httpStatus,
    message: execution.message,
  }));
  const nextRun = record.enabled
    ? getNextCronOccurrence(record.cronExpression, now)
    : null;

  return {
    id: record.id,
    key: record.key,
    name: record.name,
    command: `${record.method} ${record.endpoint}`,
    method: toMethod(record.method),
    endpoint: record.endpoint,
    scheduleLabel: record.scheduleLabel,
    cronExpression: record.cronExpression,
    timezone: record.timezone,
    enabled: record.enabled,
    lastRun: latestExecution
      ? {
          status: toRunStatus(latestExecution.status),
          relative: formatRelativePast(latestExecution.startedAt, now),
          duration: formatDuration(latestExecution.durationMs),
          httpStatus: latestExecution.httpStatus,
          message: latestExecution.message,
        }
      : {
          status: "unknown",
          relative: "ยังไม่มีข้อมูล",
          duration: "—",
          httpStatus: null,
          message: null,
        },
    runHistory: history.map((execution) => toRunStatus(execution.status)),
    runDetails,
    nextRun: nextRun
      ? {
          relative: formatRelativeUntil(nextRun, now),
          at: `${formatCronDate(nextRun)} น.`,
          iso: nextRun.toISOString(),
        }
      : { relative: "หยุดชั่วคราว", at: "—" },
    target: {
      name: record.targetName,
      environment: toEnvironment(record.environment),
      kind: toTargetKind(record.targetKind),
    },
    owner: {
      name: record.ownerName,
      initials: record.ownerInitials,
      color: record.ownerColor,
    },
  };
}

const executionInclude = {
  executions: {
    orderBy: { startedAt: "desc" as const },
    take: 20,
    select: {
      id: true,
      status: true,
      startedAt: true,
      durationMs: true,
      httpStatus: true,
      message: true,
    },
  },
};

export async function getCronJobsSnapshot(): Promise<CronJobsSnapshot> {
  const now = new Date();
  const records = await db.cronJob.findMany({
    orderBy: { createdAt: "asc" },
    include: executionInclude,
  });

  return {
    jobs: records.map((record: CronJobRecord) => makeCronJob(record, now)),
    source: {
      scheduler: "container-cron",
      storage: "postgresql",
      timezone: SCHEDULER_TIMEZONE,
      readOnly: false,
      generatedAt: now.toISOString(),
    },
  };
}

export async function getCronJobById(id: string): Promise<CronJob | null> {
  const record = await db.cronJob.findUnique({
    where: { id },
    include: executionInclude,
  });

  return record ? makeCronJob(record, new Date()) : null;
}

export async function createCronJob(input: CronJobInput): Promise<CronJob> {
  const record = await db.cronJob.create({
    data: input,
    include: executionInclude,
  });

  return makeCronJob(record, new Date());
}

export async function updateCronJob(
  id: string,
  input: Partial<CronJobInput>,
): Promise<CronJob | null> {
  const record = await db.cronJob.update({
    where: { id },
    data: input,
    include: executionInclude,
  });

  return makeCronJob(record, new Date());
}

export async function deleteCronJob(id: string): Promise<boolean> {
  try {
    await db.cronJob.delete({ where: { id } });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return false;
    }
    throw error;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function readExecutionMessage(response: Response): Promise<string> {
  let body: string;

  try {
    body = await response.text();
  } catch {
    return `HTTP ${response.status}`;
  }

  if (body.trim()) {
    try {
      const payload: unknown = JSON.parse(body);
      const message = extractCronResponseMessage(payload);
      if (message) return message.slice(0, 500);
    } catch {
      if (!response.ok) return body.trim().slice(0, 500);
    }
  }

  return `HTTP ${response.status}`;
}

async function executeClaimedCronJob(
  job: CronJobRunRecord,
  executionId: string,
  requestUrl: string,
): Promise<CronRunResult> {
  const startedAt = new Date();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RUN_TIMEOUT_MS);
  let httpStatus: number | null = null;
  let outcome: { status: RunStatus; message: string };

  try {
    const response = await fetch(new URL(job.endpoint, requestUrl), {
      method: toMethod(job.method),
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}`,
        "User-Agent": "CronJobsDispatcher/1.0",
      },
      signal: controller.signal,
    });

    httpStatus = response.status;
    outcome = {
      status: response.ok ? "succeeded" : "failed",
      message: await readExecutionMessage(response),
    };
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "AbortError";
    outcome = {
      status: timedOut ? "timed-out" : "failed",
      message: timedOut ? "Cron Job หมดเวลา" : "เรียก Cron Job ไม่สำเร็จ",
    };
  } finally {
    clearTimeout(timeout);
  }

  const finishedAt = new Date();
  await db.cronJobExecution.update({
    where: { id: executionId },
    data: {
      status: outcome.status,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      httpStatus,
      message: outcome.message,
    },
  });

  return {
    jobId: job.id,
    status: outcome.status,
    httpStatus,
    message: outcome.message,
  };
}

async function claimExecution(
  jobId: string,
  trigger: "scheduled" | "manual",
  scheduledFor?: Date,
): Promise<string | null> {
  try {
    const execution = await db.cronJobExecution.create({
      data: {
        cronJobId: jobId,
        trigger,
        scheduledFor,
        status: "pending",
        startedAt: new Date(),
      },
      select: { id: true },
    });

    return execution.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) return null;
    throw error;
  }
}

export async function runCronJob(
  id: string,
  requestUrl: string,
  trigger: "scheduled" | "manual" = "manual",
  scheduledFor?: Date,
): Promise<CronRunResult | null> {
  const job = await db.cronJob.findUnique({
    where: { id },
    select: { id: true, method: true, endpoint: true },
  });
  if (!job) return null;

  if (!process.env.CRON_SECRET) {
    throw new Error("CRON_SECRET is not configured");
  }

  const executionId = await claimExecution(id, trigger, scheduledFor);
  if (!executionId) {
    return {
      jobId: id,
      status: "skipped",
      httpStatus: null,
      message: "Cron Job รอบนี้ถูก claim ไปแล้ว",
      duplicate: true,
    };
  }

  return executeClaimedCronJob(job, executionId, requestUrl);
}

export async function dispatchDueCronJobs(
  requestUrl: string,
  now = new Date(),
) {
  const scheduledFor = new Date(now);
  scheduledFor.setUTCSeconds(0, 0);

  const jobs = await db.cronJob.findMany({
    where: { enabled: true },
    select: {
      id: true,
      method: true,
      endpoint: true,
      cronExpression: true,
    },
  });

  const dueJobs = (jobs as CronDispatchRecord[]).filter((job) =>
    matchesCronOccurrence(job.cronExpression, scheduledFor),
  );

  const results = await Promise.all(
    dueJobs.map(async (job) =>
      runCronJob(job.id, requestUrl, "scheduled", scheduledFor),
    ),
  );

  return {
    scheduledFor: scheduledFor.toISOString(),
    matched: dueJobs.length,
    started: results.filter((result) => result && !result.duplicate).length,
    skipped: results.filter((result) => result?.duplicate).length,
    results: results.filter(
      (result): result is CronRunResult => result !== null,
    ),
  };
}

export function validateCronJobExpression(expression: string): boolean {
  return isValidCronExpression(expression);
}

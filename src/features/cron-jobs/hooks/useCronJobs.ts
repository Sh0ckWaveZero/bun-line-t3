import { useCallback, useEffect, useState } from "react";
import type {
  CronHttpMethod,
  CronJob,
  CronJobsSnapshot,
  TargetKind,
} from "../types";

export interface CronJobMutationInput {
  key: string;
  name: string;
  method: CronHttpMethod;
  endpoint: string;
  cronExpression: string;
  scheduleLabel: string;
  timezone: string;
  environment: "production" | "staging" | "development";
  targetName: string;
  targetKind: TargetKind;
  ownerName: string;
  ownerInitials: string;
  ownerColor: string;
  enabled: boolean;
}

interface CronJobsApiResponse {
  success: boolean;
  data?: CronJobsSnapshot;
  message?: string;
}

interface CronJobApiResponse {
  success: boolean;
  data?: { job: CronJob };
  message?: string;
}

interface CronRunApiResponse {
  success: boolean;
  data?: {
    result: {
      status: string;
      message: string;
    };
  };
  message?: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | null;
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "ไม่สามารถเชื่อมต่อ Cron Jobs ได้";
    throw new Error(message);
  }

  return payload as T;
}

function assertSnapshot(payload: CronJobsApiResponse): CronJobsSnapshot {
  if (!payload.success || !payload.data || !Array.isArray(payload.data.jobs)) {
    throw new Error(payload.message ?? "ข้อมูล Cron Jobs ไม่ถูกต้อง");
  }

  return payload.data;
}

export function useCronJobs() {
  const [snapshot, setSnapshot] = useState<CronJobsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/admin/cron-jobs", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload = await readJson<CronJobsApiResponse>(response);
      setSnapshot(assertSnapshot(payload));
      setError(null);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "ไม่สามารถอ่านข้อมูล Cron Jobs ได้",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const sendMutation = useCallback(
    async <T>(url: string, init: RequestInit): Promise<T> => {
      setIsMutating(true);

      try {
        const response = await fetch(url, {
          ...init,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...init.headers,
          },
        });
        const payload = await readJson<T>(response);
        await refresh();
        return payload;
      } finally {
        setIsMutating(false);
      }
    },
    [refresh],
  );

  const createJob = useCallback(
    async (input: CronJobMutationInput) => {
      const payload = await sendMutation<CronJobApiResponse>(
        "/api/admin/cron-jobs",
        { method: "POST", body: JSON.stringify(input) },
      );
      if (!payload.success || !payload.data?.job) {
        throw new Error(payload.message ?? "ไม่สามารถสร้าง Cron Job ได้");
      }
      return payload.data.job;
    },
    [sendMutation],
  );

  const updateJob = useCallback(
    async (id: string, input: Partial<CronJobMutationInput>) => {
      const payload = await sendMutation<CronJobApiResponse>(
        `/api/admin/cron-jobs/${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify(input) },
      );
      if (!payload.success || !payload.data?.job) {
        throw new Error(payload.message ?? "ไม่สามารถแก้ไข Cron Job ได้");
      }
      return payload.data.job;
    },
    [sendMutation],
  );

  const deleteJob = useCallback(
    async (id: string) => {
      const payload = await sendMutation<{
        success: boolean;
        message?: string;
      }>(`/api/admin/cron-jobs/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!payload.success) {
        throw new Error(payload.message ?? "ไม่สามารถลบ Cron Job ได้");
      }
    },
    [sendMutation],
  );

  const runJob = useCallback(
    async (id: string) => {
      const payload = await sendMutation<CronRunApiResponse>(
        `/api/admin/cron-jobs/${encodeURIComponent(id)}/run`,
        { method: "POST" },
      );
      if (!payload.success || !payload.data?.result) {
        throw new Error(payload.message ?? "ไม่สามารถรัน Cron Job ได้");
      }
      return payload.data.result;
    },
    [sendMutation],
  );

  useEffect(() => {
    const task = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(task);
  }, [refresh]);

  return {
    jobs: snapshot?.jobs ?? [],
    source: snapshot?.source ?? null,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    createJob,
    updateJob,
    deleteJob,
    runJob,
  };
}

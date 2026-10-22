import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BodyWeightSnapshot,
  ScaleProfileDto,
} from "@/features/body-weight/types";

export interface SaveProfileInput {
  id?: string;
  name: string;
  heightCm: number | null;
  /** "YYYY-MM-DD" หรือ null */
  birthDate: string | null;
  male: boolean;
  /** น้ำหนักอ้างอิง (กก.) หรือ null */
  refWeightKg: number | null;
}

interface SaveProfileCallbacks {
  onSuccess?: (profile: ScaleProfileDto) => void;
  onError?: (message: string) => void;
}

const REQUEST_TIMEOUT_MS = 8000;

const fetchWithTimeout = async (input: string, init: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export function useBodyWeight() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["body-weight"] });
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["body-weight"],
    queryFn: async (): Promise<BodyWeightSnapshot> => {
      const res = await fetchWithTimeout("/api/body-weight");
      if (!res.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลการชั่งน้ำหนักได้");
      }
      const json = await res.json();
      return (json as { data: BodyWeightSnapshot }).data;
    },
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: SaveProfileInput): Promise<ScaleProfileDto> => {
      const res = await fetchWithTimeout("/api/body-weight/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json as { error?: string }).error ?? "บันทึกโปรไฟล์ไม่สำเร็จ",
        );
      }
      return (json as { data: ScaleProfileDto }).data;
    },
    onSuccess: invalidate,
  });

  const reassignMutation = useMutation({
    mutationFn: async (input: {
      measurementId: string;
      profileId: string | null;
    }): Promise<void> => {
      const res = await fetchWithTimeout(
        `/api/body-weight/measurements/${encodeURIComponent(input.measurementId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: input.profileId }),
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          (json as { error?: string }).error ?? "เปลี่ยนเจ้าของไม่สำเร็จ",
        );
      }
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (measurementId: string): Promise<void> => {
      const res = await fetchWithTimeout(
        `/api/body-weight/measurements/${encodeURIComponent(measurementId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          (json as { error?: string }).error ?? "ลบการชั่งไม่สำเร็จ",
        );
      }
    },
    onSuccess: invalidate,
  });

  const saveProfile = async (
    input: SaveProfileInput,
    callbacks?: SaveProfileCallbacks,
  ) => {
    try {
      const profile = await saveMutation.mutateAsync(input);
      callbacks?.onSuccess?.(profile);
    } catch (e) {
      callbacks?.onError?.(
        e instanceof Error ? e.message : "บันทึกโปรไฟล์ไม่สำเร็จ",
      );
    }
  };

  return {
    snapshot: data ?? null,
    isLoading,
    isRefreshing: isFetching,
    error: error instanceof Error ? error.message : null,
    refetch,
    saveProfile,
    isSaving: saveMutation.isPending,
    reassignMeasurement: reassignMutation.mutateAsync,
    deleteMeasurement: deleteMutation.mutateAsync,
    /** id ของการชั่งที่กำลังแก้/ลบ — ใช้ disable ปุ่มเฉพาะแถว */
    busyMeasurementId: reassignMutation.isPending
      ? (reassignMutation.variables?.measurementId ?? null)
      : deleteMutation.isPending
        ? (deleteMutation.variables ?? null)
        : null,
  };
}

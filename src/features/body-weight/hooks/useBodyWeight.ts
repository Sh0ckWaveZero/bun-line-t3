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
  };
}

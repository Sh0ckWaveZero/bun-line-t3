import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ScaleListenerOverview } from "@/features/body-weight/types";

const QUERY_KEY = ["body-weight-listeners"] as const;
/** listener check-in ทุก 10 วิ — โหลดสถานะออนไลน์ตามจังหวะเดียวกัน */
const REFRESH_INTERVAL_MS = 10_000;

/** เครื่องที่รับสัญญาณตาชั่ง (Pi / เครื่อง dev / ปิด) + สถานะออนไลน์ของแต่ละเครื่อง */
export function useScaleListeners() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<ScaleListenerOverview> => {
      const res = await fetch("/api/body-weight/listeners");
      if (!res.ok) throw new Error("ไม่สามารถดึงสถานะเครื่องรับสัญญาณได้");
      const json = await res.json();
      return (json as { data: ScaleListenerOverview }).data;
    },
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async (active: string): Promise<ScaleListenerOverview> => {
      const res = await fetch("/api/body-weight/listeners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json as { error?: string }).error ??
            "ไม่สามารถเปลี่ยนเครื่องรับสัญญาณได้",
        );
      }
      return (json as { data: ScaleListenerOverview }).data;
    },
    onSuccess: (overview) => queryClient.setQueryData(QUERY_KEY, overview),
  });

  return {
    overview: data ?? null,
    setActive: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}

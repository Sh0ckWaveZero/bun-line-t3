import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CLOSED_WEIGH_IN_OVERLAY,
  getLiveStatus,
  nextWeighInOverlay,
  shouldOpenWeighInResult,
  type LiveStatus,
  type WeighInOverlayState,
} from "@/features/body-weight/helpers/live-scale";
import type { LiveScaleState } from "@/features/body-weight/types";

const LIVE_POLL_INTERVAL_MS = 1000;

/**
 * poll ทุก 1 วินาทีเพื่อให้ตรวจพบ packet จากตาชั่งได้เร็ว และหยุดเมื่อซ่อนแท็บ
 * — version เปลี่ยน = มีการชั่งบันทึก/อัปเดต → โหลด snapshot ["body-weight"] ใหม่
 * query key อยู่นอก prefix ["body-weight"] เพื่อไม่โดน invalidate ตามไปด้วย
 */
export function useLiveScale() {
  const queryClient = useQueryClient();
  const lastVersion = useRef<number | null>(null);
  const lastStatus = useRef<LiveStatus | null>(null);
  const [overlay, setOverlay] = useState<WeighInOverlayState>(
    CLOSED_WEIGH_IN_OVERLAY,
  );

  const { data } = useQuery({
    queryKey: ["body-weight-live"],
    queryFn: async (): Promise<LiveScaleState> => {
      const res = await fetch("/api/body-weight/live");
      if (!res.ok) throw new Error("ไม่สามารถดึงสถานะตาชั่งได้");
      const json = await res.json();
      return (json as { data: LiveScaleState }).data;
    },
    refetchInterval: LIVE_POLL_INTERVAL_MS,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (!data) return;
    const previousVersion = lastVersion.current;
    const previousStatus = lastStatus.current;
    const status = getLiveStatus(data.reading);
    lastVersion.current = data.version;
    lastStatus.current = status;

    if (previousVersion !== null && data.version !== previousVersion) {
      void queryClient.invalidateQueries({ queryKey: ["body-weight"] });
    }
    const savedMeasurementId = shouldOpenWeighInResult(previousVersion, data)
      ? (data.lastMeasurement?.id ?? null)
      : null;
    setOverlay((current) =>
      nextWeighInOverlay(current, {
        previousStatus,
        status,
        savedMeasurementId,
      }),
    );
  }, [data, queryClient]);

  // reference คงที่ — ถ้าสร้างใหม่ทุก render (poll ทุก 1 วิ) timer ปิดเองของ overlay จะถูกรีเซ็ตตลอด
  const closeOverlay = useCallback(
    () => setOverlay(CLOSED_WEIGH_IN_OVERLAY),
    [],
  );

  return {
    reading: data?.reading ?? null,
    pending: data?.pending ?? null,
    overlay,
    closeOverlay,
  };
}

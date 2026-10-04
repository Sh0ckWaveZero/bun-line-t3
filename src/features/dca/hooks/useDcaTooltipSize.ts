import { useEffect, useRef, useState } from "react";
import type { ChartDimensions } from "@/features/dca/types/chart";

interface UseDcaTooltipSizeParams {
  touchIdx: number | null;
  hoverIdx: number | null;
  mode: string;
  timeframe: string;
  ordersCount: number;
}

interface UseDcaTooltipSizeResult {
  ref: React.RefObject<HTMLDivElement | null>;
  size: ChartDimensions;
}

/** วัดขนาดจริงของ tooltip ด้วย ResizeObserver เพื่อคำนวณตำแหน่งที่ไม่ล้นขอบ */
export const useDcaTooltipSize = ({
  touchIdx,
  hoverIdx,
  mode,
  timeframe,
  ordersCount,
}: UseDcaTooltipSizeParams): UseDcaTooltipSizeResult => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ChartDimensions>({ w: 0, h: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const updateSize = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    updateSize();
    const ro = new ResizeObserver(() => updateSize());
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [touchIdx, hoverIdx, mode, timeframe, ordersCount]);

  return { ref, size };
};

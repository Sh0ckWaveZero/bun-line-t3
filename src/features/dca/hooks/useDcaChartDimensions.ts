import { useEffect, useRef, useState } from "react";
import type { ChartDimensions } from "@/features/dca/types/chart";

interface UseDcaChartDimensionsResult {
  ref: React.RefObject<HTMLDivElement | null>;
  dims: ChartDimensions;
}

/** วัดขนาดของ container ด้วย ResizeObserver สำหรับพื้นที่วาดกราฟ */
export const useDcaChartDimensions = (): UseDcaChartDimensionsResult => {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<ChartDimensions>({ w: 800, h: 280 });

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDims({ w: width, h: height });
        }
      }
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return { ref, dims };
};

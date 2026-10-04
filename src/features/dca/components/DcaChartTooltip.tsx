import type { RefObject } from "react";
import { fmtDate } from "@/features/dca/helpers/dca-chart-format";
import type {
  ChartTooltipRow,
  EnrichedPoint,
} from "@/features/dca/types/chart";

interface DcaChartTooltipProps {
  hovered: EnrichedPoint;
  rows: ChartTooltipRow[];
  tooltipRef: RefObject<HTMLDivElement | null>;
  left: number;
  top: number;
  width: number;
}

/** กล่อง tooltip ลอยแสดงค่ารายวันของจุดที่ชี้อยู่ */
export const DcaChartTooltip = ({
  hovered,
  rows,
  tooltipRef,
  left,
  top,
  width,
}: DcaChartTooltipProps) => (
  <div
    ref={tooltipRef}
    className="dca-tooltip dca-tooltip-visible"
    style={{
      left,
      top,
      transform: "translate(0, 0)",
      width,
      maxWidth: width,
    }}
  >
    <div className="border-border mb-1 border-b pb-1">
      {fmtDate(hovered.date)}
    </div>
    {rows.map((r) => (
      <div className="flex justify-between gap-4" key={r.lbl}>
        <span className="opacity-70">{r.lbl}</span>
        <span>{r.val}</span>
      </div>
    ))}
  </div>
);

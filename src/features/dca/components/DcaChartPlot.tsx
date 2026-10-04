import type { RefObject } from "react";
import { DcaChartCrosshair } from "@/features/dca/components/DcaChartCrosshair";
import { DcaChartGrid } from "@/features/dca/components/DcaChartGrid";
import { DcaChartSeries } from "@/features/dca/components/DcaChartSeries";
import { DcaChartTooltip } from "@/features/dca/components/DcaChartTooltip";
import type { TooltipLayout } from "@/features/dca/helpers/dca-chart-geometry";
import type { ChartGeometry } from "@/features/dca/helpers/dca-chart-geometry";
import type {
  ChartMode,
  ChartTooltipRow,
  EnrichedPoint,
  SeriesItem,
} from "@/features/dca/types/chart";

interface DcaChartPlotProps {
  data: EnrichedPoint[];
  series: SeriesItem[];
  mode: ChartMode;
  geometry: ChartGeometry;
  activeIdx: number | null;
  hovered: EnrichedPoint | null;
  tooltipRows: ChartTooltipRow[];
  tooltipLayout: TooltipLayout;
  isTouchDevice: boolean;
  chartAreaRef: RefObject<HTMLDivElement | null>;
  tooltipRef: RefObject<HTMLDivElement | null>;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseLeave: () => void;
  onPointerInspect: (e: React.PointerEvent<SVGSVGElement>) => void;
}

/** พื้นที่วาดกราฟ SVG พร้อม tooltip */
export const DcaChartPlot = ({
  data,
  series,
  mode,
  geometry,
  activeIdx,
  hovered,
  tooltipRows,
  tooltipLayout,
  isTouchDevice,
  chartAreaRef,
  tooltipRef,
  onMouseMove,
  onMouseLeave,
  onPointerInspect,
}: DcaChartPlotProps) => (
  <div className="relative z-0 min-h-[220px] flex-1 overflow-hidden px-2 pb-2 sm:min-h-[320px] sm:px-3 sm:pb-3">
    <div ref={chartAreaRef} className="relative h-full w-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${geometry.w} ${geometry.h}`}
        preserveAspectRatio="none"
        className="block"
        style={{ touchAction: "pan-y" }}
        onMouseMove={isTouchDevice ? undefined : onMouseMove}
        onMouseLeave={isTouchDevice ? undefined : onMouseLeave}
        onPointerDown={onPointerInspect}
        onPointerMove={onPointerInspect}
      >
        <DcaChartGrid geometry={geometry} mode={mode} data={data} />
        <DcaChartSeries
          geometry={geometry}
          series={series}
          mode={mode}
          data={data}
        />
        <DcaChartCrosshair
          geometry={geometry}
          series={series}
          activeIdx={activeIdx}
        />
      </svg>
      {hovered && activeIdx !== null && (
        <DcaChartTooltip
          hovered={hovered}
          rows={tooltipRows}
          tooltipRef={tooltipRef}
          left={tooltipLayout.tooltipLeft}
          top={tooltipLayout.showTooltipBelow ? geometry.padT + 8 : 8}
          width={tooltipLayout.tooltipWidth}
        />
      )}
    </div>
  </div>
);

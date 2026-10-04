"use client";

import { DcaChartHeader } from "@/features/dca/components/DcaChartHeader";
import { DcaChartLegend } from "@/features/dca/components/DcaChartLegend";
import { DcaChartPlot } from "@/features/dca/components/DcaChartPlot";
import { useDcaChart } from "@/features/dca/hooks/useDcaChart";
import type { DcaOrder } from "@/features/dca/types";

interface DcaChartCardProps {
  orders: DcaOrder[];
  currentPrice: number | null;
}

export const DcaChartCard = ({ orders, currentPrice }: DcaChartCardProps) => {
  const chart = useDcaChart({ orders, currentPrice });

  return (
    <div
      id="dca-chart-card"
      className="bg-card border-border flex h-full w-full flex-col overflow-hidden rounded-lg border"
    >
      {/* Header tabs + timeframe */}
      <DcaChartHeader
        tabs={chart.tabs}
        mode={chart.mode}
        onModeChange={chart.handleModeChange}
        timeframe={chart.timeframe}
        onTimeframeChange={chart.handleTimeframeChange}
      />

      {chart.data.length === 0 ? (
        <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm sm:h-[300px]">
          {chart.t.chart.addFirstBuy}
        </div>
      ) : (
        <>
          {/* Legend */}
          <DcaChartLegend series={chart.series} />

          {/* Chart area */}
          <DcaChartPlot
            data={chart.data}
            series={chart.series}
            mode={chart.mode}
            geometry={chart.geometry}
            activeIdx={chart.activeIdx}
            hovered={chart.hovered}
            tooltipRows={chart.tooltipRows}
            tooltipLayout={chart.tooltipLayout}
            isTouchDevice={chart.isTouchDevice}
            chartAreaRef={chart.chartAreaRef}
            tooltipRef={chart.tooltipRef}
            onMouseMove={chart.handleMouseMove}
            onMouseLeave={chart.handleMouseLeave}
            onPointerInspect={chart.handlePointerInspect}
          />
        </>
      )}
    </div>
  );
};

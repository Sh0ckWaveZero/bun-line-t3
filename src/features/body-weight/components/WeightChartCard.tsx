"use client";

import { useMemo } from "react";
import { areaY, d3Curve, defineChart, lineY } from "@tanstack/charts";
import { curveMonotoneX } from "d3-shape";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/charts/react";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { ScaleMeasurementDto } from "@/features/body-weight/types";

const MONOTONE_X = d3Curve(curveMonotoneX);

const bangkokDayFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Bangkok",
});

const CHART_DAYS = 90;

/**
 * จุดกราฟ: 1 จุดต่อวัน (เก็บผลชั่งท้ายวัน) เรียงเก่า → ใหม่
 * — scalePoint ใช้ label เป็นตำแหน่ง จึงต้องไม่มี label ซ้ำ
 */
const buildPoints = (measurements: ScaleMeasurementDto[]) => {
  const byDay = new Map<string, number>();
  const now = Date.now();
  const cutoff = now - CHART_DAYS * 24 * 60 * 60 * 1000;
  for (const m of [...measurements].reverse()) {
    const at = new Date(m.measuredAt).getTime();
    if (at < cutoff) continue;
    const day = m.measuredAt.slice(0, 10);
    byDay.set(day, m.weightKg);
  }
  return [...byDay.entries()].map(([day, weightKg]) => ({
    label: bangkokDayFormatter.format(new Date(`${day}T00:00:00Z`)),
    value: weightKg,
  }));
};

export function WeightChartCard({
  measurements,
}: {
  measurements: ScaleMeasurementDto[];
}) {
  const { isDark, chartTheme } = useChartTheme();
  const lineColor = isDark ? "#34d399" : "#059669";

  const points = useMemo(() => buildPoints(measurements), [measurements]);

  const definition = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map((point) => point.value);
    const valueMin = Math.min(...values);
    const valueMax = Math.max(...values);
    // กันชนแกน y — ถ้าเริ่มที่ 0 การเปลี่ยนแปลงไม่กี่ กก. จะมองแทบไม่เห็น
    const pad = Math.max(0.5, (valueMax - valueMin) * 0.2);

    return defineChart({
      theme: chartTheme,
      margin: { top: 12, right: 12, bottom: 24, left: 38 },
      marks: [
        areaY(points, {
          x: "label",
          y: "value",
          fill: lineColor,
          fillOpacity: 0.12,
          curve: MONOTONE_X,
        }),
        lineY(points, {
          x: "label",
          y: "value",
          stroke: lineColor,
          strokeWidth: 2.5,
          curve: MONOTONE_X,
          points: true,
        }),
      ],
      scales: {
        x: {
          scale: scalePoint<string>().domain(
            points.map((point) => point.label),
          ),
          axis: {
            line: false,
            ticks: false,
            tickLabels: { fontSize: 10, thin: true },
          },
        },
        y: {
          scale: scaleLinear().domain([valueMin - pad, valueMax + pad]),
          grid: true,
          axis: {
            line: false,
            ticks: {
              count: 4,
              format: (value: number) => value.toFixed(1),
              line: false,
            },
            tickLabels: { fontSize: 10 },
          },
        },
      },
      tooltip: {
        use: tooltip,
        format: (point) =>
          `${point.datum.label}: ${point.datum.value.toFixed(2)} กก.`,
      },
    });
  }, [points, chartTheme, lineColor]);

  return (
    <div className="bg-card border-border flex h-full min-h-[270px] flex-col rounded-lg border sm:min-h-[410px]">
      <div className="border-border flex items-center justify-between gap-3 border-b px-3 py-3 sm:px-5">
        <div>
          <h3 className="text-foreground text-sm font-semibold">
            น้ำหนัก {CHART_DAYS} วันล่าสุด
          </h3>
          <p className="text-muted-foreground font-mono text-[11px]">
            {points.length > 0
              ? `${points.length} วันที่มีการชั่ง`
              : "ยังไม่มีข้อมูล"}
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1 p-3 sm:p-4">
        {definition === null ? (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            ขึ้นตาชั่งเพื่อเริ่มบันทึก — ข้อมูลจะเข้าทันทีผ่าน webhook
          </div>
        ) : (
          <div className="relative h-full w-full">
            {/* host ของ <Chart> default สูง 320px — บังคับเต็มพื้นที่ parent เสมอ */}
            <Chart
              definition={definition}
              ariaLabel="กราฟน้ำหนักตัว 90 วันล่าสุด"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

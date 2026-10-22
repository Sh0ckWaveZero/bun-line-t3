"use client";

import { useMemo } from "react";
import { d3Curve, defineChart, dot, lineY } from "@tanstack/charts";
import { curveMonotoneX } from "d3-shape";
import { scaleUtc } from "d3-scale";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/charts/react";
import { useChartTheme } from "@/hooks/useChartTheme";
import { CHART_RANGES } from "@/features/body-weight/constants/metrics";
import {
  buildDailySeries,
  movingAverage,
  type ChartPoint,
} from "@/features/body-weight/helpers/weigh-in-stats";
import type { ScaleMeasurementDto } from "@/features/body-weight/types";

const MONOTONE_X = d3Curve(curveMonotoneX);

/** แกน x เป็น UTC เที่ยงคืนของวันกรุงเทพ — format ด้วย UTC เพื่อไม่ให้วันเลื่อน */
const dayFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const dayYearFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

/** ค่า CSS variable ของธีม (เช่น oklch(...)) — SSR ไม่มี document จึงใช้ fallback */
const readCssVar = (name: string, fallback: string): string => {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

interface SeriesDatum extends ChartPoint {
  series: string;
  unit: string;
}

const withSeries = (
  points: ChartPoint[],
  series: string,
  unit: string,
): SeriesDatum[] => points.map((point) => ({ ...point, series, unit }));

/** ขอบแกน y — ถ้าเริ่มที่ 0 การเปลี่ยนแปลงไม่กี่หน่วยจะมองแทบไม่เห็น */
const paddedDomain = (values: number[], minPad: number): [number, number] => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(minPad, (max - min) * 0.15);
  return [min - pad, max + pad];
};

const LegendItem = ({
  color,
  label,
  variant,
}: {
  color: string;
  label: string;
  variant: "dot" | "line" | "dashed";
}) => (
  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
    {variant === "dot" ? (
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    ) : (
      <span
        className="w-4 border-t-2"
        style={{
          borderColor: color,
          borderStyle: variant === "dashed" ? "dashed" : "solid",
        }}
      />
    )}
    {label}
  </span>
);

/**
 * กราฟน้ำหนัก (จุดรายวัน + เฉลี่ย 7 วัน) และไขมันแยกกราฟเล็กใต้กัน แกน x ตรงกัน
 * — แยก 2 กราฟแทนแกน y คู่ เพราะแกนคู่ชวนให้อ่านว่าสองค่าขยับตามกัน
 */
export function WeightChartCard({
  measurements,
  rangeDays,
  onRangeDaysChange,
}: {
  /** ของคนที่เลือก เรียงใหม่ → เก่า */
  measurements: ScaleMeasurementDto[];
  rangeDays: number | null;
  onRangeDaysChange: (days: number | null) => void;
}) {
  const { isDark, chartTheme } = useChartTheme();
  // สีจาก token ธีม (--chart-1 ม่วง / --chart-2 ชมพู) — อ่านใหม่เมื่อสลับ dark mode
  const { weightColor, averageColor, fatColor } = useMemo(
    () => ({
      weightColor: readCssVar("--muted-foreground", isDark ? "#94a3b8" : "#64748b"),
      averageColor: readCssVar("--brand", isDark ? "#c084fc" : "#cc66ff"),
      fatColor: readCssVar("--chart-2", isDark ? "#f0a6c0" : "#d98aa8"),
    }),
    [isDark],
  );

  const { weight, average, bodyFat } = useMemo(() => {
    const weightPoints = buildDailySeries(
      measurements,
      (m) => m.weightKg,
      rangeDays,
    );
    return {
      weight: withSeries(weightPoints, "น้ำหนัก", "กก."),
      average: withSeries(movingAverage(weightPoints), "เฉลี่ย 7 วัน", "กก."),
      bodyFat: withSeries(
        buildDailySeries(
          measurements,
          (m) => m.metrics?.bodyFat ?? null,
          rangeDays,
        ),
        "ไขมัน",
        "%",
      ),
    };
  }, [measurements, rangeDays]);

  const xDomain = useMemo((): [Date, Date] | null => {
    const times = [...weight, ...bodyFat].map((p) => p.date.getTime());
    if (times.length === 0) return null;
    const min = Math.min(...times);
    const max = Math.max(...times);
    // จุดเดียว — กางแกนออกข้างละวันให้จุดไม่ติดขอบ
    const pad = min === max ? 24 * 60 * 60 * 1000 : 0;
    return [new Date(min - pad), new Date(max + pad)];
  }, [weight, bodyFat]);

  const spansYears = useMemo(() => {
    if (!xDomain) return false;
    return xDomain[0].getUTCFullYear() !== xDomain[1].getUTCFullYear();
  }, [xDomain]);

  // factory แทน instance — แต่ละกราฟได้ scale ของตัวเอง (range ไม่ชนกัน)
  const xScale = useMemo(
    () => ({
      scale: () => scaleUtc().domain(xDomain ?? [new Date(0), new Date(1)]),
      axis: {
        line: false,
        ticks: {
          count: 5,
          format: (value: Date) =>
            (spansYears ? dayYearFormatter : dayFormatter).format(value),
          line: false,
        },
        tickLabels: { fontSize: 10, thin: true },
      },
    }) as const,
    [xDomain, spansYears],
  );

  const tooltipOptions = useMemo(
    () => ({
      use: tooltip,
      format: (point: { datum: SeriesDatum }) =>
        `${dayYearFormatter.format(point.datum.date)} · ${point.datum.series} ${point.datum.value.toFixed(
          point.datum.unit === "%" ? 1 : 2,
        )} ${point.datum.unit}`,
    }),
    [],
  );

  const weightChart = useMemo(() => {
    if (weight.length === 0) return null;
    return defineChart({
      theme: chartTheme,
      margin: { top: 12, right: 12, bottom: 24, left: 40 },
      marks: [
        dot(weight, {
          x: "date",
          y: "value",
          r: 3,
          fill: weightColor,
          fillOpacity: 0.85,
        }),
        lineY(average, {
          x: "date",
          y: "value",
          stroke: averageColor,
          strokeWidth: 2.5,
          curve: MONOTONE_X,
        }),
      ],
      scales: {
        x: xScale,
        y: {
          scale: scaleLinear().domain(
            paddedDomain(
              weight.map((p) => p.value),
              0.5,
            ),
          ),
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
      tooltip: tooltipOptions,
    });
  }, [
    weight,
    average,
    chartTheme,
    weightColor,
    averageColor,
    xScale,
    tooltipOptions,
  ]);

  const fatChart = useMemo(() => {
    if (bodyFat.length === 0) return null;
    return defineChart({
      theme: chartTheme,
      margin: { top: 8, right: 12, bottom: 24, left: 40 },
      marks: [
        lineY(bodyFat, {
          x: "date",
          y: "value",
          stroke: fatColor,
          strokeWidth: 2,
          curve: MONOTONE_X,
          points: true,
        }),
      ],
      scales: {
        x: xScale,
        y: {
          scale: scaleLinear().domain(
            paddedDomain(
              bodyFat.map((p) => p.value),
              0.3,
            ),
          ),
          grid: true,
          axis: {
            line: false,
            ticks: {
              count: 3,
              format: (value: number) => value.toFixed(1),
              line: false,
            },
            tickLabels: { fontSize: 10 },
          },
        },
      },
      tooltip: tooltipOptions,
    });
  }, [bodyFat, chartTheme, fatColor, xScale, tooltipOptions]);

  const chartStyle = {
    position: "absolute" as const,
    inset: 0,
    width: "100%",
    height: "100%",
  };

  return (
    <div className="bg-card border-border flex flex-col rounded-lg border">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-3 py-3 sm:px-5">
        <div>
          <h3 className="text-foreground text-sm font-semibold">น้ำหนัก</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <LegendItem color={weightColor} label="น้ำหนัก (กก.)" variant="dot" />
            <LegendItem color={averageColor} label="เฉลี่ย 7 วัน" variant="line" />
            <LegendItem color={fatColor} label="ไขมัน (%)" variant="line" />
          </div>
        </div>
        <div role="group" aria-label="ช่วงเวลา" className="flex gap-1">
          {CHART_RANGES.map((range) => {
            const isActive = range.days === rangeDays;
            return (
              <button
                key={range.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => onRangeDaysChange(range.days)}
                className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors ${
                  isActive
                    ? "border-(--brand) bg-(--brand)/15 text-foreground font-medium"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {weightChart === null ? (
          <div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
            ไม่มีการชั่งในช่วงนี้
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative h-[220px] w-full sm:h-[280px]">
              {/* host ของ <Chart> default สูง 320px — บังคับเต็มพื้นที่ parent เสมอ */}
              <Chart
                definition={weightChart}
                ariaLabel="กราฟน้ำหนักรายวันและค่าเฉลี่ย 7 วัน"
                style={chartStyle}
              />
            </div>
            <div>
              <p className="text-muted-foreground px-1 font-mono text-[11px]">
                ไขมัน (%)
              </p>
              {fatChart === null ? (
                <p className="text-muted-foreground px-1 py-4 text-xs">
                  ยังไม่มีค่าไขมันในช่วงนี้ — ต้องมี impedance และส่วนสูง/วันเกิดในโปรไฟล์
                </p>
              ) : (
                <div className="relative h-[120px] w-full sm:h-[140px]">
                  <Chart
                    definition={fatChart}
                    ariaLabel="กราฟเปอร์เซ็นต์ไขมันรายวัน"
                    style={chartStyle}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

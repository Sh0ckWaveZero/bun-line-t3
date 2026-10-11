"use client";

import { useMemo } from "react";
import {
  areaY,
  barY,
  defineChart,
  d3Curve,
  lineY,
  ruleY,
} from "@tanstack/charts";
import { curveMonotoneX } from "d3-shape";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scalePoint } from "@tanstack/charts/scales/point";
import { pie, polar, radialArc } from "@tanstack/charts/polar";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/charts/react";
import { useChartTheme } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";

/** เส้นโค้งแบบ monotone-x ใช้ร่วมกันทั้งไฟล์ */
const MONOTONE_X = d3Curve(curveMonotoneX);

/* ------------------------------------------------------------------ */
/* Line chart — เส้น + พื้นที่ใต้เส้น + เส้นเป้าหมายประ                  */
/* ------------------------------------------------------------------ */

export interface LineChartPoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  points: LineChartPoint[];
  /** เส้นเป้าหมายแนวนอนแบบเส้นประ (เช่น 9 ชม.) */
  targetLine?: number;
  yMax?: number;
  formatValue?: (value: number) => string;
  ariaLabel: string;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  points,
  targetLine,
  yMax,
  formatValue,
  ariaLabel,
  className,
}) => {
  const { isDark, chartTheme } = useChartTheme();
  const lineColor = isDark ? "#60a5fa" : "#2563eb";
  const targetColor = isDark ? "#2dd4bf" : "#0d9488";

  const definition = useMemo(() => {
    if (points.length === 0) return null;
    const max = yMax ?? Math.max(10, ...points.map((point) => point.value));
    const fmt = formatValue ?? ((value: number) => `${value}`);

    return defineChart({
      theme: chartTheme,
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
        ...(targetLine === undefined
          ? []
          : [
              ruleY([targetLine], {
                stroke: targetColor,
                strokeWidth: 1.5,
                strokeDasharray: "6 4",
              }),
            ]),
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
          scale: scaleLinear().domain([0, max]),
          grid: true,
          axis: {
            line: false,
            ticks: { count: 4, format: fmt, line: false },
            tickLabels: { fontSize: 10 },
          },
        },
      },
      tooltip: {
        use: tooltip,
        format: (point) => `${point.datum.label}: ${fmt(point.datum.value)}`,
      },
    });
  }, [
    points,
    targetLine,
    yMax,
    formatValue,
    chartTheme,
    lineColor,
    targetColor,
  ]);

  if (!definition) return null;

  return (
    <div className={cn("relative h-full w-full", className)}>
      {/* host ของ <Chart> default สูง 320px — บังคับเต็มพื้นที่ parent เสมอ */}
      <Chart
        definition={definition}
        ariaLabel={ariaLabel}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Bar chart — แท่งแนวตั้ง รองรับหลาย series (grouped)                  */
/* ------------------------------------------------------------------ */

export interface BarChartSeries {
  label: string;
  values: number[];
  color: string;
}

export interface BarChartProps {
  labels: string[];
  series: BarChartSeries[];
  yMax?: number;
  /** สีรายแท่ง (override สีของ series) — ยาวเท่ากับ labels */
  barColors?: readonly string[];
  formatValue?: (value: number) => string;
  formatYTick?: (value: number) => string;
  showLegend?: boolean;
  tooltipDisabled?: boolean;
  ariaLabel: string;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  labels,
  series,
  yMax,
  barColors,
  formatValue,
  formatYTick,
  showLegend,
  tooltipDisabled,
  ariaLabel,
  className,
}) => {
  const { chartTheme } = useChartTheme();

  const definition = useMemo(() => {
    if (labels.length === 0 || series.length === 0) return null;

    const rows = labels.flatMap((label, index) =>
      series.map((item) => ({
        label,
        series: item.label,
        value: item.values[index] ?? 0,
      })),
    );

    const values = rows.map((row) => row.value);
    const max =
      yMax ?? Math.max(10, ...values.filter((value) => Number.isFinite(value)));
    const fmt = formatValue ?? ((value: number) => `${value}`);
    const yFmt = formatYTick ?? fmt;
    const perLabelColor = barColors !== undefined;

    return defineChart({
      theme: chartTheme,
      color: perLabelColor
        ? { domain: labels, range: barColors }
        : {
            domain: series.map((item) => item.label),
            range: series.map((item) => item.color),
          },
      marks: [
        barY(rows, {
          x: "label",
          y: "value",
          ...(perLabelColor
            ? { color: "label" }
            : { z: "series", color: "series" }),
          radius: [4, 4, 0, 0],
          inset: series.length > 1 ? 3 : 8,
        }),
      ],
      scales: {
        x: {
          scale: scaleBand<string>().domain(labels),
          axis: {
            line: false,
            ticks: false,
            tickLabels: { fontSize: 10, thin: true },
          },
        },
        y: {
          scale: scaleLinear().domain([0, max]),
          grid: true,
          axis: {
            line: false,
            ticks: { count: 4, format: yFmt, line: false },
            tickLabels: { fontSize: 10 },
          },
        },
      },
      tooltip: tooltipDisabled
        ? false
        : {
            use: tooltip,
            format: (point) =>
              `${point.datum.series}: ${fmt(point.datum.value)}`,
          },
    });
  }, [
    labels,
    series,
    yMax,
    barColors,
    formatValue,
    formatYTick,
    tooltipDisabled,
    chartTheme,
  ]);

  if (!definition) return null;
  const withLegend = showLegend ?? series.length > 1;

  return (
    <div className={cn("flex h-full w-full flex-col", className)}>
      <div className="relative min-h-0 flex-1">
        <Chart
          definition={definition}
          ariaLabel={ariaLabel}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
      {withLegend && (
        <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {series.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400"
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Doughnut chart — วงกลมโป่ง + ข้อความกลาง + legend แบบ HTML           */
/* ------------------------------------------------------------------ */

export interface DoughnutSlice {
  label: string;
  value: number;
  color: string;
}

export interface DoughnutChartProps {
  slices: DoughnutSlice[];
  centerValue?: string;
  centerLabel?: string;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  tooltipDisabled?: boolean;
  ariaLabel: string;
  className?: string;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  slices,
  centerValue,
  centerLabel,
  showLegend = true,
  formatValue,
  tooltipDisabled,
  ariaLabel,
  className,
}) => {
  const { isDark, chartTheme } = useChartTheme();
  const sliceGapColor = isDark ? "#151719" : "#ffffff";

  const total = useMemo(
    () => slices.reduce((sum, slice) => sum + slice.value, 0),
    [slices],
  );

  const definition = useMemo(() => {
    if (slices.length === 0 || total <= 0) return null;
    const visible = slices.filter((slice) => slice.value > 0);
    const fmt = formatValue ?? ((value: number) => `${value}`);

    return defineChart({
      theme: chartTheme,
      color: {
        domain: visible.map((slice) => slice.label),
        range: visible.map((slice) => slice.color),
      },
      marks: [
        polar({
          inset: 4,
          scales: { angle: null, radius: null },
          marks: [
            radialArc(pie(visible, { value: "value" }), {
              key: "label",
              innerRadius: ({ radius }) => radius * 0.64,
              cornerRadius: 3,
              color: "label",
              stroke: sliceGapColor,
              strokeWidth: 2,
            }),
          ],
        }),
      ],
      scales: { x: null, y: null, angle: null, radius: null },
      tooltip: tooltipDisabled
        ? false
        : {
            use: tooltip,
            format: (point) => {
              const fraction = point.datum.fraction * 100;
              return `${point.datum.label}: ${fmt(point.datum.value)} (${fraction.toFixed(1)}%)`;
            },
          },
    });
  }, [slices, total, formatValue, tooltipDisabled, sliceGapColor, chartTheme]);

  if (!definition) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center text-sm text-slate-400 dark:text-slate-500",
          className,
        )}
      >
        ไม่มีข้อมูล
      </div>
    );
  }

  return (
    <div className={cn("flex h-full w-full flex-col", className)}>
      <div className="relative min-h-0 flex-1">
        <Chart
          definition={definition}
          ariaLabel={ariaLabel}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
        {centerValue && (
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
            aria-hidden="true"
          >
            <span className="font-mono text-xl font-semibold text-slate-900 dark:text-white">
              {centerValue}
            </span>
            {centerLabel && (
              <span className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>
      {showLegend && (
        <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {slices.map((slice) => (
            <li
              key={slice.label}
              className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400"
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden="true"
              />
              {slice.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

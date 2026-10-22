"use client";

import {
  COMPARE_OPTIONS,
  METRIC_DEFINITIONS,
  type MetricDefinition,
} from "@/features/body-weight/constants/metrics";
import {
  compareMetric,
  findReferenceMeasurement,
  type MetricTrendResult,
} from "@/features/body-weight/helpers/weigh-in-stats";
import type { ScaleMeasurementDto } from "@/features/body-weight/types";

const bangkokDateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

const formatNumber = (value: number, decimals: number) =>
  value.toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const TONE_CLASS: Record<MetricTrendResult["tone"], string> = {
  good: "text-emerald-700 dark:text-emerald-400",
  bad: "text-red-700 dark:text-red-400",
  neutral: "text-muted-foreground",
};

const TONE_LABEL: Record<MetricTrendResult["tone"], string> = {
  good: "ดีขึ้น",
  bad: "แย่ลง",
  neutral: "",
};

const TrendBadge = ({
  trend,
  decimals,
}: {
  trend: MetricTrendResult | null;
  decimals: number;
}) => {
  if (!trend) return null;
  if (trend.direction === "same") {
    return (
      <span className="text-muted-foreground font-mono text-xs" title="เท่าเดิม">
        =
      </span>
    );
  }
  const arrow = trend.direction === "up" ? "▲" : "▼";
  const toneLabel = TONE_LABEL[trend.tone];
  return (
    <span
      className={`font-mono text-xs font-semibold whitespace-nowrap ${TONE_CLASS[trend.tone]}`}
      aria-label={`${trend.direction === "up" ? "เพิ่มขึ้น" : "ลดลง"} ${formatNumber(trend.amount, decimals)}${toneLabel ? ` (${toneLabel})` : ""}`}
    >
      {arrow} {formatNumber(trend.amount, decimals)}
    </span>
  );
};

const MetricCard = ({
  definition,
  current,
  reference,
}: {
  definition: MetricDefinition;
  current: ScaleMeasurementDto;
  reference: ScaleMeasurementDto | null;
}) => {
  const value = definition.read(current);
  const trend = compareMetric(
    value,
    reference ? definition.read(reference) : null,
    definition.decimals,
    definition.trend,
  );
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-foreground font-mono text-base font-semibold tracking-tight sm:text-lg">
          {value === null
            ? "—"
            : `${formatNumber(value, definition.decimals)}${definition.unit ? ` ${definition.unit}` : ""}`}
        </span>
        <TrendBadge trend={trend} decimals={definition.decimals} />
      </div>
      <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
        <definition.icon className="text-(--brand) h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {definition.label}
      </p>
    </div>
  );
};

/** การ์ดผลชั่งล่าสุด 11 metric พร้อม Δ (เขียว = ดี, แดง = แย่) แบบ miscale-dashboard */
export function WeightStatsCards({
  measurements,
  compareDays,
  onCompareDaysChange,
}: {
  /** ของคนที่เลือก เรียงใหม่ → เก่า */
  measurements: ScaleMeasurementDto[];
  compareDays: number;
  onCompareDaysChange: (days: number) => void;
}) {
  const latest = measurements[0];
  if (!latest) {
    return (
      <div className="bg-card border-border text-muted-foreground rounded-lg border p-6 text-center text-sm">
        ยังไม่มีข้อมูลการชั่ง
      </div>
    );
  }

  const reference = findReferenceMeasurement(measurements, latest, compareDays);
  const hasBodyComposition = latest.metrics.bmi !== undefined;

  return (
    <div className="bg-card border-border rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-muted-foreground font-mono text-[11px] font-medium tracking-wide">
          ผลชั่งล่าสุด ·{" "}
          {bangkokDateTimeFormatter.format(new Date(latest.measuredAt))}
        </h3>
        <div
          role="group"
          aria-label="เทียบกับ"
          className="flex items-center gap-1"
        >
          {COMPARE_OPTIONS.map((option) => {
            const isActive = option.days === compareDays;
            return (
              <button
                key={option.days}
                type="button"
                aria-pressed={isActive}
                onClick={() => onCompareDaysChange(option.days)}
                className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                  isActive
                    ? "border-(--brand) bg-(--brand)/15 text-foreground font-medium"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {METRIC_DEFINITIONS.map((definition) => (
          <MetricCard
            key={definition.key}
            definition={definition}
            current={latest}
            reference={reference}
          />
        ))}
      </div>

      <p className="text-muted-foreground mt-3 text-xs">
        {reference
          ? `ลูกศรเทียบกับ ${bangkokDateTimeFormatter.format(new Date(reference.measuredAt))} — เขียว = ดีขึ้น, แดง = แย่ลง`
          : compareDays > 0
            ? `ยังไม่มีการชั่งที่เก่ากว่า ${compareDays} วันให้เทียบ`
            : "ยังไม่มีการชั่งครั้งก่อนให้เทียบ"}
        {!hasBodyComposition &&
          " · เติมส่วนสูง/วันเกิดในโปรไฟล์เพื่อคำนวณสัดส่วนร่างกาย"}
      </p>
    </div>
  );
}

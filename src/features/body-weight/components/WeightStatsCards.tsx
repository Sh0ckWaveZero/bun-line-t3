"use client";

import type { ScaleMeasurementDto } from "@/features/body-weight/types";

const bangkokDateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

const StatCard = ({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: string;
  sub: string;
  valueClassName?: string;
}) => (
  <div className="bg-card border-border rounded-lg border p-4">
    <p className="text-muted-foreground font-mono text-[11px] tracking-wide">
      {label}
    </p>
    <p
      className={`mt-1.5 font-mono text-xl font-semibold tracking-tight sm:text-2xl ${valueClassName ?? "text-foreground"}`}
    >
      {value}
    </p>
    <p className="text-muted-foreground mt-1 truncate font-mono text-[11px]">
      {sub}
    </p>
  </div>
);

export function WeightStatsCards({
  measurements,
}: {
  measurements: ScaleMeasurementDto[];
}) {
  const latest = measurements[0];
  if (!latest) {
    return (
      <div className="bg-card border-border text-muted-foreground rounded-lg border p-6 text-center text-sm">
        ยังไม่มีข้อมูลการชั่ง
      </div>
    );
  }

  const previous = measurements.find(
    (m, index) => index > 0 && m.profileId === latest.profileId,
  );
  const deltaKg = previous ? latest.weightKg - previous.weightKg : null;
  const isDown = deltaKg !== null && deltaKg < 0;
  const deltaColor =
    deltaKg === null
      ? "text-foreground"
      : isDown
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400";

  const weekCutoff =
    new Date(latest.measuredAt).getTime() - 7 * 24 * 60 * 60 * 1000;
  const weekWeights = measurements
    .filter((m) => new Date(m.measuredAt).getTime() >= weekCutoff)
    .map((m) => m.weightKg);
  const weekAverage =
    weekWeights.length > 0
      ? weekWeights.reduce((sum, weight) => sum + weight, 0) /
        weekWeights.length
      : null;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="น้ำหนักล่าสุด"
        value={`${latest.weightKg.toFixed(2)} กก.`}
        sub={`${latest.profileName ?? "ไม่ระบุตัวตน"} · ${bangkokDateTimeFormatter.format(new Date(latest.measuredAt))}`}
      />
      <StatCard
        label="เทียบครั้งก่อน"
        value={
          deltaKg === null
            ? "—"
            : `${deltaKg >= 0 ? "+" : "−"}${Math.abs(deltaKg).toFixed(2)} กก.`
        }
        sub={
          previous
            ? `จาก ${bangkokDateTimeFormatter.format(new Date(previous.measuredAt))}`
            : "ยังไม่มีข้อมูลก่อนหน้า"
        }
        valueClassName={deltaColor}
      />
      <StatCard
        label="เฉลี่ย 7 วัน"
        value={weekAverage === null ? "—" : `${weekAverage.toFixed(2)} กก.`}
        sub={`จาก ${weekWeights.length} ครั้ง`}
      />
      <StatCard
        label="ไขมันล่าสุด"
        value={
          latest.metrics.bodyFat === undefined
            ? "—"
            : `${latest.metrics.bodyFat.toFixed(1)}%`
        }
        sub={
          latest.metrics.muscleMass === undefined
            ? "เติมส่วนสูง/วันเกิดในโปรไฟล์เพื่อคำนวณ"
            : `กล้ามเนื้อ ${latest.metrics.muscleMass.toFixed(2)} กก.`
        }
      />
    </div>
  );
}

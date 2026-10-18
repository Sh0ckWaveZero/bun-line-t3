"use client";

import { useMemo } from "react";
import type { ScaleMeasurementDto } from "@/features/body-weight/types";

const bangkokDateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

interface WeighInRow {
  measurement: ScaleMeasurementDto;
  /** ผลต่างกับการชั่งก่อนหน้าของโปรไฟล์เดียวกัน (null = ไม่มีข้อมูลเทียบ) */
  deltaKg: number | null;
}

/** เตรียมแถว: วัดผลต่างกับการชั่งก่อนหน้าของโปรไฟล์เดียวกัน */
const buildRows = (measurements: ScaleMeasurementDto[]): WeighInRow[] => {
  const lastByProfile = new Map<string, number>();
  return measurements.map((measurement) => {
    const key = measurement.profileId ?? "";
    const previous = lastByProfile.get(key);
    lastByProfile.set(key, measurement.weightKg);
    return {
      measurement,
      deltaKg: previous === undefined ? null : measurement.weightKg - previous,
    };
  });
};

const DeltaBadge = ({ deltaKg }: { deltaKg: number | null }) => {
  if (deltaKg === null) {
    return <span className="text-muted-foreground font-mono text-xs">—</span>;
  }
  const isDown = deltaKg < 0;
  return (
    <span
      className={`font-mono text-xs font-medium ${
        isDown
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      {deltaKg >= 0 ? "+" : "−"}
      {Math.abs(deltaKg).toFixed(2)}
    </span>
  );
};

export function WeighInTable({
  measurements,
}: {
  measurements: ScaleMeasurementDto[];
}) {
  const rows = useMemo(() => buildRows(measurements), [measurements]);

  return (
    <div className="bg-card border-border overflow-hidden rounded-lg border">
      {/* Mobile card view */}
      <div className="divide-border divide-y sm:hidden">
        {rows.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            ยังไม่มีประวัติการชั่ง
          </div>
        ) : (
          rows.map(({ measurement, deltaKg }) => (
            <div key={measurement.id} className="hover:bg-muted/40 px-3 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-muted text-foreground/70 rounded px-1.5 py-0.5 font-mono text-[10px]">
                    {measurement.profileName ?? "ไม่ระบุ"}
                  </span>
                  <span className="text-foreground text-xs">
                    {bangkokDateTimeFormatter.format(
                      new Date(measurement.measuredAt),
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-mono text-sm font-semibold">
                    {measurement.weightKg.toFixed(2)}
                  </span>
                  <DeltaBadge deltaKg={deltaKg} />
                </div>
              </div>
              <div className="text-muted-foreground mt-1.5 grid grid-cols-3 gap-x-3 font-mono text-[10px]">
                <div>
                  <span className="opacity-60">ไขมัน</span>
                  <div className="text-foreground text-[11px]">
                    {measurement.metrics.bodyFat === undefined
                      ? "—"
                      : `${measurement.metrics.bodyFat.toFixed(1)}%`}
                  </div>
                </div>
                <div>
                  <span className="opacity-60">กล้ามเนื้อ</span>
                  <div className="text-foreground text-[11px]">
                    {measurement.metrics.muscleMass === undefined
                      ? "—"
                      : `${measurement.metrics.muscleMass.toFixed(2)}`}
                  </div>
                </div>
                <div>
                  <span className="opacity-60">BMI</span>
                  <div className="text-foreground text-[11px]">
                    {measurement.metrics.bmi === undefined
                      ? "—"
                      : measurement.metrics.bmi.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-border border-b">
              {[
                "วันที่",
                "น้ำหนัก (กก.)",
                "Δ",
                "ไขมัน (%)",
                "กล้ามเนื้อ (กก.)",
                "BMI",
                "โปรไฟล์",
              ].map((header) => (
                <th
                  key={header}
                  className="text-muted-foreground px-4 py-2.5 text-left font-mono text-[11px] font-medium tracking-wide"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  ยังไม่มีประวัติการชั่ง
                </td>
              </tr>
            ) : (
              rows.map(({ measurement, deltaKg }) => (
                <tr
                  key={measurement.id}
                  className="border-border hover:bg-muted/40 border-b transition-colors last:border-b-0"
                >
                  <td className="text-foreground px-4 py-3 font-mono text-xs">
                    {bangkokDateTimeFormatter.format(
                      new Date(measurement.measuredAt),
                    )}
                  </td>
                  <td className="text-foreground px-4 py-3 font-mono text-xs font-semibold">
                    {measurement.weightKg.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <DeltaBadge deltaKg={deltaKg} />
                  </td>
                  <td className="text-foreground px-4 py-3 font-mono text-xs">
                    {measurement.metrics.bodyFat === undefined
                      ? "—"
                      : measurement.metrics.bodyFat.toFixed(1)}
                  </td>
                  <td className="text-foreground px-4 py-3 font-mono text-xs">
                    {measurement.metrics.muscleMass === undefined
                      ? "—"
                      : measurement.metrics.muscleMass.toFixed(2)}
                  </td>
                  <td className="text-foreground px-4 py-3 font-mono text-xs">
                    {measurement.metrics.bmi === undefined
                      ? "—"
                      : measurement.metrics.bmi.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-muted text-foreground/70 rounded px-1.5 py-0.5 font-mono text-[10px]">
                      {measurement.profileName ?? "ไม่ระบุ"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmMorph } from "@/components/ui/confirm-morph";
import { Select } from "@/components/ui/select";
import type {
  ScaleMeasurementDto,
  ScaleProfileDto,
} from "@/features/body-weight/types";

const PAGE_SIZE = 15;
/** ค่าใน Select แทน "ยังไม่ระบุเจ้าของ" (Select รับเฉพาะ string) */
const UNASSIGNED = "__unassigned__";

const bangkokDateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

const DELETE_LABELS = {
  label: "ลบ",
  prompt: "ลบการชั่งนี้หรือไม่?",
  description: "ลบออกจากประวัติถาวร กู้คืนไม่ได้",
  confirmLabel: "ลบ",
  holdLabel: "กดค้าง",
  holdReleaseLabel: "ปล่อย",
  holdInstruction:
    "กดค้างประมาณ 1.2 วินาทีจนแถบสีเต็ม แล้วปล่อยเพื่อยืนยันการลบ",
  holdCompleteLabel: "ปล่อยเพื่อยืนยันการลบ",
  cancelLabel: "ยกเลิก",
  pendingLabel: "กำลังลบ...",
  doneLabel: "ลบการชั่งแล้ว",
  doneDescription: "นำออกจากประวัติและกราฟแล้ว",
  errorLabel: "ลบการชั่งไม่สำเร็จ",
  retryLabel: "ลองอีกครั้ง",
} as const;

interface WeighInRow {
  measurement: ScaleMeasurementDto;
  /** ผลต่างกับการชั่งก่อนหน้าของโปรไฟล์เดียวกัน (null = ไม่มีข้อมูลเทียบ) */
  deltaKg: number | null;
}

/** เตรียมแถว: วัดผลต่างกับการชั่งก่อนหน้า (เก่ากว่า) ของโปรไฟล์เดียวกัน */
const buildRows = (measurements: ScaleMeasurementDto[]): WeighInRow[] =>
  measurements.map((measurement, index) => {
    const previous = measurements
      .slice(index + 1)
      .find((m) => m.profileId === measurement.profileId);
    return {
      measurement,
      deltaKg:
        previous && measurement.profileId !== null
          ? measurement.weightKg - previous.weightKg
          : null,
    };
  });

const formatMetric = (value: number | undefined, decimals: number) =>
  value === undefined ? "—" : value.toFixed(decimals);

const DeltaBadge = ({ deltaKg }: { deltaKg: number | null }) => {
  if (deltaKg === null) {
    return <span className="text-muted-foreground font-mono text-xs">—</span>;
  }
  if (Math.abs(deltaKg) < 0.005) {
    return <span className="text-muted-foreground font-mono text-xs">=</span>;
  }
  const isDown = deltaKg < 0;
  return (
    <span
      className={`font-mono text-xs font-medium ${
        isDown
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-red-700 dark:text-red-400"
      }`}
    >
      {isDown ? "−" : "+"}
      {Math.abs(deltaKg).toFixed(2)}
    </span>
  );
};

const OwnerSelect = ({
  measurement,
  options,
  isBusy,
  onChange,
}: {
  measurement: ScaleMeasurementDto;
  options: { value: string; label: string }[];
  isBusy: boolean;
  onChange: (profileId: string | null) => void;
}) => {
  const selectId = `owner-${measurement.id}`;
  return (
    <div className="w-32">
      <label htmlFor={selectId} className="sr-only">
        เจ้าของการชั่ง{" "}
        {bangkokDateTimeFormatter.format(new Date(measurement.measuredAt))}
      </label>
      <Select
        id={selectId}
        value={measurement.profileId ?? UNASSIGNED}
        options={options}
        disabled={isBusy}
        className="h-8 text-xs"
        onValueChange={(value) =>
          onChange(value === UNASSIGNED ? null : value)
        }
      />
    </div>
  );
};

export function WeighInTable({
  measurements,
  profiles,
  showEveryone,
  onShowEveryoneChange,
  busyMeasurementId,
  onReassign,
  onDelete,
}: {
  /** แถวที่จะแสดง เรียงใหม่ → เก่า */
  measurements: ScaleMeasurementDto[];
  profiles: ScaleProfileDto[];
  showEveryone: boolean;
  onShowEveryoneChange: (value: boolean) => void;
  busyMeasurementId: string | null;
  onReassign: (measurementId: string, profileId: string | null) => void;
  onDelete: (measurementId: string) => Promise<void>;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const rows = useMemo(() => buildRows(measurements), [measurements]);
  const visibleRows = rows.slice(0, visibleCount);
  const ownerOptions = useMemo(
    () => [
      { value: UNASSIGNED, label: "ไม่ระบุ" },
      ...profiles.map((profile) => ({ value: profile.id, label: profile.name })),
    ],
    [profiles],
  );

  const deleteButton = (measurement: ScaleMeasurementDto, inline: boolean) => (
    <ConfirmMorph
      {...DELETE_LABELS}
      ariaLabel={`ลบการชั่ง ${measurement.weightKg.toFixed(2)} กก. ${bangkokDateTimeFormatter.format(new Date(measurement.measuredAt))}`}
      onConfirm={() => onDelete(measurement.id)}
      showIdleLabel={inline}
      inline={inline}
    />
  );

  return (
    <div className="bg-card border-border overflow-hidden rounded-lg border">
      <div className="border-border flex items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4">
        <p className="text-muted-foreground font-mono text-[11px]">
          {rows.length} รายการ
        </p>
        <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox
            checked={showEveryone}
            onCheckedChange={(checked) => onShowEveryoneChange(checked === true)}
          />
          ทุกคน
        </label>
      </div>

      {/* Mobile card view */}
      <div className="divide-border divide-y sm:hidden">
        {visibleRows.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            ยังไม่มีประวัติการชั่ง
          </div>
        ) : (
          visibleRows.map(({ measurement, deltaKg }) => (
            <div key={measurement.id} className="px-3 py-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-xs">
                  {bangkokDateTimeFormatter.format(
                    new Date(measurement.measuredAt),
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-mono text-sm font-semibold">
                    {measurement.weightKg.toFixed(2)}
                  </span>
                  <DeltaBadge deltaKg={deltaKg} />
                </div>
              </div>
              <div className="text-muted-foreground mt-1.5 grid grid-cols-4 gap-x-3 font-mono text-[10px]">
                {[
                  ["ไขมัน", formatMetric(measurement.metrics.bodyFat, 1)],
                  ["กล้ามเนื้อ", formatMetric(measurement.metrics.muscleMass, 1)],
                  ["น้ำ", formatMetric(measurement.metrics.water, 1)],
                  [
                    "ช่องท้อง",
                    formatMetric(measurement.metrics.visceralFat, 1),
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <div className="text-foreground text-[11px]">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <OwnerSelect
                  measurement={measurement}
                  options={ownerOptions}
                  isBusy={busyMeasurementId === measurement.id}
                  onChange={(profileId) =>
                    onReassign(measurement.id, profileId)
                  }
                />
                {deleteButton(measurement, true)}
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
                "น้ำ (%)",
                "ไขมันช่องท้อง",
                "เจ้าของ",
              ].map((header) => (
                <th
                  key={header}
                  className="text-muted-foreground px-4 py-2.5 text-left font-mono text-[11px] font-medium tracking-wide"
                >
                  {header}
                </th>
              ))}
              <th className="px-4 py-2.5">
                <span className="sr-only">ลบ</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  ยังไม่มีประวัติการชั่ง
                </td>
              </tr>
            ) : (
              visibleRows.map(({ measurement, deltaKg }) => (
                <tr
                  key={measurement.id}
                  className="border-border hover:bg-muted/40 border-b transition-colors last:border-b-0"
                >
                  <td className="text-foreground px-4 py-2 font-mono text-xs">
                    {bangkokDateTimeFormatter.format(
                      new Date(measurement.measuredAt),
                    )}
                  </td>
                  <td className="text-foreground px-4 py-2 font-mono text-xs font-semibold">
                    {measurement.weightKg.toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    <DeltaBadge deltaKg={deltaKg} />
                  </td>
                  <td className="text-foreground px-4 py-2 font-mono text-xs">
                    {formatMetric(measurement.metrics.bodyFat, 1)}
                  </td>
                  <td className="text-foreground px-4 py-2 font-mono text-xs">
                    {formatMetric(measurement.metrics.muscleMass, 1)}
                  </td>
                  <td className="text-foreground px-4 py-2 font-mono text-xs">
                    {formatMetric(measurement.metrics.water, 1)}
                  </td>
                  <td className="text-foreground px-4 py-2 font-mono text-xs">
                    {formatMetric(measurement.metrics.visceralFat, 1)}
                  </td>
                  <td className="px-4 py-2">
                    <OwnerSelect
                      measurement={measurement}
                      options={ownerOptions}
                      isBusy={busyMeasurementId === measurement.id}
                      onChange={(profileId) =>
                        onReassign(measurement.id, profileId)
                      }
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {deleteButton(measurement, false)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > visibleCount && (
        <div className="border-border border-t">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="text-muted-foreground hover:bg-muted hover:text-foreground w-full cursor-pointer py-2.5 text-xs transition-colors"
          >
            แสดงเพิ่ม ({rows.length - visibleCount} รายการ)
          </button>
        </div>
      )}
    </div>
  );
}

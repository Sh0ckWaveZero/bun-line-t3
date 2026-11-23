"use client";

import React from "react";
import type {
  MonthlyAttendanceReport,
  AttendanceSummaryCardsProps,
} from "@/lib/types";
import { roundToOneDecimal } from "@/lib/utils/number";
import { cn } from "@/lib/utils";

/**
 * โครงกริดของการ์ดสรุป 5 ใบ — แชร์ให้ skeleton ใช้โครงเดียวกันเพื่อไม่ให้ขนาดเปลี่ยนตอนข้อมูลมา
 * มือถือ 2 คอลัมน์ (ใบสุดท้ายกว้างเต็มแถว) · sm แถวละ 3 แล้ว 2 · lg เรียงเท่ากัน 5 ใบ
 */
export const SUMMARY_GRID_CLASS =
  "grid grid-cols-2 gap-3 sm:grid-cols-6 lg:grid-cols-5";

export const SUMMARY_CARD_SPANS = [
  "sm:col-span-2 lg:col-span-1",
  "sm:col-span-2 lg:col-span-1",
  "sm:col-span-2 lg:col-span-1",
  "sm:col-span-3 lg:col-span-1",
  "col-span-2 sm:col-span-3 lg:col-span-1",
] as const;

interface SummaryItemData {
  label: string;
  value: string;
  sublabel?: string;
}

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({
  report,
}) => {
  const items: SummaryItemData[] = [
    {
      label: "วันที่ทำงาน",
      value: `${report.totalDaysWorked}`,
      sublabel: `จาก ${report.workingDaysInMonth} วัน`,
    },
    {
      label: "ชั่วโมงรวม",
      value: `${roundToOneDecimal(report.totalHoursWorked)}`,
      sublabel: "ชั่วโมง",
    },
    {
      label: "อัตราการเข้างาน",
      value: `${roundToOneDecimal(report.attendanceRate)}%`,
    },
    {
      label: "เฉลี่ย/วัน",
      value: `${roundToOneDecimal(report.averageHoursPerDay)}`,
      sublabel: "ชั่วโมง",
    },
    {
      label: "ครบเวลา",
      value: `${roundToOneDecimal(report.complianceRate)}%`,
      sublabel: `${report.completeDays} วัน ครบ 9 ชม.`,
    },
  ];

  return (
    <div
      className={cn(
        SUMMARY_GRID_CLASS,
        "border-b border-slate-200 px-5 py-5 sm:px-6 dark:border-white/[0.08]",
      )}
      role="region"
      aria-label="สรุปข้อมูลการเข้างาน"
    >
      {items.map((item, index) => (
        <SummaryItem
          key={item.label}
          label={item.label}
          value={item.value}
          sublabel={item.sublabel}
          className={SUMMARY_CARD_SPANS[index]}
        />
      ))}
    </div>
  );
};

const SummaryItem: React.FC<SummaryItemData & { className?: string }> = ({
  label,
  value,
  sublabel,
  className,
}) => (
  <div
    className={cn(
      "rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-3 sm:px-4 dark:border-white/[0.06] dark:bg-white/[0.02]",
      className,
    )}
  >
    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
      {label}
    </p>
    <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
      {value}
    </p>
    {sublabel && (
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        {sublabel}
      </p>
    )}
  </div>
);

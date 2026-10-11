"use client";

import React from "react";
import type {
  MonthlyAttendanceReport,
  AttendanceSummaryCardsProps,
} from "@/lib/types";
import { roundToOneDecimal } from "@/lib/utils/number";

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({
  report,
}) => {
  return (
    <div
      className="grid grid-cols-2 gap-3 border-b border-slate-200 px-5 py-5 sm:grid-cols-3 sm:px-6 lg:grid-cols-5 dark:border-white/[0.08]"
      role="region"
      aria-label="สรุปข้อมูลการเข้างาน"
    >
      <SummaryItem
        label="วันที่ทำงาน"
        value={`${report.totalDaysWorked}`}
        sublabel={`จาก ${report.workingDaysInMonth} วัน`}
      />
      <SummaryItem
        label="ชั่วโมงรวม"
        value={`${roundToOneDecimal(report.totalHoursWorked)}`}
        sublabel="ชั่วโมง"
      />
      <SummaryItem
        label="อัตราการเข้างาน"
        value={`${roundToOneDecimal(report.attendanceRate)}%`}
      />
      <SummaryItem
        label="เฉลี่ย/วัน"
        value={`${roundToOneDecimal(report.averageHoursPerDay)}`}
        sublabel="ชั่วโมง"
      />
      <SummaryItem
        label="ครบเวลา"
        value={`${roundToOneDecimal(report.complianceRate)}%`}
        sublabel={`${report.completeDays} วัน ครบ 9 ชม.`}
      />
    </div>
  );
};

const SummaryItem: React.FC<{
  label: string;
  value: string;
  sublabel?: string;
}> = ({ label, value, sublabel }) => (
  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
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

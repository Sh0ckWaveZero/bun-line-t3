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
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
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
  <div className="rounded-xl border border-border bg-card px-4 py-3">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-foreground">
      {value}
    </p>
    {sublabel && (
      <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
    )}
  </div>
);

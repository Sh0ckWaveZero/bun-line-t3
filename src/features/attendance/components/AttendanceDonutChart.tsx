"use client";

import React from "react";
import { LazyDoughnutChart } from "@/components/charts/LazyCharts";
import { useAttendanceDonutData } from "@/features/attendance/hooks/useAttendanceChartData";
import type { MonthlyAttendanceReport } from "@/lib/types/attendance";
import { roundToOneDecimal } from "@/lib/utils/number";

interface AttendanceDonutChartProps {
  report: MonthlyAttendanceReport;
}

export const AttendanceDonutChart: React.FC<AttendanceDonutChartProps> = ({
  report,
}) => {
  const slices = useAttendanceDonutData(report);

  const daysAbsent = report.workingDaysInMonth - report.totalDaysWorked;
  const isPerfect = daysAbsent === 0;

  if (isPerfect) {
    return (
      <div className="text-center">
        <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          เข้างานครบทุกวัน
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {report.totalDaysWorked} วัน จาก {report.workingDaysInMonth} วันทำงาน
        </p>
        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
          {report.attendanceRate}%
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto h-full w-full max-w-[280px]">
      <LazyDoughnutChart
        slices={slices}
        centerValue={`${roundToOneDecimal(report.attendanceRate)}%`}
        centerLabel="อัตราเข้างาน"
        ariaLabel="กราฟโดนัทสัดส่วนวันมาทำงานและวันขาดงาน"
      />
    </div>
  );
};

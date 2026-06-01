"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { useAttendanceDonutData } from "@/features/attendance/hooks/useAttendanceChartData";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { MonthlyAttendanceReport } from "@/lib/types/attendance";

interface AttendanceDonutChartProps {
  report: MonthlyAttendanceReport;
}

export const AttendanceDonutChart: React.FC<AttendanceDonutChartProps> = ({
  report,
}) => {
  const { getDoughnutOptions } = useChartTheme();
  const chartData = useAttendanceDonutData(report);

  const daysAbsent = report.workingDaysInMonth - report.totalDaysWorked;
  const isPerfect = daysAbsent === 0;

  if (isPerfect) {
    return (
      <div className="text-center">
        <p className="text-foreground mb-2 text-sm font-semibold">
          เข้างานครบทุกวัน
        </p>
        <p className="text-muted-foreground text-xs">
          {report.totalDaysWorked} วัน จาก {report.workingDaysInMonth} วันทำงาน
        </p>
        <p className="text-muted-foreground mt-1 font-mono text-xs">
          {report.attendanceRate}%
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto" style={{ width: "250px", height: "250px" }}>
      <Doughnut data={chartData} options={getDoughnutOptions()} />
    </div>
  );
};

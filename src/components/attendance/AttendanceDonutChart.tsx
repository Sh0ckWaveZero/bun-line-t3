"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { useAttendanceDonutData } from "@/hooks/useAttendanceChartData";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { MonthlyAttendanceReport } from "@/lib/types/attendance";

interface AttendanceDonutChartProps {
  report: MonthlyAttendanceReport;
}

/**
 * Attendance Donut Chart Component
 * Displays attendance rate (days attended vs days absent)
 * Shows special message when perfect attendance
 */
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
        <div className="mb-4 text-4xl">🏆</div>
        <h4 className="mb-2 text-lg font-bold text-green-600 dark:text-green-400">
          ยอดเยี่ยม!
        </h4>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          เข้างานครบทุกวันในเดือนนี้
        </p>
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-700 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-300">
            <strong>{report.totalDaysWorked}</strong> วัน จาก{" "}
            <strong>{report.workingDaysInMonth}</strong> วันทำงาน
          </p>
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
            อัตราการเข้างาน: {report.attendanceRate}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "250px",
        height: "250px",
        margin: "0 auto",
      }}
    >
      <Doughnut data={chartData} options={getDoughnutOptions()} />
    </div>
  );
};

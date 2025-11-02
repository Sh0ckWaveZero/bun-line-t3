"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { useComplianceDonutData } from "@/hooks/useAttendanceChartData";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { MonthlyAttendanceReport } from "@/lib/types/attendance";

interface ComplianceDonutChartProps {
  report: MonthlyAttendanceReport;
}

/**
 * Compliance Donut Chart Component
 * Displays hours compliance (days with full 9 hours vs incomplete days)
 * Shows special message when all days have full 9 hours
 */
export const ComplianceDonutChart: React.FC<ComplianceDonutChartProps> = ({
  report,
}) => {
  const { getDoughnutOptions } = useChartTheme();
  const chartData = useComplianceDonutData(report);

  const isFullCompliance =
    report.totalDaysWorked > 0 &&
    report.completeDays === report.totalDaysWorked;

  if (isFullCompliance) {
    return (
      <div className="text-center">
        <div className="mb-4 text-4xl">💪</div>
        <h4 className="mb-2 text-lg font-bold text-purple-600 dark:text-purple-400">
          สุดยอด!
        </h4>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          ทำงานครบ 9 ชั่วโมงทุกวัน
        </p>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-700 dark:bg-purple-900/20">
          <p className="text-sm text-purple-800 dark:text-purple-300">
            <strong>{report.completeDays}</strong> วัน จาก{" "}
            <strong>{report.totalDaysWorked}</strong> วันที่ทำงาน
          </p>
          <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
            อัตราการทำงานครบเวลา: {report.complianceRate}%
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

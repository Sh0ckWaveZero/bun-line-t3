"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { useComplianceDonutData } from "@/features/attendance/hooks/useAttendanceChartData";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { MonthlyAttendanceReport } from "@/lib/types/attendance";

interface ComplianceDonutChartProps {
  report: MonthlyAttendanceReport;
}

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
        <p className="text-foreground mb-2 text-sm font-semibold">
          ทำงานครบ 9 ชั่วโมงทุกวัน
        </p>
        <p className="text-muted-foreground text-xs">
          {report.completeDays} วัน จาก {report.totalDaysWorked} วันที่ทำงาน
        </p>
        <p className="text-muted-foreground mt-1 font-mono text-xs">
          อัตรา: {report.complianceRate}%
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

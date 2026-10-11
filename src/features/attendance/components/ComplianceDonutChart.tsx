"use client";

import React from "react";
import { LazyDoughnutChart } from "@/components/charts/LazyCharts";
import { useComplianceDonutData } from "@/features/attendance/hooks/useAttendanceChartData";
import type { MonthlyAttendanceReport } from "@/lib/types/attendance";
import { roundToOneDecimal } from "@/lib/utils/number";

interface ComplianceDonutChartProps {
  report: MonthlyAttendanceReport;
}

export const ComplianceDonutChart: React.FC<ComplianceDonutChartProps> = ({
  report,
}) => {
  const slices = useComplianceDonutData(report);

  const isFullCompliance =
    report.totalDaysWorked > 0 &&
    report.completeDays === report.totalDaysWorked;

  if (isFullCompliance) {
    return (
      <div className="text-center">
        <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          ทำงานครบ 9 ชั่วโมงทุกวัน
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {report.completeDays} วัน จาก {report.totalDaysWorked} วันที่ทำงาน
        </p>
        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
          อัตรา: {report.complianceRate}%
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto h-full w-full max-w-[280px]">
      <LazyDoughnutChart
        slices={slices}
        centerValue={`${roundToOneDecimal(report.complianceRate)}%`}
        centerLabel="ครบ 9 ชม."
        ariaLabel="กราฟโดนัทสัดส่วนวันทำงานครบ 9 ชั่วโมงและวันที่ไม่ครบ"
      />
    </div>
  );
};

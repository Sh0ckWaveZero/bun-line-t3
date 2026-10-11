"use client";

import React from "react";
import { AttendanceDonutChart } from "./AttendanceDonutChart";
import { ComplianceDonutChart } from "./ComplianceDonutChart";
import type { MonthlyAttendanceReport } from "@/lib/types/attendance";

interface StatisticsTabContentProps {
  report: MonthlyAttendanceReport;
}

export const StatisticsTabContent: React.FC<StatisticsTabContentProps> = ({
  report,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200/80 p-4 dark:border-white/[0.06]">
        <h3 className="mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          สัดส่วนการมาทำงาน
        </h3>
        <div className="flex h-64 flex-col justify-center">
          <AttendanceDonutChart report={report} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 p-4 dark:border-white/[0.06]">
        <h3 className="mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          การทำงานครบตามเวลา (9 ชม.)
        </h3>
        <div className="flex h-64 flex-col justify-center">
          <ComplianceDonutChart report={report} />
        </div>
      </div>
    </div>
  );
};

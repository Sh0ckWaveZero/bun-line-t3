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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="border-border bg-card rounded-xl border p-4">
        <h3 className="text-muted-foreground mb-4 text-sm font-medium">
          สัดส่วนการมาทำงาน
        </h3>
        <div className="flex h-64 flex-col justify-center">
          <AttendanceDonutChart report={report} />
        </div>
      </div>

      <div className="border-border bg-card rounded-xl border p-4">
        <h3 className="text-muted-foreground mb-4 text-sm font-medium">
          การทำงานครบตามเวลา (9 ชม.)
        </h3>
        <div className="flex h-64 flex-col justify-center">
          <ComplianceDonutChart report={report} />
        </div>
      </div>
    </div>
  );
};

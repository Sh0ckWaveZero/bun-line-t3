"use client";

import React from "react";
import { AttendanceDonutChart } from "./AttendanceDonutChart";
import { ComplianceDonutChart } from "./ComplianceDonutChart";
import type { MonthlyAttendanceReport } from "@/lib/types/attendance";

interface StatisticsTabContentProps {
  report: MonthlyAttendanceReport;
}

/**
 * Statistics Tab Content Component
 * Contains the attendance and compliance donut charts
 */
export const StatisticsTabContent: React.FC<StatisticsTabContentProps> = ({
  report,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Attendance donut chart */}
      <div className="bg-card-base border-theme-primary rounded-lg border p-4 shadow">
        <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
          สัดส่วนการมาทำงาน
        </h3>
        <div className="flex h-64 flex-col justify-center">
          <AttendanceDonutChart report={report} />
        </div>
      </div>

      {/* Compliance donut chart */}
      <div className="bg-card-base border-theme-primary rounded-lg border p-4 shadow">
        <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
          การทำงานครบตามเวลา (9 ชม.)
        </h3>
        <div className="flex h-64 flex-col justify-center">
          <ComplianceDonutChart report={report} />
        </div>
      </div>
    </div>
  );
};

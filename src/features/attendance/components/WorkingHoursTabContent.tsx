"use client";

import React from "react";
import { HoursWorkedChart } from "./HoursWorkedChart";
import { DailyAverageChart } from "./DailyAverageChart";
import type { AttendanceRecord } from "@/lib/types/attendance";

interface WorkingHoursTabContentProps {
  records: AttendanceRecord[];
}

/**
 * Working Hours Tab Content Component
 * Contains the hours worked line chart and daily average bar chart
 */
export const WorkingHoursTabContent: React.FC<WorkingHoursTabContentProps> = ({
  records,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Hours worked per day chart */}
      <div className="bg-card-base border-theme-primary rounded-lg border p-4 shadow">
        <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
          ชั่วโมงทำงานรายวัน
        </h3>
        <div className="h-64">
          <HoursWorkedChart records={records} />
        </div>
      </div>

      {/* Average hours by day of week */}
      <div className="bg-card-base border-theme-primary rounded-lg border p-4 shadow">
        <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
          ชั่วโมงทำงานเฉลี่ยตามวัน
        </h3>
        <div className="h-64">
          <DailyAverageChart records={records} />
        </div>
      </div>
    </div>
  );
};

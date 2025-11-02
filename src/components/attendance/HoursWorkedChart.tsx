"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import { useHoursChartData } from "@/hooks/useAttendanceChartData";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { AttendanceRecord } from "@/lib/types/attendance";

interface HoursWorkedChartProps {
  records: AttendanceRecord[];
}

/**
 * Hours Worked Chart Component
 * Displays a line chart showing hours worked per day with a target line
 */
export const HoursWorkedChart: React.FC<HoursWorkedChartProps> = ({
  records,
}) => {
  const { getChartOptions } = useChartTheme();
  const chartData = useHoursChartData(records);

  if (records.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 dark:text-gray-500">
        ไม่มีข้อมูลการทำงานสำหรับเดือนนี้
      </div>
    );
  }

  const maxHours = Math.max(
    10,
    ...records.map((r) => r.hoursWorked || 0),
  );

  return (
    <Line
      data={chartData}
      options={getChartOptions({
        scales: {
          y: {
            min: 0,
            max: maxHours,
          },
        },
      })}
    />
  );
};

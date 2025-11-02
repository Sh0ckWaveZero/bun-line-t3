"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import { useDailyAverageHoursData } from "@/hooks/useAttendanceChartData";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { AttendanceRecord } from "@/lib/types/attendance";

interface DailyAverageChartProps {
  records: AttendanceRecord[];
}

/**
 * Daily Average Hours Chart Component
 * Displays a bar chart showing average hours worked by day of week
 */
export const DailyAverageChart: React.FC<DailyAverageChartProps> = ({
  records,
}) => {
  const { getChartOptions } = useChartTheme();
  const chartData = useDailyAverageHoursData(records);

  if (records.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 dark:text-gray-500">
        ไม่มีข้อมูลการทำงานสำหรับเดือนนี้
      </div>
    );
  }

  return (
    <Bar
      data={chartData}
      options={getChartOptions({
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
          },
        },
      })}
    />
  );
};

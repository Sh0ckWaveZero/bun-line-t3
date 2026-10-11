"use client";

import React from "react";
import { LazyBarChart } from "@/components/charts/LazyCharts";
import { useDailyAverageHoursData } from "@/features/attendance/hooks/useAttendanceChartData";
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
  const { isDark } = useChartTheme();
  const { labels, values } = useDailyAverageHoursData(records);

  if (records.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        ไม่มีข้อมูลการทำงานสำหรับเดือนนี้
      </div>
    );
  }

  return (
    <LazyBarChart
      labels={labels}
      series={[
        {
          label: "ชั่วโมงทำงานเฉลี่ยตามวัน",
          values,
          color: isDark ? "#2dd4bf" : "#14b8a6",
        },
      ]}
      yMax={10}
      formatValue={(value) => `${value.toFixed(1)} ชม.`}
      ariaLabel="กราฟแท่งชั่วโมงทำงานเฉลี่ยแยกตามวันของสัปดาห์"
    />
  );
};

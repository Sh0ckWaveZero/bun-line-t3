"use client";

import React from "react";
import { LazyLineChart } from "@/components/charts/LazyCharts";
import { useHoursChartData } from "@/features/attendance/hooks/useAttendanceChartData";
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
  const { isDark } = useChartTheme();
  const points = useHoursChartData(records);

  if (records.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        ไม่มีข้อมูลการทำงานสำหรับเดือนนี้
      </div>
    );
  }

  const maxHours = Math.max(10, ...records.map((r) => r.hoursWorked || 0));

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <LazyLineChart
          points={points}
          targetLine={9}
          yMax={maxHours}
          formatValue={(value) => `${value} ชม.`}
          ariaLabel="กราฟชั่วโมงทำงานรายวัน เทียบเป้าหมาย 9 ชั่วโมง"
        />
      </div>
      <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <li className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          <span
            className={
              isDark
                ? "size-2 rounded-full bg-blue-400"
                : "size-2 rounded-full bg-blue-600"
            }
            aria-hidden="true"
          />
          ชั่วโมงทำงาน
        </li>
        <li className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          <span
            className={
              isDark
                ? "size-2 rounded-full bg-teal-400"
                : "size-2 rounded-full bg-teal-600"
            }
            aria-hidden="true"
          />
          เป้าหมาย (9 ชม.)
        </li>
      </ul>
    </div>
  );
};

"use client";

import React from "react";
import { HoursWorkedChart } from "./HoursWorkedChart";
import { DailyAverageChart } from "./DailyAverageChart";
import type { AttendanceRecord } from "@/lib/types/attendance";

interface WorkingHoursTabContentProps {
  records: AttendanceRecord[];
}

export const WorkingHoursTabContent: React.FC<WorkingHoursTabContentProps> = ({
  records,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200/80 p-4 dark:border-white/[0.06]">
        <h3 className="mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          ชั่วโมงทำงานรายวัน
        </h3>
        <div className="h-64">
          <HoursWorkedChart records={records} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 p-4 dark:border-white/[0.06]">
        <h3 className="mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          ชั่วโมงทำงานเฉลี่ยตามวัน
        </h3>
        <div className="h-64">
          <DailyAverageChart records={records} />
        </div>
      </div>
    </div>
  );
};

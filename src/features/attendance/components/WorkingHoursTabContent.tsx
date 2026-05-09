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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">
          ชั่วโมงทำงานรายวัน
        </h3>
        <div className="h-64">
          <HoursWorkedChart records={records} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">
          ชั่วโมงทำงานเฉลี่ยตามวัน
        </h3>
        <div className="h-64">
          <DailyAverageChart records={records} />
        </div>
      </div>
    </div>
  );
};

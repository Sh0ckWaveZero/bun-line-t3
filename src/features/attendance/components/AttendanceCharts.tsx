"use client";

import React, { useState } from "react";
import { Suspense, lazy } from "react";
import { useChartTheme } from "@/hooks/useChartTheme";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { AttendanceChartsProps } from "@/lib/types/attendance";

const WorkingHoursTabContent = lazy(() =>
  import("./WorkingHoursTabContent").then((m) => ({
    default: m.WorkingHoursTabContent,
  })),
);

const StatisticsTabContent = lazy(() =>
  import("./StatisticsTabContent").then((m) => ({
    default: m.StatisticsTabContent,
  })),
);

function ChartFallback() {
  return (
    <div className="text-muted-foreground flex h-64 items-center justify-center">
      กำลังโหลดกราฟ...
    </div>
  );
}

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`text-muted-foreground h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${open ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

export const AttendanceCharts: React.FC<AttendanceChartsProps> = ({
  report,
}) => {
  const { mounted } = useChartTheme();
  const [open, setOpen] = useState(true);

  if (!mounted) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <h2 className="text-foreground text-lg font-semibold">
            กราฟวิเคราะห์การทำงาน
          </h2>
          <ChevronIcon open={false} />
        </button>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-border bg-card text-muted-foreground flex h-64 items-center justify-center rounded-xl border">
            กำลังโหลด...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
        aria-expanded={open}
      >
        <h2 className="text-foreground text-lg font-semibold">
          กราฟวิเคราะห์การทำงาน
        </h2>
        <ChevronIcon open={open} />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <Tabs defaultValue="working-hours" className="mt-4 w-full">
            <TabsList className="tab-pill mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="working-hours">ชั่วโมงการทำงาน</TabsTrigger>
              <TabsTrigger value="statistics">สถิติการเข้างาน</TabsTrigger>
            </TabsList>

            <TabsContent value="working-hours">
              <Suspense fallback={<ChartFallback />}>
                <WorkingHoursTabContent records={report.attendanceRecords} />
              </Suspense>
            </TabsContent>

            <TabsContent value="statistics">
              <Suspense fallback={<ChartFallback />}>
                <StatisticsTabContent report={report} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

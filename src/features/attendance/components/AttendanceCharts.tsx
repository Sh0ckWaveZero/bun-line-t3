"use client";

import React, { useState } from "react";
import { Suspense, lazy } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
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

const CHART_TABS = [
  ["working-hours", "ชั่วโมงการทำงาน"],
  ["statistics", "สถิติการเข้างาน"],
] as const;

type ChartTabValue = (typeof CHART_TABS)[number][0];

export const AttendanceCharts: React.FC<AttendanceChartsProps> = ({
  report,
}) => {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ChartTabValue>("working-hours");

  return (
    <div className="border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-white/[0.08]">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          กราฟวิเคราะห์การทำงาน
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "ซ่อนกราฟ" : "แสดงกราฟ"}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:text-slate-400 dark:hover:bg-white/[0.08]"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]",
              open ? "rotate-180" : "",
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            role="group"
            aria-label="เลือกชนิดกราฟ"
            className="flex gap-6 overflow-x-auto"
          >
            {CHART_TABS.map(([value, label]) => {
              const isActive = activeTab === value;

              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveTab(value)}
                  className={cn(
                    "relative flex shrink-0 cursor-pointer items-center py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none",
                    isActive
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
                  )}
                >
                  {label}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-slate-900 dark:bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4 pb-1">
            {activeTab === "working-hours" ? (
              <Suspense fallback={null}>
                <WorkingHoursTabContent records={report.attendanceRecords} />
              </Suspense>
            ) : (
              <Suspense fallback={null}>
                <StatisticsTabContent report={report} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

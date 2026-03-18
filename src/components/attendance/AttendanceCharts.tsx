"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useChartTheme } from "@/hooks/useChartTheme";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { AttendanceChartsProps } from "@/lib/types/attendance";

// Lazy load chart components for better bundle splitting
const WorkingHoursTabContent = dynamic(
  () =>
    import("./WorkingHoursTabContent").then((m) => ({
      default: m.WorkingHoursTabContent,
    })),
  {
    ssr: false, // Charts don't need SSR
    loading: () => (
      <div className="flex h-64 items-center justify-center text-gray-400 dark:text-gray-500">
        กำลังโหลดกราฟ...
      </div>
    ),
  },
);

const StatisticsTabContent = dynamic(
  () =>
    import("./StatisticsTabContent").then((m) => ({
      default: m.StatisticsTabContent,
    })),
  {
    ssr: false, // Charts don't need SSR
    loading: () => (
      <div className="flex h-64 items-center justify-center text-gray-400 dark:text-gray-500">
        กำลังโหลดกราฟ...
      </div>
    ),
  },
);

/**
 * Attendance Charts Component - REFACTORED
 * Main component that orchestrates chart display with tabs
 *
 * Refactored from a 430-line monolith into smaller, composable components:
 * - WorkingHoursTabContent: Line and bar charts
 * - StatisticsTabContent: Donut charts for attendance and compliance
 * - Individual chart components with dedicated hooks for data preparation
 *
 * This follows the Single Responsibility Principle and improves:
 * - Testability (each component has one purpose)
 * - Reusability (charts can be used independently)
 * - Maintainability (smaller, focused components)
 * - Performance (hooks use useMemo for optimization)
 */
export const AttendanceCharts: React.FC<AttendanceChartsProps> = ({
  report,
}) => {
  const { mounted } = useChartTheme();

  // Don't render charts until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
          กราฟวิเคราะห์การทำงาน
        </h2>
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="bg-card-base border-theme-primary rounded-lg border p-4 shadow">
            <div className="flex h-64 items-center justify-center text-gray-400 dark:text-gray-500">
              กำลังโหลด...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
        กราฟวิเคราะห์การทำงาน
      </h2>

      <Tabs defaultValue="working-hours" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <TabsTrigger
            value="working-hours"
            className="flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-blue-50 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg dark:hover:bg-blue-900/20 dark:data-[state=active]:bg-blue-600"
          >
            📊 ชั่วโมงการทำงาน
          </TabsTrigger>
          <TabsTrigger
            value="statistics"
            className="flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-green-50 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg dark:hover:bg-green-900/20 dark:data-[state=active]:bg-green-600"
          >
            📈 สถิติการเข้างาน
          </TabsTrigger>
        </TabsList>

        <TabsContent value="working-hours">
          <WorkingHoursTabContent records={report.attendanceRecords} />
        </TabsContent>

        <TabsContent value="statistics">
          <StatisticsTabContent report={report} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

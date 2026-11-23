import { useMemo } from "react";
import type {
  AttendanceRecord,
  MonthlyAttendanceReport,
} from "@/lib/types/attendance";
import type { DoughnutSlice } from "@/components/charts/LazyCharts";
import {
  buildDailyAverageHoursData,
  buildHoursChartData,
} from "@/features/attendance/helpers/chart-data";

/**
 * Hook สำหรับกราฟเส้นชั่วโมงทำงานรายวัน (จัดเรียงตามวันที่)
 */
export const useHoursChartData = (records: AttendanceRecord[]) =>
  useMemo(() => buildHoursChartData(records), [records]);

/**
 * Hook สำหรับ donut สัดส่วนการมาทำงาน (มาทำงาน / ขาดงาน)
 */
export const useAttendanceDonutData = (
  report: MonthlyAttendanceReport,
): DoughnutSlice[] => {
  return useMemo(() => {
    const daysAbsent = Math.max(
      0,
      report.workingDaysInMonth - report.totalDaysWorked,
    );

    return [
      {
        label: "มาทำงาน",
        value: report.totalDaysWorked,
        color: "rgb(16, 185, 129)", // Emerald-500
      },
      {
        label: "ขาดงาน",
        value: daysAbsent,
        color: "rgb(148, 163, 184)", // Slate-400
      },
    ];
  }, [report.workingDaysInMonth, report.totalDaysWorked]);
};

/**
 * Hook สำหรับ donut การทำงานครบเวลา (ครบ 9 ชม. / ไม่ครบ)
 */
export const useComplianceDonutData = (
  report: MonthlyAttendanceReport,
): DoughnutSlice[] => {
  return useMemo(() => {
    const incompleteDays = Math.max(
      0,
      report.totalDaysWorked - report.completeDays,
    );

    return [
      {
        label: "ทำงานครบ 9 ชม.",
        value: report.completeDays,
        color: "rgb(99, 102, 241)", // Indigo-500
      },
      {
        label: "ทำงานไม่ครบ 9 ชม.",
        value: incompleteDays,
        color: "rgb(245, 158, 11)", // Amber-500
      },
    ];
  }, [report.totalDaysWorked, report.completeDays]);
};

/**
 * Hook สำหรับ bar chart ชั่วโมงทำงานเฉลี่ยแยกตามวันของสัปดาห์
 */
export const useDailyAverageHoursData = (records: AttendanceRecord[]) =>
  useMemo(() => buildDailyAverageHoursData(records), [records]);

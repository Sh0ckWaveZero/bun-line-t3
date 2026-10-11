import { useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type {
  AttendanceRecord,
  MonthlyAttendanceReport,
} from "@/lib/types/attendance";
import type { DoughnutSlice } from "@/components/charts/LazyCharts";

/**
 * Safe date formatting for chart labels with error handling
 */
const formatShortDateSafe = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid";
    }
    return format(date, "d MMM", { locale: th });
  } catch (error) {
    console.error("Chart date formatting error:", error);
    return "Invalid";
  }
};

/**
 * Check if a date is valid
 */
const isValidDate = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

/**
 * Hook สำหรับกราฟเส้นชั่วโมงทำงานรายวัน (จัดเรียงตามวันที่)
 */
export const useHoursChartData = (records: AttendanceRecord[]) => {
  return useMemo(() => {
    const sortedRecords = [...records].sort((a, b) => {
      const dateA = new Date(a.workDate);
      const dateB = new Date(b.workDate);

      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0;
      }

      return dateA.getTime() - dateB.getTime();
    });

    return sortedRecords.map((record) => ({
      label: formatShortDateSafe(record.workDate),
      value: record.hoursWorked || 0,
    }));
  }, [records]);
};

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
export const useDailyAverageHoursData = (records: AttendanceRecord[]) => {
  return useMemo(() => {
    const dayMap = new Map<number, { total: number; count: number }>();

    records.forEach((record) => {
      if (record.hoursWorked && isValidDate(record.workDate)) {
        const date = new Date(record.workDate);
        const day = date.getDay();

        if (!dayMap.has(day)) {
          dayMap.set(day, { total: 0, count: 0 });
        }

        const current = dayMap.get(day)!;
        current.total += record.hoursWorked;
        current.count += 1;
      }
    });

    const dayNames = [
      "จันทร์",
      "อังคาร",
      "พุธ",
      "พฤหัสบดี",
      "ศุกร์",
      "เสาร์",
      "อาทิตย์",
    ];
    const dayOrder = [1, 2, 3, 4, 5, 6, 0];

    const labels: string[] = [];
    const values: number[] = [];

    for (const dayIndex of dayOrder) {
      labels.push(dayNames[dayIndex === 0 ? 6 : dayIndex - 1]!);
      const dayData = dayMap.get(dayIndex);
      values.push(dayData ? dayData.total / dayData.count : 0);
    }

    return { labels, values };
  }, [records]);
};

import { useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { AttendanceRecord, MonthlyAttendanceReport } from "@/lib/types/attendance";

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
 * Hook for preparing hours worked chart data (Line chart)
 * Shows hours worked per day with target line
 */
export const useHoursChartData = (records: AttendanceRecord[]) => {
  return useMemo(() => {
    // Safe sorting without direct date comparison
    const sortedRecords = [...records].sort((a, b) => {
      const dateA = new Date(a.workDate);
      const dateB = new Date(b.workDate);

      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0;
      }

      return dateA.getTime() - dateB.getTime();
    });

    return {
      labels: sortedRecords.map((record) => formatShortDateSafe(record.workDate)),
      datasets: [
        {
          label: "ชั่วโมงทำงาน",
          data: sortedRecords.map((record) => record.hoursWorked || 0),
          fill: true,
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderColor: "rgb(37, 99, 235)",
          borderWidth: 3,
          tension: 0.3,
          pointBackgroundColor: "rgb(59, 130, 246)",
          pointBorderColor: "white",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "เป้าหมาย (9 ชม.)",
          data: sortedRecords.map(() => 9),
          borderColor: "rgba(20, 184, 166, 0.8)",
          borderWidth: 2,
          borderDash: [8, 4],
          fill: false,
          pointRadius: 0,
          tension: 0,
        },
      ],
    };
  }, [records]);
};

/**
 * Hook for preparing attendance donut chart data
 * Shows days attended vs days absent
 */
export const useAttendanceDonutData = (report: MonthlyAttendanceReport) => {
  return useMemo(() => {
    const daysAbsent = report.workingDaysInMonth - report.totalDaysWorked;

    if (daysAbsent === 0) {
      return {
        labels: ["เข้างานครบทุกวัน 🎉"],
        datasets: [
          {
            data: [100],
            backgroundColor: ["rgb(16, 185, 129)"],
            hoverOffset: 4,
          },
        ],
      };
    }

    return {
      labels: ["มาทำงาน", "ขาดงาน"],
      datasets: [
        {
          data: [report.totalDaysWorked, daysAbsent],
          backgroundColor: [
            "rgb(16, 185, 129)", // Emerald-500
            "rgb(148, 163, 184)", // Slate-400
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
          hoverOffset: 6,
          hoverBorderWidth: 3,
        },
      ],
    };
  }, [report.workingDaysInMonth, report.totalDaysWorked]);
};

/**
 * Hook for preparing compliance donut chart data
 * Shows days with full 9 hours vs incomplete days
 */
export const useComplianceDonutData = (report: MonthlyAttendanceReport) => {
  return useMemo(() => {
    const incompleteDays = report.totalDaysWorked - report.completeDays;

    if (incompleteDays === 0 && report.totalDaysWorked > 0) {
      return {
        labels: ["ทำงานครบ 9 ชม. ทุกวัน 💪"],
        datasets: [
          {
            data: [100],
            backgroundColor: ["rgb(99, 102, 241)"],
            hoverOffset: 4,
          },
        ],
      };
    }

    if (report.totalDaysWorked === 0) {
      return {
        labels: ["ไม่มีข้อมูลการทำงาน"],
        datasets: [
          {
            data: [100],
            backgroundColor: ["rgb(148, 163, 184)"],
            hoverOffset: 4,
          },
        ],
      };
    }

    return {
      labels: ["ทำงานครบ 9 ชม.", "ทำงานไม่ครบ 9 ชม."],
      datasets: [
        {
          data: [report.completeDays, incompleteDays],
          backgroundColor: [
            "rgb(99, 102, 241)", // Indigo-500
            "rgb(245, 158, 11)", // Amber-500
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
          hoverOffset: 6,
          hoverBorderWidth: 3,
        },
      ],
    };
  }, [report.totalDaysWorked, report.completeDays]);
};

/**
 * Hook for preparing daily average hours bar chart data
 * Shows average hours worked by day of week
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

    const labels = [];
    const data = [];

    for (const dayIndex of dayOrder) {
      labels.push(dayNames[dayIndex === 0 ? 6 : dayIndex - 1]);
      const dayData = dayMap.get(dayIndex);
      const avgHours = dayData ? dayData.total / dayData.count : 0;
      data.push(avgHours);
    }

    return {
      labels,
      datasets: [
        {
          label: "ชั่วโมงทำงานเฉลี่ยตามวัน",
          data,
          backgroundColor: "rgba(20, 184, 166, 0.8)",
          borderColor: "rgb(13, 148, 136)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: "rgba(20, 184, 166, 0.9)",
          hoverBorderColor: "rgb(15, 118, 110)",
          hoverBorderWidth: 3,
        },
      ],
    };
  }, [records]);
};

// ข้อมูลกราฟของรายงานการเข้างาน — pure functions (ใช้ได้ทั้ง client/server)
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { LineChartPoint } from "@/components/charts/LazyCharts";
import type { AttendanceRecord } from "@/lib/types/attendance";

/**
 * Safe date formatting for chart labels with error handling
 */
const formatChartDateSafe = (dateString: string, pattern: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid";
    }
    return format(date, pattern, { locale: th });
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
 * จุดกราฟเส้นชั่วโมงทำงานรายวัน (จัดเรียงตามวันที่)
 * label ใช้ใน tooltip — compactLabels (วันที่) ใช้บนแกน x เมื่อกราฟแคบ
 */
export const buildHoursChartData = (
  records: AttendanceRecord[],
): { points: LineChartPoint[]; compactLabels: string[] } => {
  const sortedRecords = [...records].sort((a, b) => {
    const dateA = new Date(a.workDate);
    const dateB = new Date(b.workDate);

    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      return 0;
    }

    return dateA.getTime() - dateB.getTime();
  });

  return {
    points: sortedRecords.map((record) => ({
      label: formatChartDateSafe(record.workDate, "d MMM"),
      value: record.hoursWorked || 0,
    })),
    compactLabels: sortedRecords.map((record) =>
      formatChartDateSafe(record.workDate, "d"),
    ),
  };
};

const DAY_NAMES = [
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
  "อาทิตย์",
] as const;

/** ชื่อวันย่อสำหรับแกน x — เรียงให้ตรง index กับ DAY_NAMES */
const SHORT_DAY_NAMES = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."] as const;

/** getDay() 0 = อาทิตย์ — รายงานเริ่มสัปดาห์ที่วันจันทร์ */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

/**
 * ชั่วโมงทำงานเฉลี่ยแยกตามวันของสัปดาห์ (จันทร์ → อาทิตย์)
 * compactLabels (ชื่อวันย่อ) ใช้บนแกน x เมื่อกราฟแคบ
 */
export const buildDailyAverageHoursData = (records: AttendanceRecord[]) => {
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

  const labels: string[] = [];
  const compactLabels: string[] = [];
  const values: number[] = [];

  for (const dayIndex of DAY_ORDER) {
    const nameIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    labels.push(DAY_NAMES[nameIndex]!);
    compactLabels.push(SHORT_DAY_NAMES[nameIndex]!);
    const dayData = dayMap.get(dayIndex);
    values.push(dayData ? dayData.total / dayData.count : 0);
  }

  return { labels, values, compactLabels };
};

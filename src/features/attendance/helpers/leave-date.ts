// src/features/attendance/helpers/leave-date.ts

// ─── Thai month / weekday names ───────────────────────────────────────────────

const THAI_MONTHS_LONG = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const THAI_WEEKDAYS = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatThaiMonthCaption(month: Date): string {
  return `${THAI_MONTHS_LONG[month.getMonth()] ?? ""} ${month.getFullYear() + 543}`;
}

/** แปลง "yyyy-mm-dd" → Date object (local time zone) */
export function parseDateStr(str: string): Date | undefined {
  if (!str) return undefined;
  const [yearStr, monthStr, dayStr] = str.split("-");
  const year = parseInt(yearStr ?? "", 10);
  const month = parseInt(monthStr ?? "", 10);
  const day = parseInt(dayStr ?? "", 10);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

/** แปลง Date → "yyyy-mm-dd" */
export function formatDateToStr(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** แสดงวันที่แบบเต็มภาษาไทย: "วันพฤหัสบดีที่ 18 เมษายน 2569" */
export function formatThaiFullDate(dateStr: string): string {
  const d = parseDateStr(dateStr);
  if (!d) return "เลือกวันที่ลา";
  const weekday = THAI_WEEKDAYS[d.getDay()] ?? "";
  const day = d.getDate();
  const buddhistYear = d.getFullYear() + 543;
  return `วัน${weekday}ที่ ${day} ${THAI_MONTHS_LONG[d.getMonth()] ?? ""} ${buddhistYear}`;
}

/** แสดงเดือนปีภาษาไทยสำหรับ history navigation: "เมษายน 2569" */
export function getThaiMonthLabel(yyyyMm: string): string {
  const [yearStr, monthStr] = yyyyMm.split("-");
  const year = parseInt(yearStr ?? "0", 10);
  const monthIndex = parseInt(monthStr ?? "1", 10) - 1;
  return `${THAI_MONTHS_LONG[monthIndex] ?? ""} ${year + 543}`;
}

/** แสดงวันที่ย่อภาษาไทยสำหรับ history list: "18 เม.ย. 2569" */
export function formatThaiShortDate(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr ?? "0", 10);
  const monthIndex = parseInt(monthStr ?? "1", 10) - 1;
  return `${dayStr} ${THAI_MONTHS_SHORT[monthIndex] ?? ""} ${year + 543}`;
}

export function getTodayStr(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getCurrentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(yyyyMm: string, delta: number): string {
  const [yearStr, monthStr] = yyyyMm.split("-");
  const d = new Date(
    parseInt(yearStr ?? "0", 10),
    parseInt(monthStr ?? "1", 10) - 1 + delta,
    1,
  );
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

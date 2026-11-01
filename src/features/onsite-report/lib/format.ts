/** ตัวช่วยแสดงผลวันที่/เวลาของรายงาน (isomorphic — ใช้ได้ทั้ง client และ PDF) */

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-10-02" → "02/10/2026" — ค่าที่ไม่ใช่วันที่ (เช่น ฟอร์มยังไม่กรอก) → "" */
export const formatDateTh = (dateKey: string): string => {
  if (!DATE_KEY_PATTERN.test(dateKey)) return "";
  const [year = "", month = "", day = ""] = dateKey.split("-");
  return `${day}/${month}/${year}`;
};

/** "2026-10-02" → "2 Oct 2026" — รูปแบบวันที่บนหัวฟอร์มตามไฟล์ export จริง; ไม่ใช่วันที่ → "" */
export const formatOnsiteDate = (dateKey: string): string => {
  if (!DATE_KEY_PATTERN.test(dateKey)) return "";
  const [year = "", month = "", day = ""] = dateKey.split("-");
  const monthIndex = Number(month) - 1;
  const monthName = EN_MONTHS[monthIndex] ?? month;
  return `${Number(day)} ${monthName} ${year}`;
};

/** 9 → "9.00", 9.5 → "9.30" — รูปแบบเวลาในชีต/ไฟล์ export จริง */
export const formatSheetTime = (value: number | null): string => {
  if (value === null) return "-";
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${hours}.${String(minutes).padStart(2, "0")}`;
};

/** "9.00 - 12.00" */
export const formatSheetTimeRange = (
  start: number | null,
  end: number | null,
): string => `${formatSheetTime(start)} - ${formatSheetTime(end)}`;

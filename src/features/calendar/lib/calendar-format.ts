import { format } from "date-fns";

/** แปลง Date เป็น key "yyyy-MM-dd" ที่ใช้จับคู่กับข้อมูลรายวัน (holiday / leave / workMode) */
export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** ค้นหา event รายวันจาก key วันที่ ("yyyy-MM-dd") */
export function findEventByDate<T extends { date: string }>(
  events: T[],
  date: Date,
): T | undefined {
  const dateStr = formatDateKey(date);
  return events.find((event) => event.date === dateStr);
}

/** ชื่อประเภทวันลาเป็นภาษาไทย */
export function renderLeaveType(type: string): string {
  if (type === "personal") return "ลากิจ";
  if (type === "sick") return "ลาป่วย";
  if (type === "vacation") return "ลาพักผ่อน";
  return type;
}

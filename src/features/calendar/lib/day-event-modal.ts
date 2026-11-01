import { format, isValid, parse as parseDateString } from "date-fns";
import type {
  DayEventFormValues,
  DayEventSubmit,
} from "@/features/calendar/lib/day-event-form";

/** แปลง "yyyy-MM-dd" เป็น Date (คืน undefined เมื่อ parse ไม่ได้) */
export function parseDateStr(str: string): Date | undefined {
  if (!str) return undefined;
  const parsed = parseDateString(str, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

/** แปลง Date เป็น "yyyy-MM-dd" สำหรับ payload */
export function formatDateToStr(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** แปลงค่าฟอร์มเป็น payload ตามประเภทของแท็บที่เลือก (leave / wfh / onsite / holiday) */
export function buildDayEventPayload(
  values: DayEventFormValues,
  dateStr: string,
): DayEventSubmit {
  if (values.eventType === "leave") {
    return {
      kind: "leave",
      date: dateStr,
      leaveType: values.leaveType,
      reason: values.reason || undefined,
    };
  }
  if (values.eventType === "wfh") {
    return {
      kind: "wfh",
      date: dateStr,
      note: values.noteWfh || undefined,
    };
  }
  if (values.eventType === "onsite") {
    return {
      kind: "onsite",
      date: dateStr,
      note: values.noteOnsite || undefined,
    };
  }
  return {
    kind: "holiday",
    date: dateStr,
    nameThai: values.nameThai.trim(),
    nameEnglish: values.nameEnglish.trim(),
    holidayType: values.holidayType,
    year: Number(values.year),
    description: values.description || undefined,
  };
}

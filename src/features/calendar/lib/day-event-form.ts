import { z } from "zod";

export const DAY_EVENT_TYPES = ["leave", "wfh", "onsite", "holiday"] as const;

export type DayEventType = (typeof DAY_EVENT_TYPES)[number];

/** payload ที่ modal ส่งให้หน้า (หน้า dispatch ไป API ที่ถูกต้องตาม kind) */
export type DayEventSubmit =
  | { kind: "leave"; date: string; leaveType: string; reason?: string }
  | { kind: "wfh"; date: string; note?: string }
  | { kind: "onsite"; date: string; note?: string }
  | {
      kind: "holiday";
      date: string;
      nameThai: string;
      nameEnglish: string;
      holidayType: string;
      year: number;
      description?: string;
    };

/**
 * Form schema ของ DayEventModal (React Hook Form + zod)
 * - ทุกฟิลด์ของทั้ง 4 แท็บถูก mounted ค้างไว้เพื่อทำ transition จึง validate แบบมีเงื่อนไข
 *   ตาม eventType ใน superRefine — แท็บไหนไม่เกี่ยวก็ไม่ถูกเรียกต้องกรอก
 * - ข้อความ error เป็นภาษาไทยเพราะแสดงตรงใต้ฟิลด์
 */
export const dayEventFormSchema = z
  .object({
    eventType: z.enum(DAY_EVENT_TYPES),
    date: z.date().nullable(),
    leaveType: z.enum(["personal", "sick", "vacation"]),
    reason: z.string(),
    noteWfh: z.string(),
    noteOnsite: z.string(),
    nameThai: z.string(),
    nameEnglish: z.string(),
    holidayType: z.enum(["national", "royal", "religious", "special"]),
    year: z.string(),
    description: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.date) {
      ctx.addIssue({
        code: "custom",
        path: ["date"],
        message: "กรุณาระบุวันที่",
      });
    }
    if (values.eventType !== "holiday") return;

    const yearNum = Number(values.year);
    if (
      !values.year ||
      !Number.isInteger(yearNum) ||
      yearNum < 2000 ||
      yearNum > 2100
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["year"],
        message: "กรุณาระบุปี ค.ศ. (2000-2100)",
      });
    }
    if (!values.nameThai.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["nameThai"],
        message: "กรุณาระบุชื่อวันหยุดภาษาไทย",
      });
    }
    if (!values.nameEnglish.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["nameEnglish"],
        message: "กรุณาระบุชื่อวันหยุดภาษาอังกฤษ",
      });
    }
  });

export type DayEventFormValues = z.infer<typeof dayEventFormSchema>;

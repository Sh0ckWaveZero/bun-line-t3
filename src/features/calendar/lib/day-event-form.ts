import { z } from "zod";

export const DAY_EVENT_TYPES = ["leave", "wfh", "onsite", "holiday"] as const;

export type DayEventType = (typeof DAY_EVENT_TYPES)[number];

/** ประเภทวันลาที่ปฏิทินรองรับ (แหล่งเดียวร่วมกันทั้ง schema / select / API validation) */
export const CALENDAR_LEAVE_TYPES = ["personal", "sick", "vacation"] as const;

export type CalendarLeaveType = (typeof CALENDAR_LEAVE_TYPES)[number];

/** ค่าเริ่มต้นของโหมด "เปลี่ยนวันลา" — เติมจากวันลาที่บันทึกไว้แล้ว */
export interface DayEventLeavePrefill {
  leaveType: CalendarLeaveType;
  reason?: string | null;
}

/**
 * สร้าง prefill จากวันลาที่มีอยู่ — type ที่ไม่อยู่ในตัวเลือกปฏิทิน
 * (เช่น "birthday" ที่สร้างจากหน้า attendance) เติมเป็น personal ให้ select แสดงผลถูกต้อง
 */
export function buildLeavePrefill(leave: {
  type: string;
  reason?: string | null;
}): DayEventLeavePrefill {
  const isKnownType = (CALENDAR_LEAVE_TYPES as readonly string[]).includes(
    leave.type,
  );
  return {
    leaveType: isKnownType ? (leave.type as CalendarLeaveType) : "personal",
    reason: leave.reason ?? "",
  };
}

/** payload ที่ modal ส่งให้หน้า (หน้า dispatch ไป API ที่ถูกต้องตาม kind) */
export type DayEventSubmit =
  | {
      kind: "leave";
      date: string;
      leaveType: string;
      reason?: string;
      /** true = แก้ไขวันลาที่มีอยู่แล้ว (PUT /api/leave) ไม่ใช่สร้างใหม่ (POST) */
      updateExisting?: boolean;
    }
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
    leaveType: z.enum(CALENDAR_LEAVE_TYPES),
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

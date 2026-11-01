import { z } from "zod";
import {
  ONSITE_REPORT_MAX_ATTENDEES,
  ONSITE_REPORT_MAX_NEXT_ACTIONS,
} from "../constants";
import { companyCodeSchema } from "./company";
import type { OnsiteReport } from "../types";

// ─────────────────────────────────────────────
// Field helpers — ฟอร์มเก็บค่าเป็น string ทั้งหมด (input) แล้ว transform เป็นชนิดจริง (output)
// ─────────────────────────────────────────────

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `กรุณากรอก${label}`)
    .max(max, `${label}ต้องไม่เกิน ${max} ตัวอักษร`);

/** ฟิลด์เสริม — ค่าว่าง → null */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `ต้องไม่เกิน ${max} ตัวอักษร`)
    .transform((value) => (value === "" ? null : value));

const dateField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `กรุณาระบุ${label}`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)");

/** เวลาเข้าบริการ — select ส่ง "9" / "9.5" / "" → number | null */
const timeField = (label: string) =>
  z
    .string()
    .optional()
    .transform((value) =>
      value == null || value === "" ? null : Number(value),
    )
    .refine(
      (value) =>
        value === null ||
        (Number.isFinite(value) && value >= 0 && value < 24),
      `${label}ไม่ถูกต้อง`,
    );

/** แถวดิบจากฟอร์ม — เก็บค่าตามที่พิมพ์ ก่อนคัดแถวว่างทิ้ง */
const rawNextActionRow = z.object({
  date: z.string(),
  milestone: z.string(),
  description: z.string(),
});

const rawAttendeeRow = z.object({
  name: z.string(),
  position: z.string(),
});

const isBlankRow = (row: Record<string, string>): boolean =>
  Object.values(row).every(
    (value) => typeof value !== "string" || value.trim() === "",
  );

/**
 * ตรวจแถวของตาราง (Next Action / Attendees) โดยคง "ดัชนีต้นฉบับ" ใน error path ไว้
 *
 * แถวที่เว้นว่างทั้งแถวถูกข้าม (ไม่ validate) แต่ไม่ถูกตัดออกจนกว่า validation จะผ่านทั้งหมด
 * ถ้ากรองแถวว่างก่อน validate ดัชนีใน error จะเลื่อน เช่น แถวที่ 2 ผิดแต่ error กลายเป็น [0]
 * ซึ่งฟอร์ม (useFieldArray) แสดงตามดัชนีเดิม → error ไปโผล่ใต้แถวว่าง และโฟกัสช่องที่ผิดไม่ถูก
 */
const validatedRows = <
  R extends z.ZodType<Record<string, string>>,
  T extends z.ZodType,
>(
  rawRow: R,
  rowSchema: T,
  max: number,
  maxMessage: string,
) =>
  z.array(rawRow).transform((rows, ctx) => {
    const validRows: z.output<T>[] = [];
    let isValid = true;

    rows.forEach((row, index) => {
      if (isBlankRow(row)) return;
      const parsed = rowSchema.safeParse(row);
      if (!parsed.success) {
        isValid = false;
        for (const issue of parsed.error.issues) {
          ctx.addIssue({
            code: "custom",
            path: [index, ...issue.path],
            message: issue.message,
          });
        }
        return;
      }
      validRows.push(parsed.data);
    });

    if (isValid && validRows.length > max) {
      ctx.addIssue({ code: "custom", message: maxMessage });
      return z.NEVER;
    }
    // มี error → คืน NEVER ให้ซ้ำกับ issue ที่ใส่แล้ว (ไม่คืนแถวที่กรองแล้ว)
    return isValid ? validRows : z.NEVER;
  });

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

export const onsiteReportFormSchema = z
  .object({
    // ฝั่ง client ตรวจแค่รูปแบบ code — ว่าบริษัทมีอยู่/เปิดใช้งานจริงหรือไม่ API ตรวจซ้ำเสมอ
    company: z.string().min(1, "กรุณาเลือกบริษัท").pipe(companyCodeSchema),
    docNo: requiredText("Doc No", 60),
    /** "-1".."−9" — validate เป็น string เพื่อให้ค่าจาก DB ส่งกลับเข้าฟอร์มได้ตรง type */
    revision: z.string().regex(/^-[1-9]$/, "Revision ไม่ถูกต้อง"),
    clientName: requiredText("ชื่อลูกค้า", 200),
    projectCode: requiredText("Project Code", 60),
    onsiteDate: dateField("วันที่เข้าบริการ"),
    timeStart: timeField("เวลาเริ่ม"),
    timeEnd: timeField("เวลาจบ"),
    phase: optionalText(120),
    mainContact: requiredText("ผู้ประสานงานหลัก", 200),
    executionTeam: requiredText("ทีมที่เข้าบริการ", 500),
    objective: requiredText("วัตถุประสงค์การเข้าบริการ", 2000),
    actionItem: requiredText("รายละเอียดงาน", 2000),
    pendingNote: optionalText(2000),
    /** ตรวจเฉพาะแถวที่กรอกจริง (error คงดัชนีต้นฉบับ) แล้วคัดแถวว่างทิ้งหลัง validate ผ่าน */
    nextActions: validatedRows(
      rawNextActionRow,
      z.object({
        date: dateField("วันที่"),
        milestone: requiredText("Milestone", 200),
        description: requiredText("รายละเอียด", 500),
      }),
      ONSITE_REPORT_MAX_NEXT_ACTIONS,
      `การดำเนินการต่อไปไม่เกิน ${ONSITE_REPORT_MAX_NEXT_ACTIONS} แถว`,
    ),
    attendees: validatedRows(
      rawAttendeeRow,
      z.object({
        name: requiredText("ชื่อผู้เข้าร่วม", 120),
        position: requiredText("ตำแหน่ง", 120),
      }),
      ONSITE_REPORT_MAX_ATTENDEES,
      `ผู้เข้าร่วมไม่เกิน ${ONSITE_REPORT_MAX_ATTENDEES} คน`,
    ),
  })
  .superRefine((values, ctx) => {
    if (
      values.timeStart !== null &&
      values.timeEnd !== null &&
      values.timeEnd <= values.timeStart
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["timeEnd"],
        message: "เวลาจบต้องหลังเวลาเริ่ม",
      });
    }
  });

export type OnsiteReportFormInput = z.input<typeof onsiteReportFormSchema>;
export type OnsiteReportFormOutput = z.output<typeof onsiteReportFormSchema>;

/**
 * Schema ของ payload ฝั่ง API (POST/PATCH) — ตรงกับ OnsiteReportPayload
 * ใช้ทั้งฝั่ง server route validate และเป็น reference ของ form output
 */
export const onsiteReportPayloadSchema = z.object({
  company: companyCodeSchema,
  docNo: z.string().trim().min(1).max(60),
  revision: z.string().regex(/^-[1-9]$/),
  clientName: z.string().trim().min(1).max(200),
  projectCode: z.string().trim().min(1).max(60),
  onsiteDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeStart: z.number().min(0).max(24).nullable(),
  timeEnd: z.number().min(0).max(24).nullable(),
  phase: z.string().trim().max(120).nullable(),
  mainContact: z.string().trim().min(1).max(200),
  executionTeam: z.string().trim().min(1).max(500),
  objective: z.string().trim().min(1).max(2000),
  actionItem: z.string().trim().min(1).max(2000),
  pendingNote: z.string().trim().max(2000).nullable(),
  nextActions: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        milestone: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(500),
      }),
    )
    .max(ONSITE_REPORT_MAX_NEXT_ACTIONS),
  attendees: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        position: z.string().trim().min(1).max(120),
      }),
    )
    .max(ONSITE_REPORT_MAX_ATTENDEES),
});

// ─────────────────────────────────────────────
// Date bridge — ฟอร์มเก็บ "YYYY-MM-DD" / ปฏิทินใช้ Date
// ─────────────────────────────────────────────

export const parseDateKey = (value: string): Date | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const [, year = "", month = "", day = ""] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ─────────────────────────────────────────────
// Form values ⇄ report
// ─────────────────────────────────────────────

const toTimeInput = (value: number | null): string =>
  value === null ? "" : String(value);

/** ค่าเริ่มต้นของฟอร์มสร้างใหม่ (docNo จะถูกเติมจาก suggestDocNo ในหน้า) */
export const emptyFormValues = (): OnsiteReportFormInput => ({
  company: "", // หน้าฟอร์มเลือกบริษัทแรกที่เปิดใช้งานให้เมื่อโหลดรายการบริษัทเสร็จ
  docNo: "",
  revision: "-1",
  clientName: "",
  projectCode: "",
  onsiteDate: "",
  timeStart: "",
  timeEnd: "",
  phase: "",
  mainContact: "",
  executionTeam: "",
  objective: "",
  actionItem: "",
  pendingNote: "",
  nextActions: [],
  attendees: [],
});

/** โหลดรายงานเดิมเข้าฟอร์มแก้ไข */
export const reportToFormValues = (
  report: OnsiteReport,
): OnsiteReportFormInput => ({
  company: report.company,
  docNo: report.docNo,
  revision: report.revision,
  clientName: report.clientName,
  projectCode: report.projectCode,
  onsiteDate: report.onsiteDate,
  timeStart: toTimeInput(report.timeStart),
  timeEnd: toTimeInput(report.timeEnd),
  phase: report.phase ?? "",
  mainContact: report.mainContact,
  executionTeam: report.executionTeam,
  objective: report.objective,
  actionItem: report.actionItem,
  pendingNote: report.pendingNote ?? "",
  nextActions: report.nextActions.map((row) => ({ ...row })),
  attendees: report.attendees.map((row) => ({ ...row })),
});

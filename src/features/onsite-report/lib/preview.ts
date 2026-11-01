/**
 * ค่าฟอร์มดิบ → OnsiteReport จำลองสำหรับเรนเดอร์ PDF ตัวอย่าง (isomorphic)
 *
 * ตัวอย่างต้องแสดงได้ตลอดเวลา แม้ฟอร์มยังกรอกไม่ครบ/ไม่ถูกต้อง จึง **ไม่ validate แบบเข้ม**
 * แต่ coerce แต่ละฟิลด์เป็นค่าที่เรนเดอร์ได้เสมอ (ค่าเสียหรือชนิดผิด → ค่าว่าง) และจำกัดความยาว/จำนวนแถว
 * ตามเพดานเดียวกับ schema จริง เพื่อไม่ให้ผู้ใช้ส่งข้อความใหญ่ผิดปกติมาให้ server เรนเดอร์
 * การตรวจความถูกต้องจริงยังอยู่ที่ onsiteReportFormSchema/onsiteReportPayloadSchema ตอนบันทึก
 */
import { z } from "zod";
import {
  ONSITE_REPORT_MAX_ATTENDEES,
  ONSITE_REPORT_MAX_NEXT_ACTIONS,
} from "../constants";
import { companyCodeSchema } from "./company";
import type { OnsiteReport } from "../types";

const text = (max: number) =>
  z
    .string()
    .catch("")
    .transform((value) => value.trim().slice(0, max));

const optionalText = (max: number) =>
  text(max).transform((value) => (value === "" ? null : value));

const dateKey = z
  .string()
  .catch("")
  .transform((value) => {
    const trimmed = value.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
  });

/** select ส่ง "9" / "9.5" / "" (หรือ number) → number | null; ค่านอกช่วง 0–24 → null */
const time = z
  .union([z.string(), z.number()])
  .catch("")
  .transform((value) => {
    if (value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 && parsed < 24
      ? parsed
      : null;
  });

const nextActionRow = z
  .object({ date: dateKey, milestone: text(200), description: text(500) })
  .catch({ date: "", milestone: "", description: "" });

const attendeeRow = z
  .object({ name: text(120), position: text(120) })
  .catch({ name: "", position: "" });

const isBlankRow = (row: Record<string, string>): boolean =>
  Object.values(row).every((value) => value === "");

const previewInputSchema = z.object({
  company: z
    .string()
    .catch("")
    .transform((value) => {
      const trimmed = value.trim();
      return companyCodeSchema.safeParse(trimmed).success ? trimmed : "";
    }),
  docNo: text(60),
  revision: z
    .string()
    .catch("-1")
    .transform((value) => (/^-[1-9]$/.test(value) ? value : "-1")),
  clientName: text(200),
  projectCode: text(60),
  onsiteDate: dateKey,
  timeStart: time,
  timeEnd: time,
  phase: optionalText(120),
  mainContact: text(200),
  executionTeam: text(500),
  objective: text(2000),
  actionItem: text(2000),
  pendingNote: optionalText(2000),
  nextActions: z
    .array(nextActionRow)
    .catch([])
    .transform((rows) =>
      rows.filter((row) => !isBlankRow(row)).slice(0, ONSITE_REPORT_MAX_NEXT_ACTIONS),
    ),
  attendees: z
    .array(attendeeRow)
    .catch([])
    .transform((rows) =>
      rows.filter((row) => !isBlankRow(row)).slice(0, ONSITE_REPORT_MAX_ATTENDEES),
    ),
});

/** ไม่โยน error เสมอ — input ที่ไม่ใช่ object ได้รายงานว่างทั้งฉบับ */
export const toPreviewReport = (raw: unknown): OnsiteReport => {
  const values = previewInputSchema.parse(
    typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw : {},
  );
  const now = new Date().toISOString();
  return {
    id: "preview",
    ...values,
    companyName: values.company, // ชื่อจริงดึงตอน render PDF (loadCompanyForPdf)
    signatures: [], // ลายเซ็นของรายงานที่บันทึกแล้วโหลดแยกตอน render (ผ่าน reportId)
    createdAt: now,
    updatedAt: now,
  };
};

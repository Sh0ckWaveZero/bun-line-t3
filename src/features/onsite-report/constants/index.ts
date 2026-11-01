/** Phase — จาก dropdown ในชีต LIST (H) */
export const ONSITE_REPORT_PHASE_OPTIONS = [
  "Project Preparation",
  "Analysis & Design",
  "Develop & Test",
  "UAT & Training",
  "Room SIM & Floor Sim",
  "Go-Live & Support",
  "Planning",
  "Analysis",
  "Design",
  "Deploy",
] as const;

/** เวลาเข้าบริการ 8.0–18.0 ทุกครึ่งชั่วโมง (ในชีตเก็บเป็นเลข เช่น 9.0, 12.0) */
export const ONSITE_REPORT_TIME_OPTIONS: number[] = Array.from(
  { length: 21 },
  (_, i) => 8 + i * 0.5,
);

/** "9" → "09:00", "9.5" → "09:30" — ใช้เป็น label ของ select เวลา */
export const formatTimeLabel = (value: number): string => {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/** Revision ท้าย Doc No ในชีต FORM (S3) */
export const ONSITE_REPORT_REVISION_OPTIONS = [
  "-1",
  "-2",
  "-3",
  "-4",
  "-5",
  "-6",
  "-7",
  "-8",
  "-9",
] as const;

/** เอกสารกำหนดผู้เข้าร่วมสูงสุด 10 ท่าน (เกินให้แนบ attendee list) */
export const ONSITE_REPORT_MAX_ATTENDEES = 10;

/** หมายเหตุใต้ตารางผู้เข้าร่วม (ตามชีตเดิม) */
export const ONSITE_REPORT_ATTENDEE_NOTE =
  "*กรณีมีรายชื่อมากกว่า 10 ท่าน ให้แนบเอกสาร attendee list ประกอบ";

/** จำกัดจำนวนแถว Next Action ในฟอร์ม */
export const ONSITE_REPORT_MAX_NEXT_ACTIONS = 12;

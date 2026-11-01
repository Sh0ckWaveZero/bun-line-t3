/**
 * บริษัทผู้ออกเอกสาร (หัวกระดาษ + ฝั่งลายเซ็นบริษัท) — แอดมินจัดการผ่านเว็บ
 * ตัวรายงานเก็บเฉพาะ code (slug คงที่) แล้วอ้างชื่อ/โลโก้จากตารางบริษัทตอนแสดงผลและ export
 */
export interface OnsiteReportCompany {
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  /** มีโลโก้อัปโหลดแล้วหรือไม่ (ไม่ส่งไบต์ของรูปมากับรายการ) */
  hasLogo: boolean;
  logoWidth: number | null;
  logoHeight: number | null;
  /** ISO string — ใช้เป็น ?v= ตอนโหลดรูป เพื่อรีเฟรชเมื่อเปลี่ยนโลโก้เท่านั้น */
  logoUpdatedAt: string | null;
}

/** ฝั่งผู้เซ็น: COMPANY = บริษัทผู้ออกเอกสาร, CLIENT = ลูกค้า */
export type OnsiteReportSignatureParty = "COMPANY" | "CLIENT";

/** ลายเซ็นที่มีอยู่แล้ว (ไม่รวมไบต์ของรูป) — updatedAt ใช้เป็น ?v= ตอนโหลดรูป */
export interface OnsiteReportSignatureMeta {
  party: OnsiteReportSignatureParty;
  updatedAt: string;
}

/** 1 แถวของ "4. การดำเนินการต่อไป (Next Action)" */
export interface OnsiteReportNextAction {
  date: string; // YYYY-MM-DD
  milestone: string;
  description: string;
}

/** 1 แถวของ "5. ผู้เข้าร่วม (Attendees)" */
export interface OnsiteReportAttendee {
  name: string;
  position: string;
}

/** เรคคอร์ด Onsite Service Report (FM-PM-01) ตามที่ UI/PDF ใช้ */
export interface OnsiteReport {
  id: string;
  company: string; // code ของ OnsiteReportCompany
  /** ชื่อบริษัทปัจจุบันจากตารางบริษัท (อ่านอย่างเดียว — ไม่อยู่ใน payload) ใช้แสดงในตาราง */
  companyName: string;
  /** ลายเซ็นที่เซ็นแล้ว (อ่านอย่างเดียว — ไม่อยู่ใน payload) */
  signatures: OnsiteReportSignatureMeta[];
  docNo: string;
  revision: string;
  clientName: string;
  projectCode: string;
  onsiteDate: string; // YYYY-MM-DD
  timeStart: number | null;
  timeEnd: number | null;
  phase: string | null;
  mainContact: string;
  executionTeam: string;
  objective: string;
  actionItem: string;
  pendingNote: string | null;
  nextActions: OnsiteReportNextAction[];
  attendees: OnsiteReportAttendee[];
  createdAt: string;
  updatedAt: string;
}

/** Payload สำหรับ POST /api/onsite-reports และ PATCH /api/onsite-reports/$id */
export interface OnsiteReportPayload {
  company: string; // code ของ OnsiteReportCompany
  docNo: string;
  revision: string;
  clientName: string;
  projectCode: string;
  onsiteDate: string;
  timeStart: number | null;
  timeEnd: number | null;
  phase: string | null;
  mainContact: string;
  executionTeam: string;
  objective: string;
  actionItem: string;
  pendingNote: string | null;
  nextActions: OnsiteReportNextAction[];
  attendees: OnsiteReportAttendee[];
}

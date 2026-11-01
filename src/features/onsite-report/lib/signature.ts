/**
 * ลายเซ็นบนรายงาน (isomorphic — ใช้ทั้ง API, UI และ test)
 */
import { z } from "zod";

/** ลายเซ็นเป็นรูปเล็ก (canvas 600×200 ≈ หลักหมื่นไบต์) — จำกัด 256KB */
export const ONSITE_REPORT_SIGNATURE_MAX_BYTES = 256 * 1024;

/** ขนาดแคนวาสวาดลายเซ็น (px) — สัดส่วน 3:1 ให้พอดีช่องเซ็นใน PDF */
export const SIGNATURE_CANVAS_WIDTH = 600;
export const SIGNATURE_CANVAS_HEIGHT = 200;

export const signaturePartySchema = z.enum(["COMPANY", "CLIENT"]);

export const SIGNATURE_PARTY_LABELS = {
  COMPANY: "ฝั่งบริษัท",
  CLIENT: "ฝั่งลูกค้า",
} as const;

/**
 * Service ลายเซ็นบนรายงาน Onsite Service Report
 * Server-only — ทุกเมธอด scope ด้วย userId (เจ้าของรายงาน) เพื่อกัน IDOR
 */
import { Prisma } from "@prisma/client";
import { db } from "@/lib/database";
import type { DetectedLogoImage } from "../lib/logo-image";
import type {
  OnsiteReportSignatureMeta,
  OnsiteReportSignatureParty,
} from "../types";

export interface OnsiteReportSignatureImage {
  data: Buffer;
  mimeType: string;
  width: number;
  height: number;
  updatedAt: Date;
}

/** ไบต์ของลายเซ็น — null เมื่อไม่ใช่รายงานของผู้ใช้หรือยังไม่เซ็น */
export const getSignature = async (
  reportId: string,
  userId: string,
  party: OnsiteReportSignatureParty,
): Promise<OnsiteReportSignatureImage | null> => {
  const row = await db.onsiteReportSignature.findFirst({
    where: { reportId, party, report: { userId } },
  });
  if (!row) return null;
  return {
    data: Buffer.from(row.data),
    mimeType: row.mimeType,
    width: row.width,
    height: row.height,
    updatedAt: row.updatedAt,
  };
};

/** บันทึก/แทนที่ลายเซ็น — null เมื่อไม่พบรายงานของผู้ใช้ */
export const setSignature = async (
  reportId: string,
  userId: string,
  party: OnsiteReportSignatureParty,
  image: DetectedLogoImage,
  data: Uint8Array,
): Promise<OnsiteReportSignatureMeta | null> => {
  const report = await db.onsiteServiceReport.findFirst({
    where: { id: reportId, userId },
    select: { id: true },
  });
  if (!report) return null;

  const bytes = Buffer.from(data);
  const fields = {
    mimeType: image.mimeType,
    width: image.width,
    height: image.height,
    data: bytes,
    signedById: userId,
  } satisfies Prisma.OnsiteReportSignatureUncheckedUpdateInput;
  const row = await db.onsiteReportSignature.upsert({
    where: { reportId_party: { reportId, party } },
    create: { reportId, party, ...fields },
    update: fields,
    select: { party: true, updatedAt: true },
  });
  return {
    party: row.party as OnsiteReportSignatureParty,
    updatedAt: row.updatedAt.toISOString(),
  };
};

/** ลบลายเซ็น — false เมื่อไม่พบ (รายงานไม่ใช่ของผู้ใช้ หรือยังไม่เซ็น) */
export const clearSignature = async (
  reportId: string,
  userId: string,
  party: OnsiteReportSignatureParty,
): Promise<boolean> => {
  const result = await db.onsiteReportSignature.deleteMany({
    where: { reportId, party, report: { userId } },
  });
  return result.count > 0;
};

export interface OnsiteReportPdfSignatures {
  company: OnsiteReportSignatureImage | null;
  client: OnsiteReportSignatureImage | null;
}

/**
 * ลายเซ็นสำหรับ render PDF — เรียกหลังตรวจแล้วว่าเป็นรายงานของผู้ใช้
 * ไม่ throw: ดึงไม่ได้ → ออก PDF ช่องเซ็นว่าง แทนที่จะทำให้ export ล้ม
 */
export const loadSignaturesForPdf = async (
  reportId: string,
): Promise<OnsiteReportPdfSignatures> => {
  try {
    const rows = await db.onsiteReportSignature.findMany({
      where: { reportId },
    });
    const toImage = (party: OnsiteReportSignatureParty) => {
      const row = rows.find((item) => item.party === party);
      return row
        ? {
            data: Buffer.from(row.data),
            mimeType: row.mimeType,
            width: row.width,
            height: row.height,
            updatedAt: row.updatedAt,
          }
        : null;
    };
    return { company: toImage("COMPANY"), client: toImage("CLIENT") };
  } catch (error) {
    console.error(
      "[onsite-report] โหลดลายเซ็นไม่สำเร็จ — ออก PDF ช่องเซ็นว่าง:",
      (error as Error)?.message ?? error,
    );
    return { company: null, client: null };
  }
};

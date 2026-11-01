/**
 * Service บริษัทผู้ออกเอกสารของ Onsite Service Report (ชื่อ + โลโก้)
 * Server-only — ไบต์ของรูปเก็บใน Postgres (ไม่เก็บใน git/public)
 */
import { Prisma } from "@prisma/client";
import { db } from "@/lib/database";
import type { DetectedLogoImage } from "../lib/logo-image";
import type { CreateCompanyInput, UpdateCompanyInput } from "../lib/company";
import type { OnsiteReportCompany } from "../types";

/** โลโก้พร้อมไบต์ — ใช้ตอนเสิร์ฟรูปและ render PDF */
export interface OnsiteReportCompanyLogo {
  data: Buffer;
  mimeType: string;
  width: number;
  height: number;
  updatedAt: Date;
}

/** ข้อมูลบริษัทที่ PDF ต้องใช้ (ชื่อ + โลโก้ถ้ามี) */
export interface OnsiteReportPdfCompany {
  name: string;
  logo: OnsiteReportCompanyLogo | null;
}

/** select ที่ไม่ดึงไบต์ของรูป (logoData) — ใช้กับทุก query ระดับรายการ */
const INFO_SELECT = {
  code: true,
  name: true,
  sortOrder: true,
  isActive: true,
  logoMimeType: true,
  logoWidth: true,
  logoHeight: true,
  logoUpdatedAt: true,
} satisfies Prisma.OnsiteReportCompanySelect;

type InfoRow = Prisma.OnsiteReportCompanyGetPayload<{
  select: typeof INFO_SELECT;
}>;

const toInfo = (row: InfoRow): OnsiteReportCompany => ({
  code: row.code,
  name: row.name,
  sortOrder: row.sortOrder,
  isActive: row.isActive,
  hasLogo: row.logoMimeType !== null,
  logoWidth: row.logoWidth,
  logoHeight: row.logoHeight,
  logoUpdatedAt: row.logoUpdatedAt?.toISOString() ?? null,
});

const ORDER_BY = [{ sortOrder: "asc" }, { code: "asc" }] as const;

/** รายการบริษัท — เรียงตามลำดับ; ค่าเริ่มต้นเฉพาะที่เปิดใช้งาน (สำหรับ dropdown) */
export const listCompanies = async (
  options: { includeInactive?: boolean } = {},
): Promise<OnsiteReportCompany[]> => {
  const rows = await db.onsiteReportCompany.findMany({
    where: options.includeInactive ? undefined : { isActive: true },
    orderBy: [...ORDER_BY],
    select: INFO_SELECT,
  });
  return rows.map(toInfo);
};

export const getCompany = async (
  code: string,
): Promise<OnsiteReportCompany | null> => {
  const row = await db.onsiteReportCompany.findUnique({
    where: { code },
    select: INFO_SELECT,
  });
  return row ? toInfo(row) : null;
};

export type CreateCompanyResult =
  | { status: "created"; company: OnsiteReportCompany }
  | { status: "duplicate" };

export const createCompany = async (
  input: CreateCompanyInput,
): Promise<CreateCompanyResult> => {
  try {
    const row = await db.onsiteReportCompany.create({
      data: {
        code: input.code,
        name: input.name,
        sortOrder: input.sortOrder ?? 0,
      },
      select: INFO_SELECT,
    });
    return { status: "created", company: toInfo(row) };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "duplicate" };
    }
    throw error;
  }
};

/** แก้ชื่อ/ลำดับ/สถานะ — code แก้ไม่ได้; null เมื่อไม่พบบริษัท */
export const updateCompany = async (
  code: string,
  input: UpdateCompanyInput,
): Promise<OnsiteReportCompany | null> => {
  try {
    const row = await db.onsiteReportCompany.update({
      where: { code },
      data: input,
      select: INFO_SELECT,
    });
    return toInfo(row);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
};

export type DeleteCompanyResult =
  | { status: "deleted" }
  | { status: "not_found" }
  | { status: "in_use"; reportCount: number };

/** ลบจริงได้เฉพาะบริษัทที่ยังไม่มีรายงานอ้างอิง (FK RESTRICT กันซ้ำอีกชั้น) */
export const deleteCompany = async (
  code: string,
): Promise<DeleteCompanyResult> => {
  const reportCount = await db.onsiteServiceReport.count({
    where: { company: code },
  });
  if (reportCount > 0) return { status: "in_use", reportCount };

  try {
    await db.onsiteReportCompany.delete({ where: { code } });
    return { status: "deleted" };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return { status: "not_found" };
      // มีรายงานถูกสร้างพร้อมกันระหว่างตรวจกับลบ
      if (error.code === "P2003") return { status: "in_use", reportCount: 1 };
    }
    throw error;
  }
};

/**
 * ตรวจว่าเลือกบริษัทนี้ให้รายงานได้ไหม — คืนข้อความ error ภาษาไทย หรือ null เมื่อผ่าน
 * บริษัทที่ปิดใช้งานเลือกใหม่ไม่ได้ แต่รายงานเดิมที่ใช้อยู่แล้วคงไว้ได้ (currentCompany)
 */
export const getCompanyAssignmentError = async (
  code: string,
  currentCompany?: string,
): Promise<string | null> => {
  const company = await db.onsiteReportCompany.findUnique({
    where: { code },
    select: { isActive: true },
  });
  if (!company) return "ไม่พบบริษัทที่เลือก";
  if (!company.isActive && code !== currentCompany) {
    return "บริษัทนี้ปิดใช้งานแล้ว กรุณาเลือกบริษัทอื่น";
  }
  return null;
};

// ─────────────────────────────────────────────
// โลโก้
// ─────────────────────────────────────────────

/** ไบต์ของโลโก้ — null เมื่อไม่มีบริษัทหรือยังไม่เคยอัปโหลด */
export const getCompanyLogo = async (
  code: string,
): Promise<OnsiteReportCompanyLogo | null> => {
  const row = await db.onsiteReportCompany.findUnique({
    where: { code },
    select: {
      logoData: true,
      logoMimeType: true,
      logoWidth: true,
      logoHeight: true,
      logoUpdatedAt: true,
    },
  });
  if (
    !row?.logoData ||
    !row.logoMimeType ||
    !row.logoWidth ||
    !row.logoHeight ||
    !row.logoUpdatedAt
  ) {
    return null;
  }
  return {
    data: Buffer.from(row.logoData),
    mimeType: row.logoMimeType,
    width: row.logoWidth,
    height: row.logoHeight,
    updatedAt: row.logoUpdatedAt,
  };
};

/** อัปโหลด/แทนที่โลโก้ — null เมื่อไม่พบบริษัท */
export const setCompanyLogo = async (
  code: string,
  userId: string,
  image: DetectedLogoImage,
  data: Uint8Array,
): Promise<OnsiteReportCompany | null> => {
  try {
    const row = await db.onsiteReportCompany.update({
      where: { code },
      data: {
        logoData: Buffer.from(data),
        logoMimeType: image.mimeType,
        logoWidth: image.width,
        logoHeight: image.height,
        logoUpdatedAt: new Date(),
        logoUpdatedById: userId,
      },
      select: INFO_SELECT,
    });
    return toInfo(row);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
};

/** ลบโลโก้ — false เมื่อไม่พบบริษัท */
export const clearCompanyLogo = async (
  code: string,
  userId: string,
): Promise<boolean> => {
  const result = await db.onsiteReportCompany.updateMany({
    where: { code },
    data: {
      logoData: null,
      logoMimeType: null,
      logoWidth: null,
      logoHeight: null,
      logoUpdatedAt: null,
      logoUpdatedById: userId,
    },
  });
  return result.count > 0;
};

/**
 * ชื่อ + โลโก้สำหรับ render PDF — ไม่ throw:
 * ไม่พบบริษัท/ดึงไม่ได้ → ใช้ code เป็นชื่อและออก PDF ไม่มีโลโก้ แทนที่จะทำให้ export ล้ม
 * (บริษัทที่ปิดใช้งานแล้วยังดึงได้ เพื่อให้รายงานเก่า export ได้เหมือนเดิม)
 */
export const loadCompanyForPdf = async (
  code: string,
): Promise<OnsiteReportPdfCompany> => {
  // ฟอร์มยังไม่ได้เลือกบริษัท (ตัวอย่างระหว่างกรอก) — ไม่ต้องไปถาม DB
  if (code === "") return { name: "", logo: null };
  try {
    const [company, logo] = await Promise.all([
      db.onsiteReportCompany.findUnique({
        where: { code },
        select: { name: true },
      }),
      getCompanyLogo(code),
    ]);
    return { name: company?.name ?? code, logo };
  } catch (error) {
    console.error(
      "[onsite-report] โหลดข้อมูลบริษัทไม่สำเร็จ — ออก PDF แบบไม่มีโลโก้:",
      (error as Error)?.message ?? error,
    );
    return { name: code, logo: null };
  }
};

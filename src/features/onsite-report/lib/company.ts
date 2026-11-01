/**
 * Schema ของบริษัทผู้ออกเอกสาร (isomorphic — ใช้ทั้งฟอร์ม admin, API และ test)
 */
import { z } from "zod";

/**
 * code ใช้เป็น key ที่รายงานอ้างอิงและอยู่ใน URL path (/companies/$code/...)
 * จึงจำกัดเป็นตัวพิมพ์ใหญ่/ตัวเลข/ขีด — ห้ามแก้หลังสร้าง
 */
export const companyCodeSchema = z
  .string()
  .regex(
    /^[A-Z0-9][A-Z0-9_-]{1,31}$/,
    "code ใช้ได้เฉพาะ A-Z 0-9 _ - (2-32 ตัว) และต้องขึ้นต้นด้วยตัวอักษรหรือตัวเลข",
  );

const companyNameSchema = z
  .string()
  .trim()
  .min(1, "กรุณากรอกชื่อบริษัท")
  .max(120, "ชื่อบริษัทต้องไม่เกิน 120 ตัวอักษร");

const sortOrderSchema = z
  .number({ message: "ลำดับต้องเป็นตัวเลข" })
  .int("ลำดับต้องเป็นจำนวนเต็ม")
  .min(0, "ลำดับต้องไม่ติดลบ")
  .max(9999, "ลำดับต้องไม่เกิน 9999");

/** POST /api/onsite-reports/companies */
export const createCompanySchema = z.object({
  code: companyCodeSchema,
  name: companyNameSchema,
  sortOrder: sortOrderSchema.optional(),
});

/** PATCH /api/onsite-reports/companies/$code — code แก้ไม่ได้ */
export const updateCompanySchema = z
  .object({
    name: companyNameSchema.optional(),
    sortOrder: sortOrderSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "ไม่มีข้อมูลให้แก้ไข",
  });

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

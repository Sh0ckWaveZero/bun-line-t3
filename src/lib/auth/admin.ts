/**
 * Admin Permission Helpers
 * ตรวจสอบสิทธิ์ admin สำหรับ LINE และ web operations
 */
import { env } from "@/env.mjs";
import { db } from "@/lib/database/db";

/**
 * ตรวจสอบว่า LINE userId อยู่ใน whitelist admin หรือไม่
 * @param lineUserId LINE userId (providerAccountId)
 * @returns true ถ้าเป็น admin
 */
export const isAdminLineUser = (lineUserId: string): boolean => {
  const adminIds = env.ADMIN_LINE_USER_IDS;

  // ถ้าไม่ได้ตั้งค่า → ไม่มี admin ใดๆ (ปลอดภัย default)
  if (!adminIds || adminIds.trim() === "") {
    return false;
  }

  // Parse comma-separated list
  const whitelist = adminIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return whitelist.includes(lineUserId);
};

/**
 * ตรวจสอบว่า LINE userId เป็น admin หรือไม่ (พร้อม throw error)
 * @throws Error ถ้าไม่ใช่ admin
 */
export const requireAdminLineUser = (lineUserId: string): void => {
  if (!isAdminLineUser(lineUserId)) {
    throw new Error("คุณไม่มีสิทธิ์ดำเนินการนี้");
  }
};

/**
 * ตรวจสอบว่า session user เป็น admin LINE user หรือไม่
 * ใช้สำหรับ web admin UI
 * @param lineUserId LINE userId จาก session
 * @returns true ถ้าเป็น admin
 */
export const canManageApprovals = (lineUserId: string | undefined): boolean => {
  if (!lineUserId) return false;
  return isAdminLineUser(lineUserId);
};

/**
 * ตรวจสอบสิทธิ์ admin จากทั้ง env whitelist และฐานข้อมูล
 * ใช้กับ API/server-side logic ที่ต้องรองรับ admin ที่ตั้งผ่านหน้าเว็บ
 */
export const canManageApprovalsAsync = async (
  lineUserId: string | undefined,
): Promise<boolean> => {
  if (!lineUserId) return false;
  if (isAdminLineUser(lineUserId)) return true;

  const account = await db.account.findFirst({
    where: {
      provider: "line",
      providerAccountId: lineUserId,
      user: {
        role: "admin",
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(account);
};

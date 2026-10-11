import { db } from "@/lib/database";

/**
 * แปลง Date → "YYYY-MM-DD" ตามเขตเวลา Asia/Bangkok
 * (app นี้เป็น attendance เวลาไทย — ใช้ toISOString ตรง ๆ จะเพี้ยนไปวันก่อนหน้า
 * เมื่อ Date เป็นเที่ยงคืน local)
 */
const toBangkokDateKey = (date: Date): string =>
  date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

/**
 * ตรวจสอบว่า user ทำ WFH วันที่ระบุหรือไม่ (return true ถ้าทำ WFH)
 * เฉพาะ type "wfh" เท่านั้น — onsite ไม่ถือว่า WFH
 */
export const isUserWfh = async (
  userId: string,
  date: Date,
): Promise<boolean> => {
  const dateString = toBangkokDateKey(date);
  const workModeDay = await db.workModeDay.findFirst({
    where: {
      userId,
      date: dateString,
      type: "wfh",
      isActive: true,
    },
  });
  return !!workModeDay;
};

/**
 * ดึงวัน WFH / On Site ทั้งหมดของ user ในช่วงเดือนนั้น (YYYY-MM)
 */
export const getUserWorkModeDaysInMonth = async (
  userId: string,
  month: string,
) => {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("รูปแบบเดือนไม่ถูกต้อง (YYYY-MM)");
  }
  const [yearRaw, monthNumRaw] = month.split("-");
  const year = yearRaw as string;
  const monthNum = monthNumRaw as string;
  const firstDay = `${year}-${monthNum}-01`;
  const lastDay = new Date(
    parseInt(year, 10),
    parseInt(monthNum, 10),
    0,
  ).getDate();
  const lastDayStr = `${year}-${monthNum}-${lastDay.toString().padStart(2, "0")}`;
  return db.workModeDay.findMany({
    where: {
      userId,
      date: { gte: firstDay, lte: lastDayStr },
      isActive: true,
    },
    orderBy: { date: "asc" },
  });
};

/**
 * ทำเครื่องหมายวัน WFH / On Site สำหรับ user (upsert — mark ซ้ำหรือเปลี่ยน type ได้)
 * วันที่ type "wfh" จะไม่ได้รับการแจ้งเตือนเช็คอินจาก cron
 */
export const markWorkModeDay = async (input: {
  userId: string;
  date: string;
  type: "wfh" | "onsite";
  note?: string;
}) => {
  if (!input.userId || !input.date) {
    throw new Error("userId และ date จำเป็นต้องระบุ");
  }
  return db.workModeDay.upsert({
    where: {
      userId_date: { userId: input.userId, date: input.date },
    },
    create: {
      userId: input.userId,
      date: input.date,
      type: input.type,
      note: input.note,
      isActive: true,
    },
    update: {
      type: input.type,
      note: input.note,
      isActive: true,
    },
  });
};

/**
 * ยกเลิกวัน WFH / On Site ของ user (soft delete เพื่อรักษาประวัติ)
 */
export const unmarkWorkModeDay = async (userId: string, date: string) => {
  if (!userId || !date) {
    throw new Error("userId และ date จำเป็นต้องระบุ");
  }
  const result = await db.workModeDay.updateMany({
    where: { userId, date, isActive: true },
    data: { isActive: false },
  });
  return result.count > 0;
};

export const workModeService = {
  isUserWfh,
  getUserWorkModeDaysInMonth,
  markWorkModeDay,
  unmarkWorkModeDay,
};

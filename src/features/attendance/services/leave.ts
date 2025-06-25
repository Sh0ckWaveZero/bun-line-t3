import { db } from '@/lib/database';


/**
 * ตรวจสอบว่าวันนี้ user ลาหรือไม่ (return true ถ้าลา)
 */
export const isUserOnLeave = async (userId: string, date: Date): Promise<boolean> => {
  const dateString = date.toISOString().split('T')[0];
  const leave = await db.leave.findFirst({
    where: {
      userId,
      date: dateString,
      isActive: true
    }
  });
  return !!leave;
};

/**
 * ดึงวันลาทั้งหมดของ user ในช่วงเดือนนั้น (YYYY-MM)
 */
export const getUserLeavesInMonth = async (userId: string, month: string) => {
  const [yearRaw, monthNumRaw] = month.split('-');
  const year: string = typeof yearRaw === 'string' && yearRaw ? yearRaw : '1970';
  const monthNum: string = typeof monthNumRaw === 'string' && monthNumRaw ? monthNumRaw : '01';
  const firstDay = `${year}-${monthNum.padStart(2, '0')}-01`;
  const lastDay = new Date(parseInt(year, 10), parseInt(monthNum, 10), 0).getDate();
  const lastDayStr = `${year}-${monthNum.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
  return db.leave.findMany({
    where: {
      userId,
      date: { gte: firstDay, lte: lastDayStr },
      isActive: true
    }
  });
};

/**
 * สร้างวันลาสำหรับ user (validate input ก่อนบันทึก)
 */
export const createLeave = async (input: {
  userId: string;
  date: string;
  type?: string;
  reason?: string;
  isActive?: boolean;
}) => {
  if (!input.userId || !input.date) {
    throw new Error('userId และ date จำเป็นต้องระบุ');
  }
  // ป้องกัน duplicate leave ในวันเดียวกัน
  const exists = await db.leave.findFirst({
    where: { userId: input.userId, date: input.date, isActive: true }
  });
  if (exists) {
    throw new Error('มีการลาวันนี้แล้ว');
  }
  return db.leave.create({
    data: {
      userId: input.userId,
      date: input.date,
      type: input.type || 'personal',
      reason: input.reason,
      isActive: input.isActive !== false
    }
  });
};

export const leaveService = {
  isUserOnLeave,
  getUserLeavesInMonth,
  createLeave
};

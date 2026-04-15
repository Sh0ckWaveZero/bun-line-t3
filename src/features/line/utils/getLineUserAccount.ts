import { db } from "@/lib/database/db";

/**
 * ดึง LINE userId จาก event และ account ที่ผูกไว้ในระบบ
 * คืน null ถ้าไม่มี userId หรือยังไม่ได้ผูก account
 */
export const getLineUserAccount = async (event: any) => {
  const userId: string | undefined = event?.source?.userId;
  if (!userId) return null;

  const account = await db.account.findFirst({ where: { accountId: userId } });
  return account ?? null;
};

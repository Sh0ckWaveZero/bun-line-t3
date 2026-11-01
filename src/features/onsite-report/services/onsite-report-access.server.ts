/**
 * สิทธิ์ใช้งาน Onsite Service Report
 * Server-only
 *
 * - admin ใช้ได้เสมอ
 * - ผู้ใช้ทั่วไปต้องมีบัญชี LINE ที่ผ่านการอนุมัติ และแอดมินติ๊กสิทธิ์ canUseOnsiteReport
 *   (หน้า /admin/line-permissions) — ไม่มีบัญชี LINE = ไม่มีสิทธิ์ (ปฏิเสธไว้ก่อน)
 */
import { db } from "@/lib/database/db";
import { canUseOnsiteReport } from "@/features/line/line/permissions";

export const canUseOnsiteReportFeature = async (user: {
  userId: string;
  isAdmin: boolean;
}): Promise<boolean> => {
  if (user.isAdmin) return true;

  const lineAccount = await db.account.findFirst({
    where: { userId: user.userId, providerId: "line" },
    select: { accountId: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!lineAccount) return false;

  return canUseOnsiteReport(lineAccount.accountId);
};

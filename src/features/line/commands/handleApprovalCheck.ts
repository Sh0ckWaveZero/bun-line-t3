/**
 * handleApprovalCheck
 * ตรวจสอบสถานะการอนุมัติของ LINE user ก่อนประมวลผล event
 *
 * คืนค่า:
 * - true  → ผ่าน (approved) ดำเนินการต่อได้
 * - false → ไม่ผ่าน (new/pending/rejected) ได้ส่ง reply ไปให้ user แล้ว
 */
import { approvalService } from "../services/approval.service";
import { APPROVAL_CHECK_RESULT } from "../types/approval.types";

/**
 * ดึงโปรไฟล์ LINE user จาก Messaging API
 */
const fetchLineProfile = async (
  userId: string,
  accessToken: string,
): Promise<{ displayName?: string; pictureUrl?: string; statusMessage?: string }> => {
  try {
    const res = await fetch(
      `https://api.line.me/v2/bot/profile/${userId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!res.ok) return {};
    return (await res.json()) as {
      displayName?: string;
      pictureUrl?: string;
      statusMessage?: string;
    };
  } catch {
    return {};
  }
};

export const handleApprovalCheck = async (
  req: any,
): Promise<boolean> => {
  const event = req.body?.events?.[0];
  const source = event?.source;

  // ดึง userId จาก source (user, group, room ล้วนๆ มี userId ของผู้ส่ง)
  const userId: string | undefined = source?.userId;

  // ✅ รองรับทั้ง user, group, และ room events
  // userId คือ ID ของผู้ส่งข้อความ ไม่ว่าจะอยู่ใน 1:1, group, หรือ room
  if (!userId) {
    console.warn("[handleApprovalCheck] Event ไม่มี userId - ข้ามการตรวจสอบ");
    return false;
  }

  // ดึงโปรไฟล์ LINE user
  const { LINE_CHANNEL_ACCESS } = process.env;
  const profile = LINE_CHANNEL_ACCESS
    ? await fetchLineProfile(userId, LINE_CHANNEL_ACCESS)
    : {};

  const status = await approvalService.checkApprovalStatus({
    userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    statusMessage: profile.statusMessage,
  });

  switch (status) {
    case APPROVAL_CHECK_RESULT.APPROVED:
      // ✅ ผ่าน — ดำเนินการต่อ
      return true;

    case APPROVAL_CHECK_RESULT.NEW:
      // 🆕 สร้าง request ใหม่ — แจ้งให้รอ
      await approvalService.sendPendingNewMessage(userId);
      return false;

    case APPROVAL_CHECK_RESULT.PENDING:
      // ⏳ ยังรออยู่ — แจ้งซ้ำ
      await approvalService.sendPendingMessage(userId);
      return false;

    case APPROVAL_CHECK_RESULT.REJECTED:
      // ❌ ถูกปฏิเสธ — แจ้งปฏิเสธ (ไม่ส่ง reason ซ้ำ เพราะส่งตอน reject ไปแล้ว)
      await approvalService.sendRejectedMessage(userId);
      return false;

    default:
      return false;
  }
};

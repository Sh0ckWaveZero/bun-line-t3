/**
 * handleApprovalCheck
 * ตรวจสอบสถานะการอนุมัติของ LINE user ก่อนประมวลผล event
 *
 * คืนค่า:
 * - true  → ผ่าน (approved) ดำเนินการต่อได้
 * - false → ไม่ผ่าน (new/pending/rejected) ได้ส่ง reply ไปให้ user แล้ว
 */
import { approvalService } from "../services/approval.service";

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
  const userId: string | undefined = event?.source?.userId;

  // ถ้าไม่มี userId (group/room event ที่ไม่มี user) → ผ่านไปเลย
  if (!userId) return true;

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
    case "APPROVED":
      // ✅ ผ่าน — ดำเนินการต่อ
      return true;

    case "NEW":
      // 🆕 สร้าง request ใหม่ — แจ้งให้รอ
      await approvalService.sendPendingNewMessage(userId);
      return false;

    case "PENDING":
      // ⏳ ยังรออยู่ — แจ้งซ้ำ
      await approvalService.sendPendingMessage(userId);
      return false;

    case "REJECTED":
      // ❌ ถูกปฏิเสธ — แจ้งปฏิเสธ (ไม่ส่ง reason ซ้ำ เพราะส่งตอน reject ไปแล้ว)
      await approvalService.sendRejectedMessage(userId);
      return false;

    default:
      return false;
  }
};

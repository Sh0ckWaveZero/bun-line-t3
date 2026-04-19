import { db } from "@/lib/database/db";

/**
 * ตรวจสอบและ merge accounts ที่มี LINE Messaging API ID เดียวกัน
 *
 * ใช้กรณีที่ user ลงชื่อเข้าใช้ด้วย LINE Login หลายครั้ง
 * แต่ได้ LINE Messaging API ID เดียวกัน (เช่น ลงทะเบียนผ่าน Bot ก่อนแล้ว)
 *
 * @param lineMessagingApiUserId LINE Messaging API user ID ที่ต้องการตรวจสอบ
 * @returns Account ที่ควรใช้ (ถ้ามีการ merge)
 */
export const findAndMergeDuplicateLineAccounts = async (
  lineMessagingApiUserId: string,
) => {
  // ค้นหา accounts ทั้งหมดที่มี LINE Messaging API ID เดียวกัน
  const accounts = await db.account.findMany({
    where: {
      providerId: "line",
      lineMessagingApiUserId,
    },
    select: {
      id: true,
      userId: true,
      accountId: true, // LINE Login ID
      lineMessagingApiUserId: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc", // ใช้ account ที่สร้างก่อนเป็นหลัก
    },
  });

  if (accounts.length <= 1) {
    // ไม่มี duplicate หรือมี account เดียว
    return null;
  }

  console.log(
    `[Account Linking] Found ${accounts.length} accounts with LINE Messaging API ID: ${lineMessagingApiUserId}`,
  );

  // เลือก account แรก (เก่าสุด) เป็น primary account
  const primaryAccount = accounts[0];
  const primaryUserId = primaryAccount.userId;

  // Merge accounts: ย้าย sessions และข้อมูลอื่นๆ ไปยัง primary user
  for (let i = 1; i < accounts.length; i++) {
    const duplicateAccount = accounts[i];
    const duplicateUserId = duplicateAccount.userId;

    console.log(
      `[Account Linking] Merging user ${duplicateUserId} → ${primaryUserId}`,
    );

    try {
      // ย้าย sessions ไปยัง primary user
      await db.session.updateMany({
        where: { userId: duplicateUserId },
        data: { userId: primaryUserId },
      });

      // อัปเดตข้อมูลอื่นๆ ที่อ้างอิงถึง duplicate user
      // (เช่น WorkAttendance, Leave, etc.)
      await db.workAttendance.updateMany({
        where: { userId: duplicateUserId },
        data: { userId: primaryUserId },
      });

      await db.leave.updateMany({
        where: { userId: duplicateUserId },
        data: { userId: primaryUserId },
      });

      await db.userSettings.update({
        where: { userId: duplicateUserId },
        data: { userId: primaryUserId },
      });

      // ลบ duplicate account
      await db.account.delete({
        where: { id: duplicateAccount.id },
      });

      // ลบ duplicate user (ถ้าไม่มี account อื่นๆ เหลือ)
      const remainingAccounts = await db.account.count({
        where: { userId: duplicateUserId },
      });

      if (remainingAccounts === 0) {
        await db.user.delete({
          where: { id: duplicateUserId },
        });
        console.log(
          `[Account Linking] Deleted duplicate user: ${duplicateUserId}`,
        );
      }

      console.log(
        `[Account Linking] ✅ Successfully merged user ${duplicateUserId} → ${primaryUserId}`,
      );
    } catch (error) {
      console.error(
        `[Account Linking] ❌ Failed to merge user ${duplicateUserId} → ${primaryUserId}:`,
        error,
      );
    }
  }

  return primaryAccount;
};

/**
 * ตรวจสอบว่า LINE Messaging API user ID นี้มีอยู่ในระบบแล้วหรือไม่
 *
 * @param lineMessagingApiUserId LINE Messaging API user ID ที่ต้องการตรวจสอบ
 * @returns Account ที่มี LINE Messaging API ID นี้ (ถ้ามี)
 */
export const findAccountByLineMessagingApiId = async (
  lineMessagingApiUserId: string,
) => {
  return await db.account.findFirst({
    where: {
      providerId: "line",
      OR: [
        { lineMessagingApiUserId },
        { accountId: lineMessagingApiUserId },
      ],
    },
    select: {
      id: true,
      userId: true,
      accountId: true,
      lineMessagingApiUserId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
  });
};

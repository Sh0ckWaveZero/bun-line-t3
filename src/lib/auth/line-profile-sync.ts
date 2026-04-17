import { db } from "@/lib/database/db";

interface LineLoginProfile {
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
  userId?: string;
}

interface SyncLineProfileInput {
  accessToken?: string | null;
  fallbackDisplayName?: string | null;
  fallbackPictureUrl?: string | null;
  lineUserId: string;
  userId: string;
}

interface SyncedLineProfile {
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
}

const fetchLineLoginProfile = async (
  accessToken: string,
): Promise<LineLoginProfile | null> => {
  try {
    const response = await fetch("https://api.line.me/v2/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as LineLoginProfile;
  } catch {
    return null;
  }
};

/**
 * ค้นหา LineApprovalRequest ที่ approved แล้วซึ่งตรงกับ profile นี้
 * ใช้สำหรับ link LINE Login user ID กับ Messaging API user ID
 *
 * LINE ออก userId คนละตัวต่อ channel ดังนั้น:
 * - lineUserId = user ID จาก Messaging API (Bot channel)
 * - loginLineUserId = user ID จาก LINE Login channel (web app)
 */
const findApprovedRequestByProfile = async (
  lineUserId: string,
  pictureUrl?: string,
  displayName?: string,
) => {
  // 1. ค้นหาด้วย pictureUrl ก่อน (แม่นยำที่สุด)
  if (pictureUrl) {
    const byPicture = await db.lineApprovalRequest.findFirst({
      where: {
        pictureUrl,
        status: "APPROVED",
        NOT: { lineUserId }, // ไม่ใช่ record ของ lineUserId เดิม
        OR: [
          { loginLineUserId: null },
          { loginLineUserId: lineUserId }, // อาจ link แล้ว
        ],
      },
      select: { id: true, lineUserId: true, loginLineUserId: true },
    });
    if (byPicture) return byPicture;
  }

  // 2. Fallback: ค้นหาด้วย displayName (เฉพาะกรณีชื่อ unique)
  if (displayName) {
    const byName = await db.lineApprovalRequest.findMany({
      where: {
        displayName,
        status: "APPROVED",
        NOT: { lineUserId },
        OR: [
          { loginLineUserId: null },
          { loginLineUserId: lineUserId },
        ],
      },
      select: { id: true, lineUserId: true, loginLineUserId: true },
    });
    // ชื่อซ้ำกันได้ ใช้เฉพาะเมื่อมีผลลัพธ์เดียว
    if (byName.length === 1) return byName[0];
  }

  return null;
};

export const syncLineProfileToDatabase = async ({
  accessToken,
  fallbackDisplayName,
  fallbackPictureUrl,
  lineUserId,
  userId,
}: SyncLineProfileInput): Promise<SyncedLineProfile> => {
  const lineProfile = accessToken
    ? await fetchLineLoginProfile(accessToken)
    : null;

  const displayName = lineProfile?.displayName ?? fallbackDisplayName ?? undefined;
  const pictureUrl = lineProfile?.pictureUrl ?? fallbackPictureUrl ?? undefined;
  const statusMessage = lineProfile?.statusMessage;
  const userUpdateData = {
    ...(displayName ? { name: displayName } : {}),
    ...(pictureUrl ? { image: pictureUrl } : {}),
  };
  const approvalUpdateData = {
    ...(displayName ? { displayName } : {}),
    ...(pictureUrl ? { pictureUrl } : {}),
    ...(statusMessage !== undefined ? { statusMessage } : {}),
  };
  const approvalUpdate =
    Object.keys(approvalUpdateData).length > 0
      ? approvalUpdateData
      : { updatedAt: new Date() };

  if (Object.keys(userUpdateData).length > 0) {
    await db.user.update({
      where: { id: userId },
      data: userUpdateData,
    });
  }

  // ตรวจสอบว่า lineUserId นี้มาจาก LINE Login channel ที่ต่างจาก Messaging API
  // โดยหา approved record ที่ profile ตรงกัน แต่ lineUserId ต่างกัน
  const existingApproved = await findApprovedRequestByProfile(
    lineUserId,
    pictureUrl,
    displayName,
  );

  if (existingApproved) {
    // พบ approved record ของ user คนเดียวกันจาก Bot channel
    // → link LINE Login user ID ไว้ใน loginLineUserId
    console.log(
      `[LINE Profile Sync] Linking login channel ID ${lineUserId} → bot channel ID ${existingApproved.lineUserId}`,
    );
    await db.lineApprovalRequest.update({
      where: { id: existingApproved.id },
      data: {
        loginLineUserId: lineUserId,
        ...approvalUpdateData,
      },
    });
  } else {
    // ไม่พบ approved record ที่ตรงกัน → upsert ตามปกติ
    // (อาจเป็น lineUserId เดียวกับ Bot channel หรือ user ใหม่)
    await db.lineApprovalRequest.upsert({
      where: { lineUserId },
      create: {
        lineUserId,
        displayName,
        pictureUrl,
        statusMessage: statusMessage ?? null,
        status: "PENDING",
      },
      update: approvalUpdate,
    });
  }

  return {
    displayName,
    pictureUrl,
    statusMessage,
  };
};

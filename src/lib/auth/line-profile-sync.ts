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

  const displayName =
    lineProfile?.displayName ?? fallbackDisplayName ?? undefined;
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

  // Sync เฉพาะ LINE userId ที่ LINE ส่งมากับ session นี้เท่านั้น
  // ห้าม match ด้วย profile/approval เพราะอาจ map ข้าม user ได้
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

  return {
    displayName,
    pictureUrl,
    statusMessage,
  };
};

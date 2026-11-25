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

const isUniqueConstraintError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "P2002";

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
      console.warn(
        `[LINE Profile Sync] /v2/profile failed: HTTP ${response.status}`,
      );
      return null;
    }

    return (await response.json()) as LineLoginProfile;
  } catch (err) {
    console.warn("[LINE Profile Sync] /v2/profile fetch error:", err);
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
  let isNewApprovalRequest = false;

  try {
    await db.lineApprovalRequest.create({
      data: {
        lineUserId,
        displayName,
        pictureUrl,
        statusMessage: statusMessage ?? null,
        status: "PENDING",
      },
    });
    isNewApprovalRequest = true;
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;

    const existingApprovalRequest = await db.lineApprovalRequest.findUnique({
      where: { lineUserId },
      select: { id: true },
    });
    if (!existingApprovalRequest) throw error;

    await db.lineApprovalRequest.update({
      where: { lineUserId },
      data: approvalUpdate,
    });
  }

  if (isNewApprovalRequest) {
    void import("@/features/line/services/approval.service.server")
      .then(({ approvalService }) =>
        approvalService.notifyAdminsOfNewRequest({
          userId: lineUserId,
          displayName,
          pictureUrl,
          statusMessage,
        }),
      )
      .catch((error: unknown) => {
        console.error("[LINE Profile Sync] Admin notification failed", {
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      });
  }

  return {
    displayName,
    pictureUrl,
    statusMessage,
  };
};

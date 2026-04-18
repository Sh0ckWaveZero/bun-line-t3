import { db } from "@/lib/database/db";
import { getServerAuthSession } from "./auth";
import type { AppSession } from "./session-context";

interface LineAccountIdentity {
  accountId: string;
}

interface LineApprovalIdentity {
  lineUserId: string;
  loginLineUserId: string | null;
}

const uniqueIds = (lineUserIds: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      lineUserIds
        .map((lineUserId) => lineUserId?.trim())
        .filter((lineUserId): lineUserId is string => Boolean(lineUserId)),
    ),
  );

/**
 * ดึง LINE user IDs ทั้งหมดที่ approved และตรงกับ session profile นี้
 *
 * รองรับกรณีที่ LINE Login channel ID ≠ Messaging API (Bot) channel ID
 * → คืน lineUserId (Bot) และ loginLineUserId (Login) ทั้งคู่
 */
const findApprovedProfileLineUserIds = async (
  session: AppSession,
  accountLineUserIds: string[],
): Promise<string[]> => {
  const now = new Date();
  const activeApprovalWhere = {
    status: "APPROVED" as const,
    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
  };

  const extractAllIds = (approvals: LineApprovalIdentity[]): string[] =>
    uniqueIds(
      approvals.flatMap((a) => [a.lineUserId, a.loginLineUserId]),
    );

  if (session.user?.image) {
    const approvals = await db.lineApprovalRequest.findMany({
      where: {
        ...activeApprovalWhere,
        pictureUrl: session.user.image,
      },
      select: { lineUserId: true, loginLineUserId: true },
      orderBy: { updatedAt: "desc" },
    });

    const matchedIds = extractAllIds(approvals as LineApprovalIdentity[]);
    if (matchedIds.length > 0) {
      return [
        ...matchedIds.filter(
          (lineUserId) => !accountLineUserIds.includes(lineUserId),
        ),
        ...matchedIds.filter((lineUserId) =>
          accountLineUserIds.includes(lineUserId),
        ),
      ];
    }
  }

  if (!session.user?.name) return [];

  const approvals = await db.lineApprovalRequest.findMany({
    where: {
      ...activeApprovalWhere,
      displayName: session.user.name,
    },
    select: { lineUserId: true, loginLineUserId: true },
    orderBy: { updatedAt: "desc" },
  });
  const matchedIds = extractAllIds(approvals as LineApprovalIdentity[]);

  // ชื่อซ้ำกันได้ จึง fallback ด้วยชื่อเฉพาะเมื่อ match ได้ record เดียวเท่านั้น
  if (approvals.length !== 1) return [];

  return matchedIds;
};

/**
 * ดึง LINE User ID จาก session ของ user ที่ login อยู่
 *
 * LINE User ID เก็บอยู่ใน Account.accountId (provider = "line")
 * ซึ่งเป็น `sub` ที่ได้จาก LINE OAuth (เช่น Ub1234567890)
 *
 * @returns LINE User ID หรือ null ถ้าไม่ได้ login / ไม่มี LINE account
 */
export async function getLineUserId(request: Request): Promise<string | null> {
  const lineUserIds = await getLineUserIds(request);
  const primaryId = lineUserIds[0] ?? null;

  console.log(`🎯 [getLineUserId] Primary User ID:`, {
    primaryId,
    totalIds: lineUserIds.length,
    allIds: lineUserIds,
  });

  return primaryId;
}

/**
 * ดึง LINE User IDs ทั้งหมดที่เกี่ยวข้องกับ session user
 *
 * รองรับกรณีที่ LINE Login channel ID ≠ Messaging API (Bot) channel ID
 * → คืนทั้ง lineUserId (Bot) และ loginLineUserId (Login) ทั้งคู่
 *
 * Priority:
 * 1. Bot IDs ที่ link กับ Login IDs ผ่าน approval
 * 2. Login IDs จาก account (LINE Login OAuth)
 * 3. Bot IDs ที่ match ผ่าน profile (pictureUrl, displayName)
 */
export async function getLineUserIds(request: Request): Promise<string[]> {
  const session = await getServerAuthSession(request);

  if (!session?.user?.id) return [];

  console.log(`🔍 [getLineUserIds] Session user:`, {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });

  const accounts = await db.account.findMany({
    where: {
      userId: session.user.id,
      providerId: "line",
    },
    select: {
      accountId: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const accountLineUserIds = uniqueIds(
    (accounts as LineAccountIdentity[]).map((account) => account.accountId),
  );

  console.log(`📋 [getLineUserIds] Login User IDs (from OAuth):`, accountLineUserIds);

  // 1. หา Bot IDs ที่ link ผ่าน approval (loginLineUserId ตรงกับ account IDs)
  const linkedApprovals = await db.lineApprovalRequest.findMany({
    where: {
      status: "APPROVED",
      OR: [
        { lineUserId: { in: accountLineUserIds } },
        { loginLineUserId: { in: accountLineUserIds } },
      ],
    },
    select: { lineUserId: true, loginLineUserId: true },
  });

  console.log(`🔗 [getLineUserIds] Linked approvals:`, linkedApprovals.map(a => ({
    botId: a.lineUserId,
    loginId: a.loginLineUserId,
  })));

  const linkedBotIds = uniqueIds(
    linkedApprovals.flatMap((a: { lineUserId: string; loginLineUserId: string | null }) => [
      a.lineUserId,
      a.loginLineUserId,
    ]),
  );

  // 2. หา Bot IDs ที่ match ผ่าน profile (pictureUrl, displayName)
  const approvedProfileLineUserIds = await findApprovedProfileLineUserIds(
    session,
    accountLineUserIds,
  );

  console.log(`👤 [getLineUserIds] Profile-matched Bot IDs:`, approvedProfileLineUserIds);

  // 3. รวมทุกอย่าง: Bot IDs (จาก linked + profile) + Login IDs (จาก account)
  const allIds = uniqueIds([
    ...linkedBotIds,
    ...approvedProfileLineUserIds,
    ...accountLineUserIds,
  ]);

  console.log(`✅ [getLineUserIds] Final User IDs (${allIds.length}):`, allIds);

  return allIds;
}

/**
 * ใช้ lineUserId จาก client payload ได้เฉพาะเมื่อเป็น ID ที่ผูกกับ session นี้
 */
export async function getAuthorizedLineUserId(
  request: Request,
  requestedLineUserId?: string | null,
): Promise<string | null> {
  const lineUserIds = await getLineUserIds(request);
  if (lineUserIds.length === 0) return null;

  const normalizedRequestedLineUserId = requestedLineUserId?.trim();
  if (!normalizedRequestedLineUserId) {
    const primaryId = lineUserIds[0] ?? null;

    console.log(`✅ [getAuthorizedLineUserId] Using primary ID (no request):`, {
      primaryId,
      totalIds: lineUserIds.length,
    });

    return primaryId;
  }

  const isAuthorized = lineUserIds.includes(normalizedRequestedLineUserId);
  const authorizedId = isAuthorized ? normalizedRequestedLineUserId : null;

  console.log(`🔐 [getAuthorizedLineUserId] Authorization check:`, {
    requestedId: normalizedRequestedLineUserId,
    authorizedId,
    isAuthorized,
    availableIds: lineUserIds,
  });

  return authorizedId;
}

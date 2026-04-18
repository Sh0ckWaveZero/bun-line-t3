import { db } from "@/lib/database/db";
import { getServerAuthSession } from "./auth";

interface LineAccountIdentity {
  id: string;
  accountId: string;
  lineMessagingApiUserId: string | null;
  updatedAt: Date;
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
 * ดึง LINE User ID ของ session นี้จาก LINE OAuth account โดยตรงเท่านั้น
 * ไม่ merge ID จาก approval/profile matching เพื่อกันการ map ข้าม user
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
      id: true,
      lineMessagingApiUserId: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const accountIdentities = accounts as LineAccountIdentity[];
  const primaryAccount = accountIdentities.find((account) =>
    Boolean(account.accountId.trim()),
  );

  if (primaryAccount && accountIdentities.length > 1) {
    const staleAccountIds = accountIdentities
      .filter((account) => account.id !== primaryAccount.id)
      .map((account) => account.id);

    if (staleAccountIds.length > 0) {
      await db.account.deleteMany({
        where: {
          id: { in: staleAccountIds },
          providerId: "line",
          userId: session.user.id,
        },
      });

      console.warn(`🧹 [getLineUserIds] Removed duplicate LINE accounts:`, {
        keptAccountId: primaryAccount.accountId,
        removedAccountIds: accountIdentities
          .filter((account) => staleAccountIds.includes(account.id))
          .map((account) => account.accountId),
        userId: session.user.id,
      });
    }
  }

  const activeAccounts = primaryAccount ? [primaryAccount] : [];
  const lineUserIds = uniqueIds([primaryAccount?.accountId]);

  console.log(`📋 [getLineUserIds] LINE OAuth accounts:`, {
    accounts: activeAccounts.map((account) => ({
      id: account.id,
      accountId: account.accountId,
      storedMessagingId: account.lineMessagingApiUserId,
      updatedAt: account.updatedAt,
    })),
    selectedAccountId: primaryAccount?.accountId ?? null,
  });

  console.log(
    `✅ [getLineUserIds] Final User IDs (${lineUserIds.length}):`,
    lineUserIds,
  );

  return lineUserIds;
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

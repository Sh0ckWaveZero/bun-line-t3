import { db } from "@/lib/database/db";
import { getServerAuthSession } from "./auth";
import type { AppSession } from "./session-context";

interface LineAccountIdentity {
  accountId: string;
}

interface LineApprovalIdentity {
  lineUserId: string;
}

const uniqueIds = (lineUserIds: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      lineUserIds
        .map((lineUserId) => lineUserId?.trim())
        .filter((lineUserId): lineUserId is string => Boolean(lineUserId)),
    ),
  );

const findApprovedProfileLineUserIds = async (
  session: AppSession,
  accountLineUserIds: string[],
): Promise<string[]> => {
  const now = new Date();
  const activeApprovalWhere = {
    status: "APPROVED" as const,
    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
  };

  if (session.user?.image) {
    const approvals = await db.lineApprovalRequest.findMany({
      where: {
        ...activeApprovalWhere,
        pictureUrl: session.user.image,
        ...(session.user.name ? { displayName: session.user.name } : {}),
      },
      select: { lineUserId: true },
      orderBy: { updatedAt: "desc" },
    });

    const matchedIds = uniqueIds(
      (approvals as LineApprovalIdentity[]).map(
        (approval) => approval.lineUserId,
      ),
    );
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
    select: { lineUserId: true },
    orderBy: { updatedAt: "desc" },
  });
  const matchedIds = uniqueIds(
    (approvals as LineApprovalIdentity[]).map(
      (approval) => approval.lineUserId,
    ),
  );

  // ชื่อซ้ำกันได้ จึง fallback ด้วยชื่อเฉพาะเมื่อ match ได้ record เดียวเท่านั้น
  if (matchedIds.length !== 1) return [];

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
  return lineUserIds[0] ?? null;
}

/**
 * ดึง LINE User IDs ที่เกี่ยวข้องกับ session user
 *
 * LINE Login กับ LINE Messaging API อาจให้ userId คนละตัวถ้าอยู่คนละ provider
 * จึงเลือก approved bot/approval ID ที่ profile ตรงกันก่อน แล้วค่อย fallback
 * เป็น LINE Login accountId เพื่อไม่ให้ Auto DCA ถูกบันทึกใต้ user ผิดตัว
 */
export async function getLineUserIds(request: Request): Promise<string[]> {
  const session = await getServerAuthSession(request);

  if (!session?.user?.id) return [];

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
  const approvedProfileLineUserIds = await findApprovedProfileLineUserIds(
    session,
    accountLineUserIds,
  );

  return uniqueIds([...approvedProfileLineUserIds, ...accountLineUserIds]);
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
    return lineUserIds[0] ?? null;
  }

  return lineUserIds.includes(normalizedRequestedLineUserId)
    ? normalizedRequestedLineUserId
    : null;
}

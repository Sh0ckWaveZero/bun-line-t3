import { db } from "@/lib/database/db";
import { getServerAuthSession } from "./auth";

/**
 * ดึง LINE User ID จาก session ของ user ที่ login อยู่
 *
 * LINE User ID เก็บอยู่ใน Account.accountId (provider = "line")
 * ซึ่งเป็น `sub` ที่ได้จาก LINE OAuth (เช่น Ub1234567890)
 *
 * @returns LINE User ID หรือ null ถ้าไม่ได้ login / ไม่มี LINE account
 */
export async function getLineUserId(request: Request): Promise<string | null> {
  const session = await getServerAuthSession(request);

  if (!session?.user?.id) return null;

  const account = await db.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "line",
    },
    select: { accountId: true },
  });

  return account?.accountId ?? null;
}

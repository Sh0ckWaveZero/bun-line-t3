import { createHash } from "node:crypto";

/**
 * Email selection for LINE Login identities.
 *
 * ทุก email ใน flow นี้เป็น synthetic ที่ app ออกให้เอง (derive จาก LINE-verified
 * sub) — mapProfileToUser ทับ provider email เสมอ จึงไม่มี email จริงจากผู้ใช้
 * เข้ามาเกี่ยวข้อง
 *
 * สถานะของข้อมูลที่ต้องรองรับ:
 * 1. LINE account row มีอยู่แล้ว → ใช้ email ของเจ้าของ account เดิม (owned path)
 * 2. legacy email (`<LINE_ID>@<domain>`) ยังว่าง → ออก legacy email ใหม่
 * 3. legacy email ถูก orphan user (ไม่มี account row) ถืออยู่ → คืน email เดิม
 *    เพื่อให้ callback เจอ user คนเดิมแล้ว re-link LINE account เข้า user นั้น
 *    (orphan เกิดจากช่วงที่ createAccount ล้มเหลวหลัง createUser สำเร็จ —
 *    ไม่มี transaction จริงจึงไม่ rollback)
 * 4. legacy email ถูก user ที่มี account แล้วถืออยู่ → ออก collision-safe email
 *    (`line-<sha256>@<domain>`) เพื่อแยก identity ของ LINE subject นี้ออก
 */

interface LineEmailDatabase {
  account: {
    findUnique(args: {
      where: { providerId_accountId: { providerId: string; accountId: string } };
      select: { user: { select: { email: true } } };
    }): Promise<{ user: { email: string } } | null>;
  };
  user: {
    findUnique(args: {
      where: { email: string };
      select: { id: true; accounts: { select: { id: true } } };
    }): Promise<{ id: string; accounts: { id: string }[] } | null>;
  };
}

interface LineEmailResolverDeps {
  db: LineEmailDatabase;
  /** fallback email domain เช่น "line.local" */
  domain: string;
}

export type LineEmailResolver = (lineUserId: string) => Promise<string>;

const createLegacyLineEmail = (lineUserId: string, domain: string) => {
  const normalizedId =
    lineUserId
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "") || "line-user";

  return `${normalizedId}@${domain}`;
};

const createCollisionSafeLineEmail = (lineUserId: string, domain: string) => {
  const lineUserIdHash = createHash("sha256").update(lineUserId).digest("hex");
  return `line-${lineUserIdHash}@${domain}`;
};

export const createLineEmailResolver = ({
  db,
  domain,
}: LineEmailResolverDeps): LineEmailResolver => {
  return async (lineUserId: string) => {
    const existingLineAccount = await db.account.findUnique({
      where: {
        providerId_accountId: {
          providerId: "line",
          accountId: lineUserId,
        },
      },
      select: { user: { select: { email: true } } },
    });

    if (existingLineAccount) return existingLineAccount.user.email;

    const email = createLegacyLineEmail(lineUserId, domain);
    const existingEmailOwner = await db.user.findUnique({
      where: { email },
      select: { id: true, accounts: { select: { id: true } } },
    });

    if (!existingEmailOwner) return email;

    // Owner without any account row is an orphan left behind by a failed OAuth
    // sign-up. Handing back their email lets the callback find them and
    // implicitly re-link the LINE account onto the same user id, instead of
    // responding "account not linked" forever or duplicating a fresh user.
    if (existingEmailOwner.accounts.length === 0) {
      return email;
    }

    // A linked user owns the legacy synthetic email: give this LINE subject a
    // stable isolated email. Implicit linking can only match the email derived
    // from this LINE-verified sub, so the two identities stay separated.
    return createCollisionSafeLineEmail(lineUserId, domain);
  };
};

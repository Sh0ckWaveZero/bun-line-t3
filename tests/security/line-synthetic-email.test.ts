import { beforeEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { createLineEmailResolver } from "@/lib/auth/line-email";

// ---------------------------------------------------------------------------
// Fake DB state: จำลองตาราง users / accounts เพื่อทดสอบการเลือก email ของ
// LINE Login ในทุกสถานะของข้อมูล (owned / orphan / ชนกัน) — inject db เข้า
// resolver โดยตรง ไม่ใช้ mock.module (กันรั่วไปทำลายเทสอื่นใน full suite)
// ---------------------------------------------------------------------------

const LINE_DOMAIN = "line.local";

interface FakeAccountRow {
  providerId: string;
  accountId: string;
  userEmail: string;
}

interface FakeUserRow {
  id: string;
  email: string;
  accountIds: string[];
}

let fakeAccounts: FakeAccountRow[] = [];
let fakeUsers: FakeUserRow[] = [];

const fakeDb = {
  account: {
    findUnique: async ({
      where,
    }: {
      where: { providerId_accountId: { providerId: string; accountId: string } };
    }) => {
      const row = fakeAccounts.find(
        (account) =>
          account.providerId === where.providerId_accountId.providerId &&
          account.accountId === where.providerId_accountId.accountId,
      );
      if (!row) return null;
      return { user: { email: row.userEmail } };
    },
  },
  user: {
    findUnique: async ({ where }: { where: { email: string } }) => {
      const row = fakeUsers.find((user) => user.email === where.email);
      if (!row) return null;
      return {
        id: row.id,
        accounts: row.accountIds.map((id) => ({ id })),
      };
    },
  },
};

const resolveLineEmail = createLineEmailResolver({
  db: fakeDb,
  domain: LINE_DOMAIN,
});

const legacyEmail = (lineUserId: string) =>
  `${lineUserId.trim().toLowerCase()}@${LINE_DOMAIN}`;

const collisionSafeEmail = (lineUserId: string) =>
  `line-${createHash("sha256").update(lineUserId).digest("hex")}@${LINE_DOMAIN}`;

describe("LINE synthetic email selection", () => {
  beforeEach(() => {
    fakeAccounts = [];
    fakeUsers = [];
  });

  test("ผู้ใช้ที่มี LINE account อยู่แล้ว → ใช้ email ของเจ้าของ account เดิม", async () => {
    fakeAccounts = [
      {
        providerId: "line",
        accountId: "Uabc123",
        userEmail: legacyEmail("Uabc123"),
      },
    ];

    expect(await resolveLineEmail("Uabc123")).toBe(legacyEmail("Uabc123"));
  });

  test("LINE ใหม่ที่ยังไม่มี account และ legacy email ว่าง → ใช้ legacy synthetic email", async () => {
    expect(await resolveLineEmail("Unew999")).toBe(legacyEmail("Unew999"));
  });

  test("legacy email ถูก orphan user (ไม่มี account row) ถืออยู่ → คืน email เดิมเพื่อ re-link user เดิม", async () => {
    // orphan จากช่วงที่ createAccount ล้มเหลว: createUser สำเร็จแต่ไม่มี account row
    fakeUsers = [
      { id: "user-orphan", email: legacyEmail("Uold777"), accountIds: [] },
    ];

    expect(await resolveLineEmail("Uold777")).toBe(legacyEmail("Uold777"));
  });

  test("legacy email ถูก user ที่มี account แล้วถืออยู่ → ใช้ collision-safe email แยก identity", async () => {
    fakeUsers = [
      {
        id: "user-linked",
        email: legacyEmail("Uother123"),
        accountIds: ["acc-1"],
      },
    ];

    const email = await resolveLineEmail("Uother123");
    expect(email).toBe(collisionSafeEmail("Uother123"));
    expect(email).not.toBe(legacyEmail("Uother123"));
  });

  test("LINE id ต่างกันที่ legacy email ถูกถือหมด → ได้ collision-safe email ต่างกันเสมอ", async () => {
    fakeUsers = [
      { id: "u1", email: legacyEmail("Ubbb"), accountIds: ["a1"] },
      { id: "u2", email: legacyEmail("Uccc"), accountIds: ["a2"] },
    ];

    const first = await resolveLineEmail("Ubbb");
    const second = await resolveLineEmail("Uccc");
    expect(first).toBe(collisionSafeEmail("Ubbb"));
    expect(second).toBe(collisionSafeEmail("Uccc"));
    expect(first).not.toBe(second);
  });
});

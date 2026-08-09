/**
 * 🧪 Unit Tests — Admin LINE User Whitelist Helpers
 * ตรวจสอบ getEnvAdminLineUserIds / isAdminLineUser / requireAdminLineUser / canManageApprovals
 *
 * Mock @/lib/database/db ที่ module level (mock ก่อน import admin.ts)
 * เพื่อกัน db.$connect() -> process.exit(1)
 */
import { describe, test, expect, beforeEach, mock } from "bun:test";

// Stub DB module — ไม่ให้มี connection จริง
mock.module("@/lib/database/db", () => ({
  db: {
    account: {
      findFirst: mock(() => Promise.resolve(null)),
    },
    $connect: mock(() => Promise.resolve()),
  },
}));

// Stub env module — ทำให้ env.ADMIN_LINE_USER_IDS อ่าน process.env แบบ live
// (t3-env freeze ค่าตอน import ทำให้ beforeEach mutate ไม่ propagate)
mock.module("@/env.mjs", () => ({
  env: new Proxy(
    {},
    {
      get: (_t, prop: string) => process.env[prop],
    },
  ),
}));

process.env.SKIP_ENV_VALIDATION = "1";
process.env.APP_ENV = "test";

const {
  getEnvAdminLineUserIds,
  isAdminLineUser,
  requireAdminLineUser,
  canManageApprovals,
  canManageAdminResources,
} = await import("@/lib/auth/admin");
const { authorizeAdminResourceRequest } =
  await import("@/lib/auth/admin-resource.server");

describe("📋 getEnvAdminLineUserIds — parse ADMIN_LINE_USER_IDS env", () => {
  beforeEach(() => {
    delete process.env.ADMIN_LINE_USER_IDS;
  });

  test("คืน [] เมื่อ env ไม่ได้ตั้ง", () => {
    delete process.env.ADMIN_LINE_USER_IDS;
    expect(getEnvAdminLineUserIds()).toEqual([]);
  });

  test("คืน [] เมื่อ env ว่าง", () => {
    process.env.ADMIN_LINE_USER_IDS = "";
    expect(getEnvAdminLineUserIds()).toEqual([]);
  });

  test("คืน [] เมื่อ env เป็น whitespace", () => {
    process.env.ADMIN_LINE_USER_IDS = "   ";
    expect(getEnvAdminLineUserIds()).toEqual([]);
  });

  test("แยก ID หลายตัวด้วย comma และ trim spaces", () => {
    process.env.ADMIN_LINE_USER_IDS = "U111 , U222,U333";
    expect(getEnvAdminLineUserIds()).toEqual(["U111", "U222", "U333"]);
  });

  test("กรองค่าว่างที่ติด comma ซ้อน", () => {
    process.env.ADMIN_LINE_USER_IDS = "U111,,U222, ,U333";
    expect(getEnvAdminLineUserIds()).toEqual(["U111", "U222", "U333"]);
  });
});

describe("🔐 isAdminLineUser", () => {
  beforeEach(() => {
    process.env.ADMIN_LINE_USER_IDS = "U_ADMIN_1,U_ADMIN_2";
  });

  test("คืน true เมื่อ userId อยู่ใน whitelist", () => {
    expect(isAdminLineUser("U_ADMIN_1")).toBe(true);
    expect(isAdminLineUser("U_ADMIN_2")).toBe(true);
  });

  test("คืน false เมื่อ userId ไม่อยู่ใน whitelist", () => {
    expect(isAdminLineUser("U_NORMAL")).toBe(false);
    expect(isAdminLineUser("")).toBe(false);
  });
});

describe("🚫 requireAdminLineUser", () => {
  beforeEach(() => {
    process.env.ADMIN_LINE_USER_IDS = "U_ADMIN_1";
  });

  test("ไม่ throw เมื่อเป็น admin", () => {
    expect(() => requireAdminLineUser("U_ADMIN_1")).not.toThrow();
  });

  test("throw Error (ภาษาไทย) เมื่อไม่ใช่ admin", () => {
    expect(() => requireAdminLineUser("U_NORMAL")).toThrow(
      "คุณไม่มีสิทธิ์ดำเนินการนี้",
    );
  });
});

describe("👤 canManageApprovals", () => {
  beforeEach(() => {
    process.env.ADMIN_LINE_USER_IDS = "U_ADMIN_1";
  });

  test("คืน false เมื่อ lineUserId เป็น undefined", () => {
    expect(canManageApprovals(undefined)).toBe(false);
  });

  test("คืน true เมื่อ lineUserId อยู่ใน whitelist", () => {
    expect(canManageApprovals("U_ADMIN_1")).toBe(true);
  });

  test("คืน false เมื่อ lineUserId ไม่ใช่ admin", () => {
    expect(canManageApprovals("U_NORMAL")).toBe(false);
  });
});

describe("🛡️ canManageAdminResources", () => {
  beforeEach(() => {
    process.env.ADMIN_LINE_USER_IDS = "U_ENV_ADMIN";
  });

  test("อนุญาต session ที่มีสิทธิ์ admin จากฐานข้อมูล", () => {
    expect(
      canManageAdminResources({ isAdmin: true, user: { role: "admin" } }),
    ).toBe(true);
  });

  test("อนุญาต LINE user ที่อยู่ใน env whitelist", () => {
    expect(
      canManageAdminResources(
        { isAdmin: false, user: { role: "user" } },
        "U_ENV_ADMIN",
      ),
    ).toBe(true);
  });

  test("ปฏิเสธผู้ใช้ทั่วไปแม้มี session", () => {
    expect(
      canManageAdminResources(
        { isAdmin: false, user: { role: "user" } },
        "U_NORMAL",
      ),
    ).toBe(false);
  });
});

describe("🔐 authorizeAdminResourceRequest", () => {
  beforeEach(() => {
    process.env.ADMIN_LINE_USER_IDS = "U_ENV_ADMIN";
  });

  const request = new Request("http://localhost/api/protected");

  test("คืน 401 เมื่อไม่มี session", async () => {
    const response = await authorizeAdminResourceRequest(request, {
      getSession: async () => null,
      findLineAccount: async () => null,
    });

    expect(response?.status).toBe(401);
  });

  test("คืน 403 สำหรับ authenticated non-admin", async () => {
    const response = await authorizeAdminResourceRequest(request, {
      getSession: async () => ({ user: { id: "user-1", role: "user" } }),
      findLineAccount: async () => ({ accountId: "U_NORMAL" }),
    });

    expect(response?.status).toBe(403);
  });

  test("อนุญาต admin จาก role ในฐานข้อมูล", async () => {
    const response = await authorizeAdminResourceRequest(request, {
      getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
      findLineAccount: async () => null,
    });

    expect(response).toBeNull();
  });

  test("อนุญาต admin จาก LINE env whitelist", async () => {
    const response = await authorizeAdminResourceRequest(request, {
      getSession: async () => ({ user: { id: "user-1", role: "user" } }),
      findLineAccount: async () => ({ accountId: "U_ENV_ADMIN" }),
    });

    expect(response).toBeNull();
  });
});

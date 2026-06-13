/**
 * 🧪 Unit Tests — Approval Service (admin approve-by-line + notify admins)
 * ตรวจสอบ approvalService.approveByLineUser และ notifyAdminsOfNewRequest
 */
import {
  describe,
  test,
  expect,
  beforeEach,
  mock,
  spyOn,
} from "bun:test";

// ── Mock repository — ควบคุม DB layer โดยไม่ต้องต่อจริง ──
const repoMocks = {
  findByLineUserId: mock(() => Promise.resolve(null)),
  update: mock(() => Promise.resolve({})),
  markNotified: mock(() => Promise.resolve({})),
  getStats: mock(() => Promise.resolve({ pending: 1 })),
  findAllAdminLineUserIds: mock(() => Promise.resolve([])),
};

mock.module(
  "@/features/line/services/approval.repository.server",
  () => ({
    approvalRepository: repoMocks,
  }),
);

// ── Mock LINE push — เก็บ calls แทนส่งจริง ──
const pushMock = mock(() => Promise.resolve(new Response("{}")));
mock.module("@/lib/utils/line-push", () => ({
  sendPushMessage: pushMock,
}));

// NOTE: ไม่ mock @/lib/validation/line-approval — เป็น pure module (ไม่มี import
// side-effect) การ mock ที่นี่จะ leak ไปทำให้ line-approval-bubble.test.ts
// ได้ fake marker แทน Flex template จริง ใช้ของจริงได้เลย (ไม่กระทบ DB/env)

// ── Mock env (live process.env) + db (กัน $connect exit) ──
mock.module("@/env.mjs", () => ({
  env: new Proxy({}, { get: (_t, p: string) => process.env[p] }),
  flexMessage: (x: unknown) => x,
}));
mock.module("@/lib/utils/line-message-utils", () => ({
  flexMessage: (items: unknown) => items,
}));
mock.module("@/lib/database/db", () => ({ db: {} }));

process.env.SKIP_ENV_VALIDATION = "1";
process.env.APP_ENV = "test";
process.env.APP_URL = "https://app.example.com";

// admin.ts: canManageApprovals/Async ใช้ env + db (mocked) -> ใช้ของจริง
const { approvalService } = await import(
  "@/features/line/services/approval.service.server"
);

beforeEach(() => {
  // ล้าง call history ทุก mock ก่อนเริ่มเทสต์ (bun:test ไม่ auto-reset)
  repoMocks.findByLineUserId.mockClear();
  repoMocks.update.mockClear();
  repoMocks.markNotified.mockClear();
  repoMocks.getStats.mockClear();
  repoMocks.findAllAdminLineUserIds.mockClear();
  pushMock.mockClear();

  repoMocks.findByLineUserId.mockImplementation(() => Promise.resolve(null));
  repoMocks.update.mockImplementation(() => Promise.resolve({}));
  repoMocks.markNotified.mockImplementation(() => Promise.resolve({}));
  repoMocks.getStats.mockImplementation(() => Promise.resolve({ pending: 1 }));
  repoMocks.findAllAdminLineUserIds.mockImplementation(() =>
    Promise.resolve([]),
  );
  pushMock.mockImplementation(() => Promise.resolve(new Response("{}")));
  delete process.env.ADMIN_LINE_USER_IDS;
});

describe("✅ approvalService.approveByLineUser", () => {
  test("คืน ok:false เมื่อไม่พบคำขอในระบบ", async () => {
    repoMocks.findByLineUserId.mockImplementation(() =>
      Promise.resolve(null),
    );

    const result = await approvalService.approveByLineUser(
      "U_MISSING",
      "U_ADMIN",
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain("ไม่พบคำขอ");
    expect(repoMocks.update).toHaveBeenCalledTimes(0);
  });

  test("คืน ok:false เมื่ออนุมัติไปแล้ว (สถานะ APPROVED)", async () => {
    repoMocks.findByLineUserId.mockImplementation(() =>
      Promise.resolve({
        id: "rec-1",
        lineUserId: "U_DONE",
        status: "APPROVED",
        displayName: "ก้อย",
      }),
    );

    const result = await approvalService.approveByLineUser(
      "U_DONE",
      "U_ADMIN",
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain("ได้รับการอนุมัติไปแล้ว");
    expect(result.displayName).toBe("ก้อย");
    expect(repoMocks.update).toHaveBeenCalledTimes(0);
  });

  test("อนุมัติสำเร็จ -> update APPROVED + ส่ง push + markNotified + คืน ok:true", async () => {
    repoMocks.findByLineUserId.mockImplementation(() =>
      Promise.resolve({
        id: "rec-2",
        lineUserId: "U_PENDING",
        status: "PENDING",
        displayName: "บอม",
      }),
    );
    const updated = {
      id: "rec-2",
      lineUserId: "U_PENDING",
      status: "APPROVED",
      displayName: "บอม",
    };
    repoMocks.update.mockImplementation(() => Promise.resolve(updated));

    const result = await approvalService.approveByLineUser(
      "U_PENDING",
      "U_ADMIN",
    );

    expect(result.ok).toBe(true);
    expect(result.message).toContain("อนุมัติ");
    expect(result.displayName).toBe("บอม");

    // update ถูกเรียกด้วย status APPROVED + approvedBy admin
    const updateArg = repoMocks.update.mock.calls[0]?.[1];
    expect(updateArg.status).toBe("APPROVED");
    expect(updateArg.approvedBy).toBe("U_ADMIN");

    // ส่ง push ไปยัง target user + markNotified
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock.mock.calls[0]?.[0]).toBe("U_PENDING");
    expect(repoMocks.markNotified).toHaveBeenCalledTimes(1);
  });

  test("push notification ล้มเหลว -> ไม่ throw, ยังคืน record สำเร็จ", async () => {
    repoMocks.findByLineUserId.mockImplementation(() =>
      Promise.resolve({
        id: "rec-3",
        lineUserId: "U_X",
        status: "PENDING",
        displayName: "เนย",
      }),
    );
    repoMocks.update.mockImplementation(() =>
      Promise.resolve({
        id: "rec-3",
        lineUserId: "U_X",
        status: "APPROVED",
        displayName: "เนย",
      }),
    );
    pushMock.mockImplementation(() => Promise.reject(new Error("LINE down")));

    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    const result = await approvalService.approveByLineUser("U_X", "U_ADMIN");

    expect(result.ok).toBe(true);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("🔔 approvalService.notifyAdminsOfNewRequest", () => {
  test("ไม่มีแอดมิน (env+db ว่าง) -> warn + ไม่ส่ง push + resolve void", async () => {
    delete process.env.ADMIN_LINE_USER_IDS;
    repoMocks.findAllAdminLineUserIds.mockImplementation(() =>
      Promise.resolve([]),
    );
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    await approvalService.notifyAdminsOfNewRequest({ userId: "U_NEW" });

    expect(warnSpy).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledTimes(0);
    warnSpy.mockRestore();
  });

  test("ส่งแจ้งเตือนไปยังแอดมินทุกคน ยกเว้นผู้ขอเอง", async () => {
    process.env.ADMIN_LINE_USER_IDS = "U_ADMIN_A,U_NEW";
    repoMocks.findAllAdminLineUserIds.mockImplementation(() =>
      Promise.resolve(["U_ADMIN_B"]),
    );
    repoMocks.getStats.mockImplementation(() =>
      Promise.resolve({ pending: 5 }),
    );

    await approvalService.notifyAdminsOfNewRequest({ userId: "U_NEW" });

    // recipients = {U_ADMIN_A, U_ADMIN_B} (U_NEW คือผู้ขอ -> กรองออก)
    const targets = pushMock.mock.calls.map((c) => c[0]);
    expect(targets).toEqual(expect.arrayContaining(["U_ADMIN_A", "U_ADMIN_B"]));
    expect(targets).not.toContain("U_NEW");
    expect(targets).toHaveLength(2);
  });

  test("push ล้มเหลวบางราย -> Promise.allSettled จับไว้, log error, ไม่ throw", async () => {
    process.env.ADMIN_LINE_USER_IDS = "U_OK,U_FAIL";
    let calls = 0;
    pushMock.mockImplementation(() => {
      calls++;
      if (calls === 1) return Promise.reject(new Error("timeout"));
      return Promise.resolve(new Response("{}"));
    });

    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    await approvalService.notifyAdminsOfNewRequest({ userId: "U_REQ" });

    expect(pushMock).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

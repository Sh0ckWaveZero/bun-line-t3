import { describe, it, expect, mock, beforeEach } from "bun:test";

// --- Mocks (ต้องลงทะเบียนก่อน dynamic import ของ route ด้านล่าง —
//     กัน "@/lib" barrel โหลดจริงแล้วชน env validation) ---

const mockDb = {
  account: {
    findFirst: async () => null as { accountId: string } | null,
  },
};

const mockLeaveService = {
  createLeave: async (input: Record<string, unknown>) => input,
  updateLeaveForDate: async (input: Record<string, unknown>) => input,
  cancelLeaveForDate: async (input: Record<string, unknown>) => input,
  getUserLeavesInMonth: async () => [],
};

let authSession: { user: { id: string } } | null = {
  user: { id: "user-1" },
};
let canRequestLeaveResult = true;
let serviceError: Error | null = null;

mock.module("@/lib", () => ({
  getServerAuthSession: async () => authSession,
}));

// Route imports db จาก path เต็ม — mock ตรง specifier ที่ route ใช้
mock.module("@/lib/database/db", () => ({
  db: mockDb,
}));

mock.module("@/features/attendance/services/leave.server", () => ({
  leaveService: mockLeaveService,
}));

mock.module("@/features/line/line/permissions", () => ({
  canRequestLeave: async () => canRequestLeaveResult,
}));

// Import route หลัง mocks ทั้งหมด (bun pattern เดียวกับ body-weight.mock.test)
const { POST, PUT, DELETE } = await import("../../../src/routes/api/leave");

const jsonRequest = (body: unknown) =>
  new Request("http://localhost/api/leave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const putRequest = (body: unknown) =>
  new Request("http://localhost/api/leave", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("/api/leave PUT (เปลี่ยนวันลา)", () => {
  beforeEach(() => {
    authSession = { user: { id: "user-1" } };
    canRequestLeaveResult = true;
    serviceError = null;
    mockDb.account.findFirst = async () => null;
    mockLeaveService.updateLeaveForDate = async (input) => {
      if (serviceError) throw serviceError;
      return input;
    };
    mockLeaveService.createLeave = async (input) => input;
  });

  it("401 เมื่อยังไม่เข้าสู่ระบบ", async () => {
    authSession = null;
    const res = await PUT(putRequest({ date: "2026-11-23", type: "sick" }));
    expect(res.status).toBe(401);
  });

  it("403 เมื่อ LINE account ไม่ได้รับอนุมัติให้ขอลา", async () => {
    mockDb.account.findFirst = async () => ({ accountId: "U123" });
    canRequestLeaveResult = false;
    const res = await PUT(putRequest({ date: "2026-11-23", type: "sick" }));
    expect(res.status).toBe(403);
  });

  it("422 เมื่อประเภทวันลาไม่อยู่ในตัวเลือกปฏิทิน", async () => {
    const res = await PUT(putRequest({ date: "2026-11-23", type: "birthday" }));
    expect(res.status).toBe(422);
  });

  it("422 เมื่อรูปแบบวันที่ไม่ถูกต้อง", async () => {
    const res = await PUT(putRequest({ date: "23/11/2026", type: "sick" }));
    expect(res.status).toBe(422);
  });

  it("400 เมื่อไม่พบวันลาที่บันทึกไว้ (service throw)", async () => {
    serviceError = new Error("ไม่พบวันลาที่บันทึกไว้ในวันนี้");
    const res = await PUT(putRequest({ date: "2026-11-23", type: "sick" }));
    expect(res.status).toBe(400);
    const result = (await res.json()) as { message: string };
    expect(result.message).toBe("ไม่พบวันลาที่บันทึกไว้ในวันนี้");
  });

  it("200 และเรียก service ด้วยค่าที่ validate แล้ว", async () => {
    let captured: Record<string, unknown> | null = null;
    mockLeaveService.updateLeaveForDate = async (input) => {
      captured = input;
      return input;
    };
    const res = await PUT(
      putRequest({ date: "2026-11-23", type: "sick", reason: "ปวดท้อง" }),
    );
    expect(res.status).toBe(200);
    const result = (await res.json()) as { success: boolean };
    expect(result.success).toBe(true);
    expect(captured).toEqual({
      userId: "user-1",
      date: "2026-11-23",
      type: "sick",
      reason: "ปวดท้อง",
    });
  });

  it("400 เมื่อ body ไม่ใช่ JSON", async () => {
    const res = await PUT(
      new Request("http://localhost/api/leave", {
        method: "PUT",
        body: "not-json",
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("/api/leave DELETE (ยกเลิกวันลา)", () => {
  beforeEach(() => {
    authSession = { user: { id: "user-1" } };
    canRequestLeaveResult = true;
    serviceError = null;
    mockDb.account.findFirst = async () => null;
    mockLeaveService.cancelLeaveForDate = async (input) => {
      if (serviceError) throw serviceError;
      return input;
    };
  });

  const deleteRequest = (date: string | null) =>
    new Request(`http://localhost/api/leave${date ? `?date=${date}` : ""}`, {
      method: "DELETE",
    });

  it("401 เมื่อยังไม่เข้าสู่ระบบ", async () => {
    authSession = null;
    const res = await DELETE(deleteRequest("2026-11-23"));
    expect(res.status).toBe(401);
  });

  it("403 เมื่อ LINE account ไม่ได้รับอนุมัติ (gate เดียวกับ POST/PUT)", async () => {
    mockDb.account.findFirst = async () => ({ accountId: "U123" });
    canRequestLeaveResult = false;
    const res = await DELETE(deleteRequest("2026-11-23"));
    expect(res.status).toBe(403);
  });

  it("422 เมื่อไม่ระบุวันที่", async () => {
    const res = await DELETE(deleteRequest(null));
    expect(res.status).toBe(422);
  });

  it("422 เมื่อรูปแบบวันที่ไม่ถูกต้อง", async () => {
    const res = await DELETE(deleteRequest("23-11-2026"));
    expect(res.status).toBe(422);
  });

  it("400 เมื่อไม่พบวันลาที่บันทึกไว้ (service throw)", async () => {
    serviceError = new Error("ไม่พบวันลาที่บันทึกไว้ในวันนี้");
    const res = await DELETE(deleteRequest("2026-11-23"));
    expect(res.status).toBe(400);
    const result = (await res.json()) as { message: string };
    expect(result.message).toBe("ไม่พบวันลาที่บันทึกไว้ในวันนี้");
  });

  it("200 และเรียก service ด้วย userId + date จาก query", async () => {
    let captured: Record<string, unknown> | null = null;
    mockLeaveService.cancelLeaveForDate = async (input) => {
      captured = input;
      return input;
    };
    const res = await DELETE(deleteRequest("2026-11-23"));
    expect(res.status).toBe(200);
    const result = (await res.json()) as { success: boolean };
    expect(result.success).toBe(true);
    expect(captured).toEqual({ userId: "user-1", date: "2026-11-23" });
  });
});

describe("/api/leave POST (สร้างวันลา — หลัง refactor gate)", () => {
  beforeEach(() => {
    authSession = { user: { id: "user-1" } };
    canRequestLeaveResult = true;
    serviceError = null;
    mockDb.account.findFirst = async () => null;
    mockLeaveService.createLeave = async (input) => {
      if (serviceError) throw serviceError;
      return input;
    };
  });

  it("200 เมื่อสร้างวันลาสำเร็จ", async () => {
    const res = await POST(
      jsonRequest({ date: "2026-11-24", type: "personal", reason: "ธุระ" }),
    );
    expect(res.status).toBe(200);
    const result = (await res.json()) as { success: boolean };
    expect(result.success).toBe(true);
  });

  it("400 เมื่อมีวันลาวันนี้อยู่แล้ว (guard duplicate)", async () => {
    serviceError = new Error("มีการลาวันนี้แล้ว");
    const res = await POST(jsonRequest({ date: "2026-11-24", type: "sick" }));
    expect(res.status).toBe(400);
    const result = (await res.json()) as { message: string };
    expect(result.message).toBe("มีการลาวันนี้แล้ว");
  });

  it("403 เมื่อ LINE account ไม่ได้รับอนุมัติ (gate เดียวกับ PUT)", async () => {
    mockDb.account.findFirst = async () => ({ accountId: "U123" });
    canRequestLeaveResult = false;
    const res = await POST(jsonRequest({ date: "2026-11-24", type: "sick" }));
    expect(res.status).toBe(403);
  });
});

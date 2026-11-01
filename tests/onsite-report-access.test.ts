/**
 * 🧪 สิทธิ์ใช้งาน Onsite Service Report (canUseOnsiteReport)
 * admin ผ่านเสมอ · ผู้ใช้ทั่วไปต้องมีบัญชี LINE ที่อนุมัติแล้ว + แอดมินติ๊กสิทธิ์ · ไม่มีบัญชี LINE = ปฏิเสธ
 */
import { beforeEach, describe, expect, mock, test } from "bun:test";

let lineAccount: { accountId: string } | null = null;
let approval: Record<string, unknown> | null = null;
const accountFind = mock(async () => lineAccount);
const approvalFind = mock(async () => approval);

mock.module("@/lib/database/db", () => ({
  db: {
    account: { findFirst: accountFind },
    lineApprovalRequest: { findUnique: approvalFind },
  },
}));

const { canUseOnsiteReportFeature } = await import(
  "@/features/onsite-report/services/onsite-report-access.server"
);

const user = { userId: "user-1", isAdmin: false };

beforeEach(() => {
  lineAccount = { accountId: "U-line-1" };
  approval = { status: "APPROVED", canUseOnsiteReport: true };
  accountFind.mockClear();
  approvalFind.mockClear();
});

describe("canUseOnsiteReportFeature", () => {
  test("admin ใช้ได้เสมอ โดยไม่ต้องถาม DB", async () => {
    expect(await canUseOnsiteReportFeature({ ...user, isAdmin: true })).toBe(
      true,
    );
    expect(accountFind).not.toHaveBeenCalled();
    expect(approvalFind).not.toHaveBeenCalled();
  });

  test("อนุมัติแล้ว + ติ๊กสิทธิ์ → ใช้ได้", async () => {
    expect(await canUseOnsiteReportFeature(user)).toBe(true);
  });

  test("อนุมัติแล้วแต่ยังไม่ติ๊กสิทธิ์ → ใช้ไม่ได้", async () => {
    approval = { status: "APPROVED", canUseOnsiteReport: false };
    expect(await canUseOnsiteReportFeature(user)).toBe(false);
  });

  test("ติ๊กสิทธิ์ไว้ แต่สถานะยังไม่ APPROVED → ใช้ไม่ได้", async () => {
    for (const status of ["PENDING", "REJECTED"]) {
      approval = { status, canUseOnsiteReport: true };
      expect(await canUseOnsiteReportFeature(user)).toBe(false);
    }
  });

  test("ไม่มีแถวอนุมัติของ LINE user นี้ → ใช้ไม่ได้", async () => {
    approval = null;
    expect(await canUseOnsiteReportFeature(user)).toBe(false);
  });

  test("ไม่มีบัญชี LINE → ปฏิเสธไว้ก่อน (ไม่ข้ามเช็กเหมือนรายงานเข้างาน)", async () => {
    lineAccount = null;
    expect(await canUseOnsiteReportFeature(user)).toBe(false);
    expect(approvalFind).not.toHaveBeenCalled();
  });

  test("ค้นสิทธิ์ด้วย LINE accountId ของผู้ใช้คนนั้น", async () => {
    await canUseOnsiteReportFeature(user);
    expect(approvalFind).toHaveBeenCalledWith({
      where: { lineUserId: "U-line-1" },
    });
  });
});

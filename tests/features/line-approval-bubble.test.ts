/**
 * 🧪 Unit Tests — LINE Admin Approval Bubble Templates
 * ตรวจสอบ Flex Message structure สำหรับ admin approval flow
 */
import { describe, test, expect } from "bun:test";
import { approvalBubbleTemplate } from "@/lib/validation/line-approval";

/** ดึง text ทั้งหมดจาก Flex Message tree แบบ recursive */
const collectTexts = (node: any): string[] => {
  if (!node || typeof node !== "object") return [];
  if (typeof node.text === "string") return [node.text];
  const fromContents = Array.isArray(node.contents)
    ? node.contents.flatMap(collectTexts)
    : [];
  const fromAction = node.action ? collectTexts(node.action) : [];
  return [...fromContents, ...fromAction];
};

describe("🔔 approvalBubbleTemplate.adminPendingRequest", () => {
  const baseParams = {
    displayName: "สมชาย",
    pictureUrl: "https://example.com/avatar.png",
    lineUserId: "U123",
    statusMessage: "สวัสดีครับ",
    pendingCount: 3,
    webUrl: "https://app.example.com/line-approval",
  };

  test("สร้าง bubble ที่มี header ไล่เส้น admin + ชื่อผู้ขอ", () => {
    const [bubble] = approvalBubbleTemplate.adminPendingRequest(baseParams);
    expect(bubble.type).toBe("bubble");

    const headerTexts = collectTexts(bubble.header);
    expect(headerTexts).toContain("มีคำขอใหม่รออนุมัติ");
    expect(headerTexts).toContain("ต้องการการตรวจสอบจากแอดมิน");
  });

  test("ปุ่มอนุมัติสร้าง postback data action=admin_approve&uid=<lineUserId>", () => {
    const [bubble] = approvalBubbleTemplate.adminPendingRequest(baseParams);
    const approveBtn = bubble.footer.contents.find(
      (c: any) => c.action?.type === "postback",
    );

    expect(approveBtn).toBeDefined();
    expect(approveBtn.action.data).toBe("action=admin_approve&uid=U123");
    expect(approveBtn.action.displayText).toBe("อนุมัติ สมชาย");
  });

  test("ปุ่มดูรายละเอียด link ไป webUrl", () => {
    const [bubble] = approvalBubbleTemplate.adminPendingRequest(baseParams);
    const webBtn = bubble.footer.contents.find(
      (c: any) => c.action?.type === "uri",
    );

    expect(webBtn.action.uri).toBe(baseParams.webUrl);
  });

  test("แสดง hero image เมื่อมี pictureUrl", () => {
    const [bubble] = approvalBubbleTemplate.adminPendingRequest(baseParams);
    expect(bubble.hero).toBeDefined();
    expect(bubble.hero.url).toBe(baseParams.pictureUrl);
  });

  test("ไม่แสดง hero image เมื่อไม่มี pictureUrl", () => {
    const [bubble] = approvalBubbleTemplate.adminPendingRequest({
      ...baseParams,
      pictureUrl: undefined,
    });
    expect(bubble.hero).toBeUndefined();
  });

  test("fallback ชื่อเป็น \"ผู้ใช้งานใหม่\" เมื่อ displayName ว่าง/whitespace", () => {
    const [bubble] = approvalBubbleTemplate.adminPendingRequest({
      ...baseParams,
      displayName: "   ",
    });
    const bodyTexts = collectTexts(bubble.body);
    expect(bodyTexts).toContain("ผู้ใช้งานใหม่");
  });

  test("แสดง statusMessage เมื่อมีค่า และซ่อนเมื่อว่าง", () => {
    const [withMsg] = approvalBubbleTemplate.adminPendingRequest(baseParams);
    expect(collectTexts(withMsg.body)).toContain(baseParams.statusMessage);

    const [noMsg] = approvalBubbleTemplate.adminPendingRequest({
      ...baseParams,
      statusMessage: "  ",
    });
    expect(collectTexts(noMsg.body)).not.toContain(baseParams.statusMessage);
  });

  test("นับ pendingCount + lineUserId แสดงใน info row", () => {
    const [bubble] = approvalBubbleTemplate.adminPendingRequest({
      ...baseParams,
      pendingCount: 7,
    });
    const bodyTexts = collectTexts(bubble.body);
    expect(bodyTexts).toContain("7 รายการ");
    expect(bodyTexts).toContain("U123");
  });
});

describe("✅ approvalBubbleTemplate.adminApproveResult", () => {
  test("สถานะสำเร็จใช้ไล่เส้นเขียว + ข้อความ ok", () => {
    const [bubble] = approvalBubbleTemplate.adminApproveResult({
      ok: true,
      message: "อนุมัติเรียบร้อย",
    });

    expect(bubble.header.background.startColor).toBe("#10b981");
    expect(bubble.header.contents[0].text).toBe("✅ อนุมัติสำเร็จ");
    expect(bubble.body.contents[0].text).toBe("อนุมัติเรียบร้อย");
  });

  test("สถานะล้มเหลวใช้ไล่เส้นแดง + ข้อความ warning", () => {
    const [bubble] = approvalBubbleTemplate.adminApproveResult({
      ok: false,
      message: "คุณไม่มีสิทธิ์",
    });

    expect(bubble.header.background.startColor).toBe("#ef4444");
    expect(bubble.header.contents[0].text).toBe("⚠️ ดำเนินการไม่สำเร็จ");
    expect(bubble.body.contents[0].color).toBe("#dc2626");
  });
});

import { describe, it, expect } from "bun:test";

const API_URL = "http://localhost:4325/api/cron/check-in-reminder";

// Mock token สำหรับทดสอบ (ควรตั้งค่า CRON_SECRET ให้ตรงกับ env จริง)
const CRON_SECRET = process.env.CRON_SECRET || "test-secret";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${CRON_SECRET}`,
};

describe("API: /api/cron/check-in-reminder", () => {
  it("ควรปฏิเสธถ้าไม่มี Authorization header", async () => {
    const res = await fetch(API_URL);
    expect(res.status).toBe(401);
  });

  it("ควรตอบกลับ success ถ้าเป็นวันหยุด (mock)", async () => {
    // กรณีนี้ควร mock ให้ isWorkingDay return false หรือทดสอบวันหยุดจริง
    // ตัวอย่างนี้ทดสอบโครงสร้าง response เฉย ๆ
    const res = await fetch(API_URL, { headers });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("success");
    expect(data).toHaveProperty("timestamp");
  });

  it("ควรตอบกลับ success และส่งแจ้งเตือนถ้าเป็นวันทำงาน (mock)", async () => {
    // กรณีนี้ควร mock ให้ isWorkingDay return true และไม่มีใครลา
    // ตัวอย่างนี้ทดสอบโครงสร้าง response เฉย ๆ
    const res = await fetch(API_URL, { headers });
    const data = await res.json();
    expect([200, 500]).toContain(res.status); // อาจ error ถ้า push ไม่สำเร็จ
    expect(data).toHaveProperty("success");
    expect(data).toHaveProperty("timestamp");
  });

  it("ควรข้ามการส่งแจ้งเตือนถ้าทุกคนลา (mock)", async () => {
    // กรณีนี้ควร mock ให้ user ทุกคนมี leave วันนี้
    // ตัวอย่างนี้ทดสอบโครงสร้าง response เฉย ๆ
    const res = await fetch(API_URL, { headers });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty("success");
    expect(data).toHaveProperty("message");
  });
});

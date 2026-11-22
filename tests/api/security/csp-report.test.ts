import { describe, it, expect, spyOn } from "bun:test";
import { handleCspReportRequest } from "@/lib/security/csp-report.server";

/** สร้าง POST request ของ browser CSP report (content-type ตาม spec) */
const reportRequest = (body: unknown, ip = "198.51.100.7"): Request =>
  new Request("https://app.example.com/api/security/csp-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/csp-report",
      "x-forwarded-for": ip,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const SAMPLE_REPORT = {
  "csp-report": {
    "document-uri": "https://app.example.com/dashboard?token=secret123",
    "violated-directive": "script-src 'self' 'unsafe-inline'",
    "effective-directive": "script-src",
    "blocked-uri": "https://evil.example/malware.js",
    "script-sample": "alert(1)",
    "source-file": "https://app.example.com/assets/x.js",
    "line-number": 42,
  },
};

describe("POST /api/security/csp-report", () => {
  it("รับรายงานรูปแบบมาตรฐาน (wrapped) → 204", async () => {
    const response = await handleCspReportRequest(reportRequest(SAMPLE_REPORT));
    expect(response.status).toBe(204);
  });

  it("รับรายงานรูปแบบ flat ของ UA เก่า → 204", async () => {
    const response = await handleCspReportRequest(
      reportRequest({
        "document-uri": "https://app.example.com/",
        "violated-directive": "img-src",
      }),
    );
    expect(response.status).toBe(204);
  });

  it("body ไม่ใช่ JSON → 400", async () => {
    const response = await handleCspReportRequest(
      reportRequest("not-json{", "198.51.100.8"),
    );
    expect(response.status).toBe(400);
  });

  it("ตัด query string ทิ้งก่อนล็อก (กัน secrets หลุดลง log)", async () => {
    const logs: string[] = [];
    const spy = spyOn(console, "warn").mockImplementation((message) => {
      logs.push(String(message));
    });
    try {
      await handleCspReportRequest(
        reportRequest(SAMPLE_REPORT, "198.51.100.9"),
      );
    } finally {
      spy.mockRestore();
    }

    const logLine = logs.join("\n");
    expect(logLine).toContain("[CSP-REPORT]");
    expect(logLine).toContain("doc=https://app.example.com/dashboard");
    expect(logLine).not.toContain("token=secret123");
    expect(logLine).toContain("blocked=https://evil.example/malware.js");
  });

  it("rate limit ต่อ IP — ส่งเกิน 30 ครั้ง/นาที → 429", async () => {
    // IP เฉพาะของเทสนี้ เพื่อไม่ให้ store in-memory ของเคสอื่นรบกวน
    const ip = "203.0.113.77";
    let last: Response | undefined;
    for (let i = 0; i < 31; i++) {
      last = await handleCspReportRequest(reportRequest(SAMPLE_REPORT, ip));
    }
    expect(last?.status).toBe(429);
  });
});

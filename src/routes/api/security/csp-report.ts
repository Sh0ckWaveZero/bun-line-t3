/**
 * CSP violation report endpoint — thin layer (parse → handle → respond)
 *
 * รับรายงานจาก browser ผ่าน Content-Security-Policy-Report-Only (ไม่มี auth
 * เพราะ browser ยิงเองอัตโนมัติ) — logic จริงอยู่ที่ handleCspReportRequest
 */
import { createFileRoute } from "@tanstack/react-router";
import { handleCspReportRequest } from "@/lib/security/csp-report.server";

export const Route = createFileRoute("/api/security/csp-report")({
  server: {
    handlers: {
      POST: ({ request }) => handleCspReportRequest(request),
    },
  },
});

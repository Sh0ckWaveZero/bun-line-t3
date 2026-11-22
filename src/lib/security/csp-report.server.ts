/**
 * CSP violation report receiver (server-only)
 *
 * ปลายทางรับรายงานจาก browser ที่ trigger โดย header
 * Content-Security-Policy-Report-Only (ดู buildCspReportOnly ใน server.ts) —
 * ขั้น Phase 2 ของ staged rollout: เก็บ telemetry เพื่อโปรโมตเป็น enforce ภายหลัง
 * (modern-web-guidance: security §2.2/§2.3)
 *
 * หลักการ: log-only, ไม่เก็บ PII — ตัด query string ออกจาก URL ทั้งหมด (อาจมี
 * token/secrets) และจำกัดความยาวทุก field ก่อนพิมพ์
 */
import { z } from "zod";

// ─── Rate limit แบบ local (ตั้งใจไม่ใช้ RateLimiter กลาง) ────────────────────
// บางเทสใน suite ใช้ mock.module ทับ @/lib/utils/rate-limiter ทั้ง process
// ทำให้ shape ของโมดูลกลางไม่น่าเชื่อถือเวลาโค้ดนี้รันร่วมกับ suite — limiter
// ของ endpoint นี้ง่ายพอที่จะเขียนเองและปิด scope ภายในไฟล์นี้
const REPORTS_PER_MINUTE = 30;
const RATE_WINDOW_MS = 60_000;
const rateLimitStore = new Map<
  string,
  { count: number; windowStart: number }
>();

const isRateLimited = (identifier: string): boolean => {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitStore.set(identifier, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > REPORTS_PER_MINUTE;
};

/** รายงานจาก browser: {"csp-report": {...}} (UA เก่าบางตัวส่ง field แบบ flat) */
const CspReportBodySchema = z.object({
  "csp-report": z.record(z.string(), z.unknown()).optional(),
});

/** ยาวสูงสุดต่อ field ใน log — sample ของ browser เองถูกตัดที่ 40 ตาม spec */
const MAX_FIELD_LENGTH = 120;

const sanitize = (value: unknown): string => {
  if (typeof value !== "string" || value.length === 0) return "-";
  const noQuery = value.split("?")[0] ?? value;
  const truncated = noQuery.slice(0, MAX_FIELD_LENGTH);
  // กัน log injection — แทน control characters ด้วยช่องว่าง
  return truncated.replace(/[\r\n\t]+/g, " ");
};

export async function handleCspReportRequest(
  request: Request,
): Promise<Response> {
  // จำกัดต่อ IP — report คือ diagnostic ไม่ควรกลายเป็นช่อง flood
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const clientIp =
    forwardedFor.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(`csp-report:${clientIp}`)) {
    return new Response(null, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "รูปแบบรายงานไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = CspReportBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "รูปแบบรายงานไม่ถูกต้อง" }, { status: 400 });
  }

  // UA เก่าบางตัวส่ง field แบบ flat ไม่มี wrapper — รับทั้งสองรูป
  const report =
    (parsed.data["csp-report"] as Record<string, unknown> | undefined) ??
    (typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {});

  const fields = {
    directive: sanitize(
      report["violated-directive"] ?? report["effective-directive"],
    ),
    blocked: sanitize(report["blocked-uri"]),
    document: sanitize(report["document-uri"]),
    sample: sanitize(report["script-sample"]),
    line: sanitize(
      `${report["source-file"] ?? ""}:${report["line-number"] ?? ""}`,
    ),
  };

  console.warn(
    `[CSP-REPORT] violated=${fields.directive} blocked=${fields.blocked} doc=${fields.document} src=${fields.line} sample="${fields.sample}"`,
  );

  return new Response(null, { status: 204 });
}

/**
 * ยืนยันตัวตน BLE listener ด้วย SCALE_WEBHOOK_SECRET — ใช้ร่วมระหว่าง webhook และ check-in
 */
import { timingSafeEqual } from "node:crypto";
import { env } from "@/env.mjs";

/** เทียบ secret แบบ timing-safe (header x-webhook-secret หรือ query ?secret= ของ listener รุ่นเก่า) */
const hasValidSecret = (request: Request): boolean => {
  const expected = env.SCALE_WEBHOOK_SECRET;
  if (!expected) return false;
  const provided =
    request.headers.get("x-webhook-secret") ??
    new URL(request.url).searchParams.get("secret") ??
    "";
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
};

/** คืน Response ที่ต้องตอบเมื่อ secret ไม่ผ่าน หรือ null เมื่อผ่าน */
export const rejectInvalidScaleSecret = (
  request: Request,
  route: string,
): Response | null => {
  if (hasValidSecret(request)) return null;
  // แยกกรณียังไม่ตั้งค่า env ออกจาก secret ผิด เพื่อ debug ง่าย
  if (!env.SCALE_WEBHOOK_SECRET) {
    console.error(`❌ [${route}] SCALE_WEBHOOK_SECRET is not configured`);
    return Response.json(
      { success: false, message: "ยังไม่ได้ตั้งค่า SCALE_WEBHOOK_SECRET" },
      { status: 503 },
    );
  }
  console.error(`❌ [${route}] Unauthorized - secret mismatch`);
  return Response.json(
    { success: false, message: "Unauthorized" },
    { status: 401 },
  );
};

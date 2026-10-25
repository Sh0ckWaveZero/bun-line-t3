/**
 * URL ฐานของเว็บสำหรับสร้าง absolute URL — มาจาก env APP_URL (build ผ่าน __APP_URL__
 * ใน vite.config) ไม่ใช่ env ใหม่; ว่าง (ไม่ได้ตั้ง APP_URL) = fallback เป็น path relative
 *
 * ที่ต้อง absolute: og:image / twitter:image / og:url — Facebook กับ LINE เข้มงวด
 * ต้องการ URL เต็มเท่านั้น (Discord/Twitter/Slack ยอมรับ relative แต่ใช้ absolute ได้หมด)
 */

const rawUrl: string = typeof __APP_URL__ === "string" ? __APP_URL__ : "";

/** origin ของเว็บ (ไม่มี trailing slash) — ว่างเมื่อไม่ได้ตั้ง APP_URL */
export const SITE_URL: string = (() => {
  if (!rawUrl) return "";
  try {
    return new URL(rawUrl).origin;
  } catch {
    return rawUrl.replace(/\/+$/, "");
  }
})();

/** แปลง path เป็น absolute URL เมื่อรู้จัก SITE_URL — ไม่งั้นคืน path เดิม (relative) */
export const absoluteUrl = (path: string): string => {
  if (!SITE_URL) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

/**
 * 🔐 Secure Domain Configuration | การกำหนดค่า Domain อย่างปลอดภัย
 *
 * ใช้ environment variables แทนการ hardcode domain
 * เพื่อความยืดหยุ่นและความปลอดภัยในการ deployment
 */

import { env } from "@/env.mjs";

/**
 * 🌐 Primary application domain | Domain หลักของแอปพลิเคชัน
 */
export const APP_DOMAIN = env.APP_DOMAIN || "http://localhost:4325";

/**
 * 🛡️ Allowed domains for security validation | Domain ที่อนุญาตสำหรับการตรวจสอบความปลอดภัย
 */
export const ALLOWED_DOMAINS = (env.ALLOWED_DOMAINS || "localhost,127.0.0.1")
  .split(",")
  .map((domain) => domain.trim());

/**
 * 🔄 Get callback URL for LINE OAuth | สร้าง callback URL สำหรับ LINE OAuth
 */
export const getLineCallbackUrl = (): string => {
  return `${APP_DOMAIN}/api/auth/callback/line`;
};

/**
 * 🏗️ Build secure URL | สร้าง URL ที่ปลอดภัย
 */
export const buildSecureUrl = (path: string): string => {
  // ตรวจสอบว่า path ไม่ขึ้นต้นด้วย protocol
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${APP_DOMAIN}${cleanPath}`;
};

/**
 * 🔍 Extract hostname from a full URL or bare hostname string via new URL()
 * ใช้ URL parser จริงๆ เพื่อป้องกัน bypass ด้วย encoding หรือ path injection
 */
const extractHostname = (input: string): string | null => {
  const trimmed = input?.trim();
  if (!trimmed) return null;
  try {
    // Prefix bare hostnames so new URL() can parse them
    const urlStr = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const { hostname } = new URL(urlStr);
    return hostname.toLowerCase() || null;
  } catch {
    return null;
  }
};

/**
 * 🔍 Check if a URL or hostname is in the allowed-domain list
 * 🛡️ Uses new URL() to parse the host — satisfies CodeQL js/url-redirection rule
 */
export const isAllowedDomain = (input: string): boolean => {
  if (!input || typeof input !== "string") return false;

  const hostname = extractHostname(input);
  if (!hostname || hostname.includes("..")) return false;

  return ALLOWED_DOMAINS.some((allowed) => {
    const normalized = allowed?.toLowerCase().trim();
    if (!normalized) return false;
    return hostname === normalized || hostname.endsWith(`.${normalized}`);
  });
};

/**
 * 🌍 Environment-specific domain utilities | เครื่องมือ domain ตาม environment
 */
export const isDevelopment = (): boolean => env.APP_ENV === "development";
export const isProduction = (): boolean => env.APP_ENV === "production";

/**
 * 📊 Domain configuration summary | สรุปการกำหนดค่า domain
 */
export const getDomainConfig = () => ({
  appDomain: APP_DOMAIN,
  allowedDomains: ALLOWED_DOMAINS,
  environment: env.APP_ENV,
  lineCallbackUrl: getLineCallbackUrl(),
  isDevelopment: isDevelopment(),
  isProduction: isProduction(),
});

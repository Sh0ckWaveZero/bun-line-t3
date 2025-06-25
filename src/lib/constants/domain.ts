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
export const APP_DOMAIN = env.APP_DOMAIN || "http://localhost:3000";

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
 * 🔍 Check if domain is allowed | ตรวจสอบว่า domain ได้รับอนุญาต
 */
export const isAllowedDomain = (domain: string): boolean => {
  return ALLOWED_DOMAINS.some(
    (allowedDomain) =>
      domain === allowedDomain || domain.endsWith(`.${allowedDomain}`),
  );
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

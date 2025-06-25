/**
 * 🛡️ Secure URL Validation Utilities
 * ป้องกัน malicious redirections และ request forgeries
 */

import { ALLOWED_DOMAINS } from "@/lib/constants/domain";

// ✅ Allowed hosts for security validation - ใช้ environment variables
const ALLOWED_HOSTS = {
  development: ["localhost", "127.0.0.1"] as const,
  production: ALLOWED_DOMAINS as readonly string[],
} as const;

// ✅ Environment detection
type Environment = "development" | "production";

const detectEnvironment = (): Environment => {
  return process.env.NODE_ENV === "production" ? "production" : "development";
};

// ✅ Host validation function
export const isAllowedHost = (
  hostname: string,
  env: Environment = detectEnvironment(),
): boolean => {
  const allowedHosts = [...ALLOWED_HOSTS[env]] as string[];

  // 🔍 Exact match for allowed hosts
  if (allowedHosts.includes(hostname)) {
    return true;
  }

  // 🔍 Check for subdomain matches in production
  if (env === "production") {
    return allowedHosts.some(
      (allowedHost) =>
        hostname === allowedHost || hostname.endsWith(`.${allowedHost}`),
    );
  }

  return false;
};

// ✅ Comprehensive URL validation
export const validateUrl = (
  url: string,
  env: Environment = detectEnvironment(),
): {
  isValid: boolean;
  hostname: string | null;
  error?: string;
} => {
  try {
    // 🛡️ Parse URL securely
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // 🔒 Check protocol first
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return {
        isValid: false,
        hostname,
        error: "Only HTTP and HTTPS protocols are allowed",
      };
    }

    // ✅ Check against allowed hosts
    if (!isAllowedHost(hostname, env)) {
      return {
        isValid: false,
        hostname,
        error: `Host "${hostname}" is not in the allowed list for ${env} environment`,
      };
    }

    return {
      isValid: true,
      hostname,
    };
  } catch {
    return {
      isValid: false,
      hostname: null,
      error: "Invalid URL format",
    };
  }
};

// ✅ Safe URL checker with environment context
export const isSafeUrl = (url: string): boolean => {
  const validation = validateUrl(url);
  return validation.isValid;
};

// ✅ Get safe redirect URL (with fallback)
export const getSafeRedirectUrl = (
  url: string,
  fallback: string = "/",
  env: Environment = detectEnvironment(),
): string => {
  const validation = validateUrl(url, env);

  if (validation.isValid) {
    return url;
  }

  // 📝 Log security attempt for monitoring
  console.warn(
    `🚨 Security: Blocked unsafe redirect attempt to "${url}". Reason: ${validation.error}`,
  );

  return fallback;
};

// ✅ Secure URL sanitizer
export const sanitizeUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);

    // 🧹 Remove potentially dangerous query parameters
    const dangerousParams = [
      "javascript:",
      "data:",
      "vbscript:",
      "onload",
      "onerror",
      "onmouseover",
      "onclick",
    ];
    const searchParams = new URLSearchParams(parsedUrl.search);

    const paramsToDelete: string[] = [];

    for (const [key, value] of searchParams.entries()) {
      const lowerKey = key.toLowerCase();
      const lowerValue = value.toLowerCase();

      // ตรวจสอบทั้ง key และ value
      const isDangerous = dangerousParams.some(
        (param) =>
          lowerKey.includes(param.toLowerCase()) ||
          lowerValue.includes(param.toLowerCase()) ||
          lowerKey.startsWith("on") || // Event handlers
          lowerValue.includes("javascript:") ||
          lowerValue.includes("data:") ||
          lowerValue.includes("vbscript:"),
      );

      if (isDangerous) {
        paramsToDelete.push(key);
      }
    }

    // ลบพารามิเตอร์ที่อันตราย
    paramsToDelete.forEach((key) => searchParams.delete(key));

    parsedUrl.search = searchParams.toString();
    return parsedUrl.toString();
  } catch {
    return "/"; // Safe fallback
  }
};

// ✅ NextAuth specific URL validation
export const validateNextAuthUrl = (
  url: string,
): {
  isValid: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  hostname: string | null;
  error?: string;
} => {
  // ตรวจสอบทั้ง development และ production environment
  const devValidation = validateUrl(url, "development");
  const prodValidation = validateUrl(url, "production");

  // ถ้าผ่านการตรวจสอบใน environment ใดก็ได้ ถือว่าผ่าน
  const isValid = devValidation.isValid || prodValidation.isValid;

  if (!isValid) {
    return {
      isValid: false,
      isDevelopment: false,
      isProduction: false,
      hostname: devValidation.hostname || prodValidation.hostname,
      error: devValidation.error || prodValidation.error,
    };
  }

  const hostname = devValidation.hostname || prodValidation.hostname!;
  const isDevelopment = devValidation.isValid;
  const isProduction = prodValidation.isValid && !isDevelopment;

  return {
    isValid: true,
    isDevelopment,
    isProduction,
    hostname,
  };
};

// ✅ Export constants for use in components
export { ALLOWED_HOSTS };
export type { Environment };

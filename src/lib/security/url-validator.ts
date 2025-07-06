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

// เพิ่ม helper สำหรับอ่าน ALLOWED_DOMAINS สด
function getAllowedDomains(): string[] {
  if (process.env.ALLOWED_DOMAINS) {
    return process.env.ALLOWED_DOMAINS.split(",").map((d) => d.trim());
  }
  // fallback เดิม
  return ["localhost", "127.0.0.1"];
}

// ✅ Host validation function
export const isAllowedHost = (
  hostname: string,
  env: Environment = detectEnvironment(),
): boolean => {
  let allowedHosts: string[];
  if (env === "production") {
    allowedHosts = getAllowedDomains();
  } else {
    allowedHosts = ["localhost", "127.0.0.1"];
  }

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

// ✅ Comprehensive URL sanitizer with enhanced security
export const sanitizeUrl = (url: string): string => {
  try {
    // First decode any URL encoding to prevent bypass attempts
    let decodedUrl = url;
    try {
      decodedUrl = decodeURIComponent(url);
      // Double decode to catch double-encoded attacks
      decodedUrl = decodeURIComponent(decodedUrl);
    } catch {
      // If decoding fails, use original URL
      decodedUrl = url;
    }

    const parsedUrl = new URL(decodedUrl);

    // 🛡️ Enhanced dangerous protocols (comprehensive list)
    const dangerousProtocols = [
      "javascript:",
      "data:",
      "vbscript:",
      "file:",
      "ftp:",
      "jar:",
      "ws:",
      "wss:",
      "chrome:",
      "chrome-extension:",
      "moz-extension:",
      "ms-browser-extension:",
      "about:",
      "blob:",
      "filesystem:",
    ];

    // 🛡️ Comprehensive dangerous keywords (normalized)
    const dangerousKeywords = [
      // Script injection
      "javascript:",
      "data:",
      "vbscript:",
      "livescript:",
      "mocha:",
      // Event handlers (comprehensive list)
      "onabort",
      "onafterprint",
      "onbeforeprint",
      "onbeforeunload",
      "onblur",
      "oncanplay",
      "oncanplaythrough",
      "onchange",
      "onclick",
      "oncontextmenu",
      "oncopy",
      "oncuechange",
      "oncut",
      "ondblclick",
      "ondrag",
      "ondragend",
      "ondragenter",
      "ondragleave",
      "ondragover",
      "ondragstart",
      "ondrop",
      "ondurationchange",
      "onemptied",
      "onended",
      "onerror",
      "onfocus",
      "onformdata",
      "onhashchange",
      "oninput",
      "oninvalid",
      "onkeydown",
      "onkeypress",
      "onkeyup",
      "onload",
      "onloadeddata",
      "onloadedmetadata",
      "onloadstart",
      "onmousedown",
      "onmouseenter",
      "onmouseleave",
      "onmousemove",
      "onmouseout",
      "onmouseover",
      "onmouseup",
      "onmousewheel",
      "onoffline",
      "ononline",
      "onpagehide",
      "onpageshow",
      "onpaste",
      "onpause",
      "onplay",
      "onplaying",
      "onpopstate",
      "onprogress",
      "onratechange",
      "onreset",
      "onresize",
      "onscroll",
      "onsearch",
      "onseeked",
      "onseeking",
      "onselect",
      "onstalled",
      "onstorage",
      "onsubmit",
      "onsuspend",
      "ontimeupdate",
      "ontoggle",
      "onunload",
      "onvolumechange",
      "onwaiting",
      "onwheel",
      // Script tags and expressions
      "<script",
      "</script>",
      "expression(",
      "eval(",
      "settimeout(",
      "setinterval(",
      "function(",
      // CSS expressions
      "expression",
      "behavior:",
      "binding:",
      "-moz-binding:",
      // Other dangerous patterns
      "alert(",
      "confirm(",
      "prompt(",
      "document.",
      "window.",
      "location.",
      "href=",
      "src=",
    ];

    // Check if URL itself contains dangerous protocols
    const urlLower = decodedUrl.toLowerCase();
    for (const protocol of dangerousProtocols) {
      if (urlLower.startsWith(protocol)) {
        console.warn(
          `🚨 Security: Blocked dangerous protocol "${protocol}" in URL: ${url}`,
        );
        return "/";
      }
    }

    // Additional check for encoded data URLs and other bypasses
    const urlsToCheck = [url.toLowerCase(), decodedUrl.toLowerCase()];
    for (const testUrl of urlsToCheck) {
      if (
        testUrl.startsWith("data") &&
        (testUrl.includes("script") || testUrl.includes("javascript"))
      ) {
        console.warn(
          `🚨 Security: Blocked encoded data URL with script content: ${url}`,
        );
        return "/";
      }
    }

    // 🧹 Sanitize URL components
    const searchParams = new URLSearchParams(parsedUrl.search);
    const paramsToDelete: string[] = [];

    // Helper function for comprehensive danger detection
    const isDangerousString = (str: string): boolean => {
      // Multiple normalization passes to catch sophisticated attacks
      const normalized = str
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/['"`;]/g, "")
        .replace(/\t/g, "")
        .replace(/\n/g, "")
        .replace(/\r/g, "");

      // Additional check for URL-encoded dangerous patterns
      let decodedNormalized = normalized;
      try {
        decodedNormalized = decodeURIComponent(normalized);
        decodedNormalized = decodeURIComponent(decodedNormalized); // Double decode
      } catch {
        // If decoding fails, use normalized string
      }

      // Check both original and decoded versions
      const stringsToCheck = [normalized, decodedNormalized];

      return (
        stringsToCheck.some((checkStr) => {
          return dangerousKeywords.some((keyword) => {
            const normalizedKeyword = keyword.toLowerCase();
            // Exact match, starts with, or contains the dangerous pattern
            return (
              checkStr === normalizedKeyword ||
              checkStr.startsWith(normalizedKeyword) ||
              checkStr.includes(normalizedKeyword)
            );
          });
        }) ||
        // Additional checks for patterns not covered by keywords
        stringsToCheck.some((checkStr) => {
          return (
            // Generic script/function patterns
            checkStr.includes("eval(") ||
            checkStr.includes("function(") ||
            checkStr.includes("settimeout(") ||
            checkStr.includes("setinterval(") ||
            checkStr.includes("alert(") ||
            checkStr.includes("confirm(") ||
            checkStr.includes("prompt(") ||
            // CSS expression patterns
            checkStr.includes("expression(") ||
            checkStr.includes("behavior:") ||
            checkStr.includes("binding:") ||
            checkStr.includes("-moz-binding:") ||
            checkStr.includes("@import") ||
            // DOM manipulation patterns
            checkStr.includes("document.") ||
            checkStr.includes("window.") ||
            checkStr.includes("location.") ||
            // Script injection patterns
            checkStr.includes("<script") ||
            checkStr.includes("</script>") ||
            // Event handler patterns (more comprehensive)
            /on[a-z]+=/.test(checkStr) ||
            /on[a-z]+\s*=/.test(checkStr)
          );
        })
      );
    };

    // Sanitize query parameters
    for (const [key, value] of searchParams.entries()) {
      if (isDangerousString(key) || isDangerousString(value)) {
        paramsToDelete.push(key);
        console.warn(
          `🚨 Security: Removed dangerous query parameter "${key}=${value}"`,
        );
      }
    }

    // Remove dangerous parameters
    paramsToDelete.forEach((key) => searchParams.delete(key));
    parsedUrl.search = searchParams.toString();

    // 🧹 Sanitize hash fragment
    if (parsedUrl.hash && isDangerousString(parsedUrl.hash)) {
      console.warn(
        `🚨 Security: Removed dangerous hash fragment: ${parsedUrl.hash}`,
      );
      parsedUrl.hash = "";
    }

    // 🧹 Sanitize pathname for obvious script injections
    if (parsedUrl.pathname && isDangerousString(parsedUrl.pathname)) {
      console.warn(
        `🚨 Security: Detected dangerous path, using safe fallback: ${parsedUrl.pathname}`,
      );
      return "/";
    }

    const sanitizedUrl = parsedUrl.toString();

    // Final safety check - if the resulting URL still contains dangerous patterns, reject it
    if (isDangerousString(sanitizedUrl)) {
      console.warn(`🚨 Security: Final check failed for URL: ${sanitizedUrl}`);
      return "/";
    }

    return sanitizedUrl;
  } catch (error) {
    console.warn(`🚨 Security: URL parsing error for "${url}": ${error}`);
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

// ✅ Additional security validation functions

/**
 * Enhanced protocol validation with comprehensive dangerous protocol detection
 */
export const isSecureProtocol = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    const allowedProtocols = ["http:", "https:"];
    return allowedProtocols.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

/**
 * Deep URL validation that checks all components for malicious content
 */
export const deepValidateUrl = (
  url: string,
): {
  isValid: boolean;
  issues: string[];
  sanitizedUrl: string;
} => {
  const issues: string[] = [];

  // Check protocol
  if (!isSecureProtocol(url)) {
    issues.push("Dangerous or unsupported protocol detected");
  }

  // Check for URL encoding bypass attempts
  let testUrl = url;
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(testUrl);
      if (decoded !== testUrl) {
        testUrl = decoded;
        if (
          decoded.toLowerCase().includes("javascript:") ||
          decoded.toLowerCase().includes("data:") ||
          decoded.toLowerCase().includes("vbscript:")
        ) {
          issues.push("URL encoding bypass attempt detected");
          break;
        }
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  // Sanitize the URL
  const sanitizedUrl = sanitizeUrl(url);

  // Check if sanitization changed the URL significantly
  if (sanitizedUrl === "/" && url !== "/") {
    issues.push("URL rejected by sanitization process");
  }

  // Validate the sanitized URL
  const validation = validateUrl(sanitizedUrl);
  if (!validation.isValid) {
    issues.push(validation.error || "URL validation failed");
  }

  return {
    isValid: issues.length === 0,
    issues,
    sanitizedUrl,
  };
};

/**
 * Content Security Policy (CSP) helper for URL validation
 */
export const validateUrlForCSP = (
  url: string,
  directive: string = "default-src",
): boolean => {
  const validation = deepValidateUrl(url);

  if (!validation.isValid) {
    console.warn(
      `🚨 CSP: URL "${url}" failed validation for directive "${directive}":`,
      validation.issues,
    );
    return false;
  }

  // Additional CSP-specific checks
  try {
    const parsedUrl = new URL(validation.sanitizedUrl);

    // For connect-src, script-src, style-src etc., ensure HTTPS in production
    if (
      process.env.NODE_ENV === "production" &&
      ["connect-src", "script-src", "style-src", "img-src"].includes(
        directive,
      ) &&
      parsedUrl.protocol !== "https:"
    ) {
      console.warn(
        `🚨 CSP: Non-HTTPS URL "${url}" not allowed for directive "${directive}" in production`,
      );
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

// ✅ Export constants for use in components
export { ALLOWED_HOSTS };
export type { Environment };

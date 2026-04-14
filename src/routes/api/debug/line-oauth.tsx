import { createFileRoute } from "@tanstack/react-router";
import { validateAppUrl, isAllowedHost } from "@/lib/security/url-validator";

export async function GET(request: Request) {
  try {
    // 🛡️ Security: Read URLs exclusively from env vars — no hardcoded fallback
    // domains to prevent redirecting to a domain we don't own.
    const appUrl = process.env.APP_URL ?? "";
    const frontendUrl = process.env.FRONTEND_URL ?? "";
    const allowedDomains = process.env.ALLOWED_DOMAINS ?? "";
    const appEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? "unknown";

    const appUrlValidation = validateAppUrl(appUrl);
    const frontendValidation = validateAppUrl(frontendUrl);

    // Only expose a safeAppUrl if it is actually validated; never fall back to a
    // placeholder domain.
    const safeAppUrl = appUrlValidation.isValid ? appUrl : null;
    const safeFrontendUrl = frontendValidation.isValid ? frontendUrl : null;

    // 🛡️ Calculate callback URL with security validation
    const callbackBase = safeAppUrl ?? "";
    const callbackUrl = callbackBase ? `${callbackBase}/api/auth/callback/line` : null;
    const callbackValidation = callbackUrl ? validateAppUrl(callbackUrl) : { isValid: false, error: "APP_URL not configured" };

    // 🔍 Check ALLOWED_DOMAINS configuration
    const allowedDomainsList = allowedDomains ? allowedDomains.split(",").map((d) => d.trim()).filter(Boolean) : [];
    const isProduction = appEnv === "production";
    const allowedDomainsConfigured = allowedDomainsList.length > 0;

    // 🔍 Check if each trusted origin is in ALLOWED_DOMAINS
    const trustedOrigins = [
      appUrl,
      frontendUrl,
      process.env.APP_DOMAIN,
    ].filter(Boolean).map((url) => {
      try {
        return new URL(url).origin;
      } catch {
        return null;
      }
    }).filter((origin): origin is string => origin !== null);

    const originValidation = trustedOrigins.map((origin) => {
      try {
        const hostname = new URL(origin).hostname;
        const isAllowed = isAllowedHost(hostname, isProduction ? "production" : "development");
        return {
          origin,
          hostname,
          isAllowed,
          inAllowedDomains: allowedDomainsList.some((domain) =>
            hostname === domain || hostname.endsWith(`.${domain}`)
          ),
        };
      } catch {
        return {
          origin,
          hostname: null,
          isAllowed: false,
          inAllowedDomains: false,
        };
      }
    });

    // Get configuration from environment variables
    const config = {
      // Environment info
      nodeEnv: process.env.NODE_ENV || "unknown",
      appEnv: process.env.APP_ENV || "unknown",
      isProduction,

      // LINE configuration
      clientId: process.env.LINE_CLIENT_ID || "Not configured",

      // 🛡️ Security: Validated URL configuration
      appUrl: safeAppUrl,
      frontendUrl: safeFrontendUrl,
      callbackUrl,

      // 🔒 ALLOWED_DOMAINS configuration
      allowedDomains: {
        configured: allowedDomainsConfigured,
        domains: allowedDomainsList,
        count: allowedDomainsList.length,
      },

      // 🔍 Origin validation details
      origins: originValidation,

      // 🔒 Security validation results
      security: {
        appUrl: {
          original: appUrl,
          validated: appUrlValidation,
          isSafe: appUrlValidation.isValid,
        },
        frontendUrl: {
          original: frontendUrl,
          validated: frontendValidation,
          isSafe: frontendValidation.isValid,
        },
        callbackUrl: {
          validated: callbackValidation,
          isSafe: callbackValidation.isValid,
        },
      },

      // ⚠️ Critical warnings
      warnings: [] as string[],
      criticalIssues: [] as string[],
    };

    // 🔍 Add critical issues
    if (isProduction && !allowedDomainsConfigured) {
      config.criticalIssues.push(
        "ALLOWED_DOMAINS is not configured in production - this will cause OAuth callbacks to FAIL!"
      );
    }

    // 🔍 Add warnings for origins not in ALLOWED_DOMAINS
    const invalidOrigins = originValidation.filter((o) => !o.isAllowed);
    if (invalidOrigins.length > 0) {
      config.warnings.push(
        `${invalidOrigins.length} trusted origin(s) are NOT in ALLOWED_DOMAINS: ${invalidOrigins.map((o) => o.origin).join(", ")}`
      );
    }

    // 🔍 Check if callback URL is valid
    if (!callbackValidation.isValid) {
      config.criticalIssues.push(
        `Callback URL validation failed: ${callbackValidation.error || "Unknown error"}`
      );
    }

    // Add remaining fields
    config.oauthUrl = callbackValidation.isValid
      ? `https://access.line.me/oauth2/v2.1/authorize?client_id=${process.env.LINE_CLIENT_ID}&scope=openid%20profile&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl!)}&state=test`
      : null;

    config.requestUrl = request.url;
    config.requestHost = request.headers.get("host");

    config.envVars = {
      APP_URL: process.env.APP_URL,
      FRONTEND_URL: process.env.FRONTEND_URL,
      LINE_CLIENT_ID: process.env.LINE_CLIENT_ID
        ? "***configured***"
        : "Not configured",
      HOSTNAME: process.env.HOSTNAME,
      PORT: process.env.PORT,
    };

    return Response.json(config, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Failed to get LINE OAuth config:", error);
    return Response.json(
      {
        error: "Failed to get configuration",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/debug/line-oauth")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});

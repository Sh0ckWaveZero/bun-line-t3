import { createFileRoute } from "@tanstack/react-router";
import { validateAppUrl } from "@/lib/security/url-validator";

export async function GET(request: Request) {
  try {
    // 🛡️ Security: Read URLs exclusively from env vars — no hardcoded fallback
    // domains to prevent redirecting to a domain we don't own.
    const appUrl = process.env.APP_URL ?? "";
    const frontendUrl = process.env.FRONTEND_URL ?? "";

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

    // Get configuration from environment variables
    const config = {
      // Environment info
      nodeEnv: process.env.NODE_ENV || "unknown",
      appEnv: process.env.APP_ENV || "unknown",

      // LINE configuration
      clientId: process.env.LINE_CLIENT_ID || "Not configured",

      // 🛡️ Security: Validated URL configuration
      appUrl: safeAppUrl,
      frontendUrl: safeFrontendUrl,
      callbackUrl,

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

      // Generated OAuth URL (using safe URLs only)
      oauthUrl: callbackValidation.isValid
        ? `https://access.line.me/oauth2/v2.1/authorize?client_id=${process.env.LINE_CLIENT_ID}&scope=openid%20profile&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl!)}&state=test`
        : null,

      // Current request info
      requestUrl: request.url,
      requestHost: request.headers.get("host"),

      // All relevant env vars (sanitized)
      envVars: {
        APP_URL: process.env.APP_URL,
        FRONTEND_URL: process.env.FRONTEND_URL,
        LINE_CLIENT_ID: process.env.LINE_CLIENT_ID
          ? "***configured***"
          : "Not configured",
        HOSTNAME: process.env.HOSTNAME,
        PORT: process.env.PORT,
      },
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

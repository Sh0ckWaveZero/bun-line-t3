import { createFileRoute } from "@tanstack/react-router";
import {
  validateAppUrl,
  getSafeRedirectUrl,
} from "@/lib/security/url-validator";

export async function GET(request: Request) {
  try {
    // 🛡️ Security: Force production URL for all environments
    const PRODUCTION_URL = "https://your-app.example.com";

    // 🔒 Security: Validate production URL
    const productionUrlValidation = validateAppUrl(PRODUCTION_URL);
    if (!productionUrlValidation.isValid) {
      console.error(
        `🚨 Security: Production URL failed validation: ${productionUrlValidation.error}`,
      );
    }

    // 🛡️ Security: Validate environment URLs
    const appUrl = process.env.APP_URL ?? PRODUCTION_URL;
    const frontendUrl = process.env.FRONTEND_URL || PRODUCTION_URL;

    const appUrlValidation = validateAppUrl(appUrl);
    const frontendValidation = validateAppUrl(frontendUrl);

    // 🔒 Security: Use safe redirect URLs
    const safeAppUrl = getSafeRedirectUrl(appUrl, PRODUCTION_URL);
    const safeFrontendUrl = getSafeRedirectUrl(frontendUrl, PRODUCTION_URL);

    // 🛡️ Calculate callback URL with security validation
    const callbackUrl = `${PRODUCTION_URL}/api/auth/callback/line`;
    const callbackValidation = validateAppUrl(callbackUrl);

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
        productionUrl: {
          validated: productionUrlValidation,
          isSafe: productionUrlValidation.isValid,
        },
      },

      // Generated OAuth URL (using safe URLs only)
      oauthUrl: callbackValidation.isValid
        ? `https://access.line.me/oauth2/v2.1/authorize?client_id=${process.env.LINE_CLIENT_ID}&scope=openid%20profile&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&state=test`
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

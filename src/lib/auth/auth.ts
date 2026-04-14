import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "@/env.mjs";
import { db } from "../database/db";
import type { AppSession } from "./session-context";
import { syncLineProfileToDatabase } from "./line-profile-sync";
import { isAllowedHost } from "@/lib/security/url-validator";

const LINE_FALLBACK_EMAIL_DOMAIN = "line.local";
const DEFAULT_DEV_PORT = "4325";

const getLocalDevOrigin = () => {
  const port = process.env.PORT || DEFAULT_DEV_PORT;
  return `http://localhost:${port}`;
};

const getLoopbackDevOrigin = () => {
  const port = process.env.PORT || DEFAULT_DEV_PORT;
  return `http://127.0.0.1:${port}`;
};

const getAuthBaseUrl = () => {
  return env.APP_URL;
};

const getTrustedOrigins = () => {
  const origins = [
    env.APP_URL,
    env.FRONTEND_URL,
    env.APP_DOMAIN,
    ...(env.APP_ENV === "development"
      ? [getLocalDevOrigin(), getLoopbackDevOrigin()]
      : []),
  ];

  // Support comma-separated URLs in environment variables
  const expandedOrigins = origins.flatMap((url) => {
    if (!url) return [];
    return url
      .split(",")
      .map((u) => {
        const trimmed = u.trim();
        try {
          const origin = new URL(trimmed).origin;
          return origin;
        } catch {
          console.warn(`[Auth] Invalid URL in trusted origins: "${trimmed}"`);
          return null;
        }
      })
      .filter((origin): origin is string => origin !== null);
  });

  const uniqueOrigins = Array.from(new Set(expandedOrigins));
  console.log(`[Auth] Trusted origins:`, uniqueOrigins);

  return uniqueOrigins;
};

// 🔍 Validate ALLOWED_DOMAINS configuration in production
const validateProductionDomains = () => {
  if (env.APP_ENV !== "production") {
    return; // Skip validation in development
  }

  const allowedDomains = env.ALLOWED_DOMAINS || "";
  const domainsList = allowedDomains.split(",").map((d) => d.trim()).filter(Boolean);

  // ⚠️ Warning: ALLOWED_DOMAINS not configured
  if (domainsList.length === 0 || allowedDomains === "") {
    console.error(`
╔══════════════════════════════════════════════════════════════════════╗
║  🔴 CRITICAL: ALLOWED_DOMAINS not configured in production!         ║
╚══════════════════════════════════════════════════════════════════════╝

This will cause LINE Login and ALL OAuth callbacks to FAIL!

🔧 Fix: Add this to your environment variables or GitHub Secrets:
   ALLOWED_DOMAINS=your-domain.com,www.your-domain.com

📝 Replace "your-domain.com" with your actual production domain.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Configuration:
  APP_URL: ${env.APP_URL}
  FRONTEND_URL: ${env.FRONTEND_URL}
  APP_DOMAIN: ${env.APP_DOMAIN}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What will break without ALLOWED_DOMAINS:
  ❌ LINE Login OAuth callbacks
  ❌ All social provider logins
  ❌ Cross-origin requests
  ❌ URL redirects
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    return;
  }

  // ✅ Validate each trusted origin against ALLOWED_DOMAINS
  const trustedOrigins = getTrustedOrigins();
  const invalidOrigins: string[] = [];

  for (const origin of trustedOrigins) {
    try {
      const url = new URL(origin);
      const hostname = url.hostname;

      if (!isAllowedHost(hostname, "production")) {
        invalidOrigins.push(origin);
        console.warn(`[Auth] ⚠️ Origin "${origin}" is NOT in ALLOWED_DOMAINS!`);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  if (invalidOrigins.length > 0) {
    console.warn(`
[Auth] ⚠️ Warning: Some trusted origins are NOT in ALLOWED_DOMAINS:
${invalidOrigins.map((o) => `  - ${o}`).join("\n")}

This may cause OAuth callbacks to fail!

Current ALLOWED_DOMAINS: ${domainsList.join(", ")}
`);
  } else {
    console.log(`
[Auth] ✅ All trusted origins validated against ALLOWED_DOMAINS:
  Domains: ${domainsList.join(", ")}
`);
  }
};

const createSyntheticLineEmail = (lineUserId: string) => {
  const normalizedId =
    lineUserId
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "") || "line-user";

  return `${normalizedId}@${LINE_FALLBACK_EMAIL_DOMAIN}`;
};

const toIsoString = (value: Date | string) => {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
};

const syncLineApprovalRequest = async (account: {
  accountId: string;
  accessToken?: string | null;
  providerId: string;
  userId: string;
}) => {
  if (account.providerId !== "line") {
    return;
  }

  const lineUserId = account.accountId;
  if (!lineUserId) {
    console.warn("[LINE Profile Sync] Missing LINE user ID");
    return;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: account.userId },
      select: { name: true, image: true },
    });

    await syncLineProfileToDatabase({
      accessToken: account.accessToken,
      fallbackDisplayName: user?.name,
      fallbackPictureUrl: user?.image,
      lineUserId,
      userId: account.userId,
    });
  } catch (error) {
    console.error("[LINE Profile Sync] Database sync failed:", error);
    throw error;
  }
};

// 🔍 Validate production domain configuration at startup
validateProductionDomains();

export const auth = betterAuth({
  baseURL: getAuthBaseUrl(),
  database: prismaAdapter(db, {
    provider: "mongodb",
  }),
  advanced: {
    useSecureCookies: env.APP_ENV === "production",
    database: {
      generateId: false,
    },
    // 🔒 Trust X-Forwarded-* headers from reverse proxy
    // Required for HTTPS detection behind load balancers/reverse proxies
    cookiePrefix: env.APP_ENV === "production" ? "__Secure-" : "",
  },
  plugins: [tanstackStartCookies()],
  secret: env.AUTH_SECRET,
  trustedOrigins: getTrustedOrigins(),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
    },
  },
  account: {
    // LINE Login can complete in a different browser context (e.g., LINE app)
    // than the one that started the flow, so the signed state cookie may not
    // be returned on the callback. Keep Better Auth's database-backed state
    // + PKCE checks for security, but do not require the extra cookie binding.
    skipStateCookieCheck: true,
  },
  socialProviders: {
    line: {
      clientId: env.LINE_CLIENT_ID,
      clientSecret: env.LINE_CLIENT_SECRET,
      overrideUserInfoOnSignIn: true,
      enableStateParam: true,
      mapProfileToUser(profile) {
        const lineProfile = profile as {
          displayName?: string;
          email?: string;
          name?: string;
          picture?: string;
          pictureUrl?: string;
          sub?: string;
          userId?: string;
        };
        const lineUserId = lineProfile.sub ?? lineProfile.userId ?? "";

        if (!lineUserId) {
          throw new Error("Invalid LINE profile: missing user ID");
        }

        return {
          email:
            lineProfile.email?.toLowerCase() ??
            createSyntheticLineEmail(lineUserId),
          emailVerified: Boolean(lineProfile.email),
          image: lineProfile.picture ?? lineProfile.pictureUrl,
          name: lineProfile.name ?? lineProfile.displayName ?? "LINE User",
        };
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          // Handle duplicate session token from OAuth callback retries
          // (e.g. Cloudflare Tunnel retrying the LINE callback request)
          try {
            await db.session.deleteMany({ where: { token: session.token } });
          } catch {
            // ignore — if delete fails, let create proceed and surface the real error
          }
          return { data: session };
        },
      },
    },
    account: {
      create: {
        async after(account) {
          try {
            await syncLineApprovalRequest(account);
          } catch (error) {
            // ไม่ throw error เพื่อไม่ให้กระทบการ login
            console.error("[LINE Profile Sync Error]", error);
          }
        },
      },
      update: {
        async after(account) {
          try {
            await syncLineApprovalRequest(account);
          } catch (error) {
            // ไม่ throw error เพื่อไม่ให้กระทบการ login
            console.error("[LINE Profile Sync Error]", error);
          }
        },
      },
    },
  },
});

/**
 * Server-side session helper — returns basic session only (sessions + users queries).
 * ไม่ query LINE account ที่นี่ เพื่อให้ caller รวม query ได้
 */
export const getServerAuthSession = async (request?: Request) => {
  const activeRequest = request ?? getRequest();
  const session = await auth.api.getSession({
    headers: activeRequest.headers,
  });

  if (!session) {
    return null;
  }

  return {
    expires: toIsoString(session.session.expiresAt),
    isAdmin: session.user.role === "admin",
    user: {
      email: session.user.email,
      id: session.user.id,
      image: session.user.image,
      name: session.user.name,
      role: session.user.role ?? null,
    },
  } satisfies AppSession;
};

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "@/env.mjs";
import { db } from "../database/db";
import type { AppSession } from "./session-context";

const LINE_FALLBACK_EMAIL_DOMAIN = "line.local";
const DEFAULT_DEV_PORT = "4325";

const calculateExpiryDate = () => {
  const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;
  const SECONDS_IN_A_MILLISECOND = 1 / 1000;
  return Math.floor(
    (Date.now() + 90 * MILLISECONDS_IN_A_DAY) * SECONDS_IN_A_MILLISECOND,
  );
};

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

const getTrustedOrigins = () =>
  Array.from(
    new Set(
      [
        env.APP_URL,
        env.FRONTEND_URL,
        env.APP_DOMAIN,
        ...(env.APP_ENV === "development"
          ? [getLocalDevOrigin(), getLoopbackDevOrigin()]
          : []),
      ].map((url) => {
        return new URL(url).origin;
      }),
    ),
  );

const createSyntheticLineEmail = (lineUserId: string) => {
  const normalizedId =
    lineUserId
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "") || "line-user";

  return `${normalizedId}@${LINE_FALLBACK_EMAIL_DOMAIN}`;
};

const toIsoString = (value: Date | string) => {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

export const auth = betterAuth({
  baseURL: getAuthBaseUrl(),
  database: prismaAdapter(db, {
    provider: "mongodb",
  }),
  advanced: {
    database: {
      generateId: false,
    },
  },
  plugins: [tanstackStartCookies()],
  secret: env.AUTH_SECRET ?? env.LINE_CHANNEL_SECRET,
  trustedOrigins: getTrustedOrigins(),
  user: {
    fields: {
      emailVerified: "emailVerifiedFlag",
    },
  },
  session: {
    fields: {
      expiresAt: "expires",
      token: "sessionToken",
    },
  },
  account: {
    skipStateCookieCheck: env.APP_ENV === "development",
    fields: {
      accountId: "providerAccountId",
      providerId: "provider",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
    },
  },
  verification: {
    modelName: "verificationToken",
    fields: {
      expiresAt: "expires",
      value: "token",
    },
  },
  socialProviders: {
    line: {
      clientId: env.LINE_CLIENT_ID,
      clientSecret: env.LINE_CLIENT_SECRET,
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
    account: {
      create: {
        async before(account) {
          return {
            data: {
              ...account,
              expires_at: calculateExpiryDate(),
            },
          };
        },
      },
      update: {
        async before(account) {
          return {
            data: {
              ...account,
              expires_at: calculateExpiryDate(),
            },
          };
        },
      },
    },
  },
});

/**
 * Server-side session helper for TanStack Start routes and server functions.
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
    user: {
      email: session.user.email,
      id: session.user.id,
      image: session.user.image,
      name: session.user.name,
    },
  } satisfies AppSession;
};

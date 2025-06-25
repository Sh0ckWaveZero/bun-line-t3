import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (str) => !str.includes("YOUR_MYSQL_URL_HERE"),
        "You forgot to change the default URL",
      ),
    APP_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXTAUTH_SECRET:
      process.env.APP_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    NEXTAUTH_URL: z.string().url(),
    // Add `.min(1) on ID and SECRET if you want to make sure they're not empty
    LINE_CLIENT_ID: z.string(),
    LINE_CLIENT_SECRET: z.string(),
    LINE_CHANNEL_SECRET: z.string(),
    JWT_EXPIRES_IN: z.string().default("1d"),
    LINE_MESSAGING_API: z.string().url(),
    LINE_CHANNEL_ACCESS: z.string(),
    CMC_URL: z.string().url(),
    CMC_API_KEY: z.string(),
    FRONTEND_URL: z.string().url(),
    AIRVISUAL_API_KEY: z.string(),
    INTERNAL_API_KEY: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    // 🔐 Security: Domain configuration through environment (NO DEFAULTS - must be explicitly set)
    APP_DOMAIN: z.string().url(),
    ALLOWED_DOMAINS: z.string().min(1),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    APP_ENV: process.env.APP_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    LINE_CLIENT_ID: process.env.LINE_CLIENT_ID,
    LINE_CLIENT_SECRET: process.env.LINE_CLIENT_SECRET,
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    LINE_MESSAGING_API: process.env.LINE_MESSAGING_API,
    LINE_CHANNEL_ACCESS: process.env.LINE_CHANNEL_ACCESS,
    CMC_URL: process.env.CMC_URL,
    CMC_API_KEY: process.env.CMC_API_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL,
    AIRVISUAL_API_KEY: process.env.AIRVISUAL_API_KEY,
    INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    APP_DOMAIN: process.env.APP_DOMAIN,
    ALLOWED_DOMAINS: process.env.ALLOWED_DOMAINS,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

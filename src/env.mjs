import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
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
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
    APP_URL: z.string().url(),
    LINE_CLIENT_ID: z.string(),
    LINE_CLIENT_SECRET: z.string(),
    LINE_CHANNEL_SECRET: z.string(),
    JWT_EXPIRES_IN: z.string().default("1d"),
    LINE_MESSAGING_API: z.string().url(),
    LINE_CHANNEL_ACCESS: z.string(),
    // 🔐 Admin LINE User IDs (comma separated) — สำหรับอนุมัติ/ปฏิเสธ LINE users
    ADMIN_LINE_USER_IDS: z.string().optional().default(""),
    CMC_URL: z.string().url(),
    CMC_API_KEY: z.string(),
    FRONTEND_URL: z.string().url(),
    AIRVISUAL_API_KEY: z.string(),
    INTERNAL_API_KEY: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    // 🔐 Security: Domain configuration through environment (NO DEFAULTS - must be explicitly set)
    APP_DOMAIN: z.string().url(),
    ALLOWED_DOMAINS: z.string().min(1),
    // 🧪 Development Test User ID
    DEV_TEST_USER_ID: z.string().optional(),
    // 🤖 AI Assistant Configuration
    OPENAI_API_KEY: z.string().optional(),
    MCP_AI_MODEL: z.string().default("gpt-5-nano"),
    SPOTIFY_CLIENT_ID: z.string().optional(),
    SPOTIFY_CLIENT_SECRET: z.string().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    APP_ENV: process.env.APP_ENV,
    AUTH_SECRET: process.env.AUTH_SECRET ||
      (process.env.APP_ENV === "development"
        ? "development-secret-key-min-32-chars-long-please-change-in-production"
        : undefined),
    APP_URL: process.env.APP_URL ?? process.env.FRONTEND_URL,
    LINE_CLIENT_ID: process.env.LINE_CLIENT_ID,
    LINE_CLIENT_SECRET: process.env.LINE_CLIENT_SECRET,
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    LINE_MESSAGING_API: process.env.LINE_MESSAGING_API,
    LINE_CHANNEL_ACCESS: process.env.LINE_CHANNEL_ACCESS,
    ADMIN_LINE_USER_IDS: process.env.ADMIN_LINE_USER_IDS,
    CMC_URL: process.env.CMC_URL,
    CMC_API_KEY: process.env.CMC_API_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL,
    AIRVISUAL_API_KEY: process.env.AIRVISUAL_API_KEY,
    INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    APP_DOMAIN: process.env.APP_DOMAIN,
    ALLOWED_DOMAINS: process.env.ALLOWED_DOMAINS,
    DEV_TEST_USER_ID: process.env.DEV_TEST_USER_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MCP_AI_MODEL: process.env.MCP_AI_MODEL,
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

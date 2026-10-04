import { z } from "zod";
import { validateCronJobExpression } from "../services/cron-jobs.server";

export const cronJobInputSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(
      /^[a-z0-9][a-z0-9-]*$/,
      "key ต้องเป็นตัวพิมพ์เล็ก ตัวเลข และขีดกลาง",
    ),
  name: z.string().trim().min(1).max(120),
  method: z.enum(["GET", "POST"]),
  endpoint: z
    .string()
    .trim()
    .regex(/^\/api\/cron\/[A-Za-z0-9/_-]+$/)
    .refine((value) => !value.includes(".."), "endpoint ไม่ถูกต้อง")
    .refine(
      (value) => value !== "/api/cron/dispatch",
      "ไม่สามารถตั้ง dispatcher เป็น Cron Job ปลายทางได้",
    ),
  cronExpression: z
    .string()
    .trim()
    .refine(validateCronJobExpression, "cron expression ไม่ถูกต้อง"),
  scheduleLabel: z.string().trim().min(1).max(120),
  timezone: z.literal("Asia/Bangkok"),
  environment: z.enum(["production", "staging", "development"]),
  targetName: z.string().trim().min(1).max(120),
  targetKind: z.enum([
    "attendance",
    "webhook",
    "database",
    "search",
    "notifications",
    "payments",
    "fraud",
    "reports",
    "storage",
    "sync",
    "security",
  ]),
  ownerName: z.string().trim().min(1).max(120),
  ownerInitials: z.string().trim().min(1).max(8),
  ownerColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/),
  enabled: z.boolean().default(true),
});

export const cronJobPatchSchema = cronJobInputSchema.partial();

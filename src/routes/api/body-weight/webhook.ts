/**
 * Body Weight Webhook — รับผลชั่งจาก miscale-dashboard
 * POST /api/body-weight/webhook?secret=<SCALE_WEBHOOK_SECRET>
 *
 * ตั้งค่าฝั่งตาชั่ง: MISCALE_WEBHOOK_URL=https://<app>/api/body-weight/webhook?secret=<ค่าเดียวกับ env>
 */

import { timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { env } from "@/env.mjs";
import { ingestScaleWebhook } from "@/features/body-weight/services/body-weight.server";

const webhookSchema = z.object({
  event: z.enum(["measurement", "analysis"]),
  text: z.string().max(4000).optional(),
  message: z.string().max(4000).optional(),
  profile: z
    .object({ id: z.number(), name: z.string().min(1).max(60) })
    .nullable()
    .optional(),
  measurement: z.object({
    id: z.number().int(),
    measured_at: z
      .string()
      .refine((value) => !Number.isNaN(new Date(value).getTime()), {
        message: "measured_at ต้องเป็นวันที่ที่อ่านได้",
      }),
    weight_kg: z.number().positive().max(500),
    impedance: z.number().int().positive().max(3000).nullable().optional(),
  }),
});

/** เทียบ secret แบบ timing-safe (กับ secret ใน query หรือ header) */
const hasValidSecret = (request: Request): boolean => {
  const expected = env.SCALE_WEBHOOK_SECRET;
  if (!expected) return false;
  const provided =
    new URL(request.url).searchParams.get("secret") ??
    request.headers.get("x-webhook-secret") ??
    "";
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function POST(request: Request) {
  try {
    if (!hasValidSecret(request)) {
      // แยกกรณียังไม่ตั้งค่า env ออกจาก secret ผิด เพื่อ debug ง่าย
      if (!env.SCALE_WEBHOOK_SECRET) {
        console.error(
          "❌ [/api/body-weight/webhook] SCALE_WEBHOOK_SECRET is not configured",
        );
        return Response.json(
          { success: false, message: "ยังไม่ได้ตั้งค่า SCALE_WEBHOOK_SECRET" },
          { status: 503 },
        );
      }
      console.error(
        "❌ [/api/body-weight/webhook] Unauthorized - secret mismatch",
      );
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const input = webhookSchema.parse(await request.json());
    const result = await ingestScaleWebhook(input);

    return Response.json({ success: true, status: result.status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, message: "ข้อมูลไม่ถูกต้อง", details: error.issues },
        { status: 400 },
      );
    }
    console.error(
      "❌ [/api/body-weight/webhook]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { success: false, message: "ไม่สามารถบันทึกผลการชั่งได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/body-weight/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});

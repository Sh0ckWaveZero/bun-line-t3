/**
 * Body Weight Webhook — ทางเข้าข้อมูลตาชั่งทั้งหมด
 * POST /api/body-weight/webhook (header x-webhook-secret: <SCALE_WEBHOOK_SECRET>)
 *
 * event "reading" — packet ดิบจาก BLE listener ของเราเอง (`bun run scale:listen`)
 *   รับเฉพาะจากเครื่องที่เลือกไว้ในหน้า /body-weight (ตอบ "disabled" ถ้าไม่ใช่)
 * event "measurement" — ผลชั่งจัดกลุ่มแล้วจาก miscale-dashboard (ทางเลือกเก่า)
 * event "analysis" — ไม่รองรับ รับแล้วข้าม
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  ingestScaleReading,
  ingestScaleWebhook,
} from "@/features/body-weight/services/body-weight.server";
import {
  recordLiveReading,
  recordMeasurementChange,
} from "@/features/body-weight/services/live-scale.server";
import {
  getActiveListener,
  isListenerAccepted,
} from "@/features/body-weight/services/scale-listeners.server";
import { rejectInvalidScaleSecret } from "@/features/body-weight/services/webhook-auth.server";
import { LISTENER_NAME_PATTERN } from "@/features/body-weight/types";

const measurementEventSchema = z.object({
  event: z.literal("measurement"),
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

/** packet ดิบที่ BLE listener parse แล้ว — ฝั่ง service เป็นคนจับกลุ่มเป็นการชั่ง */
const readingEventSchema = z.object({
  event: z.literal("reading"),
  /** ชื่อเครื่อง (SCALE_LISTENER_NAME) — listener รุ่นเก่าไม่ส่ง */
  listener: z.string().regex(LISTENER_NAME_PATTERN).optional(),
  reading: z.object({
    address: z.string().min(1).max(64),
    weightKg: z.number().positive().max(500),
    impedance: z.number().int().positive().max(3000).nullable(),
    stabilized: z.boolean(),
    removed: z.boolean(),
  }),
});

const webhookSchema = z.discriminatedUnion("event", [
  measurementEventSchema,
  readingEventSchema,
  z.object({ event: z.literal("analysis") }),
]);

export async function POST(request: Request) {
  try {
    const rejection = rejectInvalidScaleSecret(
      request,
      "/api/body-weight/webhook",
    );
    if (rejection) return rejection;

    const input = webhookSchema.parse(await request.json());
    if (input.event === "reading") {
      // เครื่องที่ไม่ได้ถูกเลือกในหน้าเว็บ — ทิ้ง กันสองเครื่องบันทึกการชั่งเดียวกันซ้ำ
      const active = await getActiveListener();
      if (!isListenerAccepted(input.listener ?? null, active)) {
        return Response.json({ success: true, status: "disabled" });
      }
      // ก่อน ingest — packet ที่ยังไม่นิ่ง (ingest ข้าม) ก็ต้องโชว์ในการ์ดตาชั่งสด
      recordLiveReading(input.reading);
    }
    const result =
      input.event === "measurement"
        ? await ingestScaleWebhook(input)
        : input.event === "reading"
          ? await ingestScaleReading(input.reading)
          : ({ status: "ignored" } as const);
    if (result.status === "saved" || result.status === "updated") {
      recordMeasurementChange(
        result.measurement.id,
        result.status,
        result.ownerUserId,
      );
    }

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

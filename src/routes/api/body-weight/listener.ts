/**
 * Listener check-in — BLE listener ถามทุก ~10 วิ ว่าตัวเองควรสแกนอยู่ไหม
 * GET /api/body-weight/listener?name=<SCALE_LISTENER_NAME>
 * (header x-webhook-secret: <SCALE_WEBHOOK_SECRET>)
 *
 * เป็น heartbeat ด้วย — หน้า /body-weight ใช้แสดงว่าเครื่องไหนออนไลน์
 */

import { createFileRoute } from "@tanstack/react-router";
import {
  getActiveListener,
  isListenerAccepted,
  recordListenerCheckIn,
} from "@/features/body-weight/services/scale-listeners.server";
import { rejectInvalidScaleSecret } from "@/features/body-weight/services/webhook-auth.server";
import {
  LISTENER_MODE,
  LISTENER_NAME_PATTERN,
} from "@/features/body-weight/types";

export async function GET(request: Request) {
  try {
    const rejection = rejectInvalidScaleSecret(
      request,
      "/api/body-weight/listener",
    );
    if (rejection) return rejection;

    const name = new URL(request.url).searchParams.get("name") ?? "";
    const isReservedName = Object.values(LISTENER_MODE).includes(
      name as (typeof LISTENER_MODE)[keyof typeof LISTENER_MODE],
    );
    if (!LISTENER_NAME_PATTERN.test(name) || isReservedName) {
      return Response.json(
        {
          success: false,
          message:
            'ชื่อ listener ต้องเป็นตัวเล็ก ตัวเลข หรือขีด (ไม่เกิน 32 ตัว) และห้ามใช้ "all" หรือ "off"',
        },
        { status: 400 },
      );
    }

    recordListenerCheckIn(name);
    const active = await getActiveListener();
    return Response.json(
      { success: true, enabled: isListenerAccepted(name, active), active },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "❌ [/api/body-weight/listener]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { success: false, message: "ไม่สามารถตรวจสถานะ listener ได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/body-weight/listener")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});

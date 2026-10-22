/**
 * Body Weight Live API — สถานะตาชั่งสดสำหรับหน้า /body-weight (poll ทุก ~1 วินาที)
 * GET /api/body-weight/live
 *
 * ใช้ poll แทน SSE เพราะ SSE ใน production ต้องผ่าน bridge ใน server.ts
 * (TanStack Start ปิด long-lived stream ก่อนเวลา) — poll ใช้ทางเดียวกันทั้ง dev/prod
 */

import { createFileRoute } from "@tanstack/react-router";
import { getBodyWeightReadSession } from "@/features/body-weight/services/read-session.server";
import { getLiveScaleState } from "@/features/body-weight/services/live-scale.server";

export async function GET(request: Request) {
  try {
    const session = await getBodyWeightReadSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    return Response.json(
      {
        success: true,
        data: getLiveScaleState({
          userId: session.user.id,
          isAdmin: session.isAdmin,
        }),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "[GET /api/body-weight/live]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { error: "ไม่สามารถดึงสถานะตาชั่งได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/body-weight/live")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});

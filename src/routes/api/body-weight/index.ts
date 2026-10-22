/**
 * Body Weight API — ข้อมูลการชั่งน้ำหนัก + โปรไฟล์ สำหรับหน้า /body-weight
 * GET /api/body-weight
 */

import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib/auth/auth";
import { getBodyWeightSnapshot } from "@/features/body-weight/services/body-weight.server";

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const snapshot = await getBodyWeightSnapshot({
      userId: session.user.id,
      isAdmin: session.isAdmin,
    });
    return Response.json(
      { success: true, data: snapshot },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[GET /api/body-weight]", (error as Error)?.message ?? error);
    return Response.json(
      { error: "ไม่สามารถดึงข้อมูลการชั่งน้ำหนักได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/body-weight/")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});

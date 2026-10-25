/**
 * สถิติรวมของ Planning Poker (public, ไม่ต้อง login)
 * GET /api/poker/stats
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  checkRateLimit,
  pokerRoomService,
} from "@/features/planning-poker/services/poker-room.server";

export async function GET(request: Request) {
  // lobby poll ทุก 10s — cap กันยิงรัว (ทุก hit ไล่ sweep ห้องหมดอายุด้วย)
  const limited = checkRateLimit(request, "stats");
  if (!limited.ok) {
    return Response.json({ error: limited.error }, { status: limited.status });
  }

  const stats = {
    ...pokerRoomService.getStats(),
  };
  return Response.json(stats, {
    headers: { "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/poker/stats")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});

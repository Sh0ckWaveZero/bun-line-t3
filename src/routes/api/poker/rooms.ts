/**
 * Planning Poker — สร้างห้อง (public, ไม่ต้อง login)
 * POST /api/poker/rooms
 */
import { createFileRoute } from "@tanstack/react-router";
import { createRoomSchema } from "@/features/planning-poker/lib/schemas";
import {
  checkRateLimit,
  pokerRoomService,
} from "@/features/planning-poker/services/poker-room.server";

export async function POST(request: Request) {
  const limited = checkRateLimit(request, "create");
  if (!limited.ok) {
    return Response.json({ error: limited.error }, { status: limited.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = createRoomSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const result = pokerRoomService.create(parsed.data);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result.value, { status: 201 });
}

export const Route = createFileRoute("/api/poker/rooms")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});

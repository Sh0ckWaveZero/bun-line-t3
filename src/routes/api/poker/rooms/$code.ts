/**
 * Planning Poker — สถานะห้อง + action (public, ไม่ต้อง login)
 * GET  /api/poker/rooms/$code  — สถานะห้อง (header x-poker-token เป็น optional)
 * POST /api/poker/rooms/$code  — join / vote / reveal / reset / story / leave
 */
import { createFileRoute } from "@tanstack/react-router";
import { roomActionSchema } from "@/features/planning-poker/lib/schemas";
import {
  checkRateLimit,
  getRequestToken,
  pokerRoomService,
} from "@/features/planning-poker/services/poker-room.server";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request, code: string) {
  const token = getRequestToken(request);
  // poll ทุก 1.5s — จำกัดต่อ token (คนละคนใน IP เดียวกันไม่แชร์ quota)
  const limited = checkRateLimit(request, "poll", token ?? "anon");
  if (!limited.ok) {
    return Response.json({ error: limited.error }, { status: limited.status, headers: NO_STORE });
  }

  const result = pokerRoomService.getState(code.toUpperCase(), token);
  if (!result.ok) {
    return Response.json(
      { error: result.error },
      { status: result.status, headers: NO_STORE },
    );
  }
  return Response.json(result.value, { headers: NO_STORE });
}

export async function POST(request: Request, code: string) {
  const body = await request.json().catch(() => null);
  const parsed = roomActionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const action = parsed.data;
  const roomCode = code.toUpperCase();

  const limited = checkRateLimit(
    request,
    action.type === "join" ? "join" : "mutate",
  );
  if (!limited.ok) {
    return Response.json({ error: limited.error }, { status: limited.status });
  }

  if (action.type === "join") {
    const joined = pokerRoomService.join(roomCode, {
      name: action.name,
      role: action.role,
    });
    if (!joined.ok) {
      return Response.json({ error: joined.error }, { status: joined.status });
    }
    return Response.json(joined.value, { status: 201, headers: NO_STORE });
  }

  const result = pokerRoomService.act(
    roomCode,
    getRequestToken(request),
    action,
  );
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result.value, { headers: NO_STORE });
}

export const Route = createFileRoute("/api/poker/rooms/$code")({
  server: {
    handlers: {
      GET: ({ request, params }) => GET(request, params.code),
      POST: ({ request, params }) => POST(request, params.code),
    },
  },
});

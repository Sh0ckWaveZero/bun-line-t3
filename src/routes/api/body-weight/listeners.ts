/**
 * Scale Listeners API — เลือกเครื่องที่รับสัญญาณตาชั่งจากหน้า /body-weight
 * GET /api/body-weight/listeners → เครื่องที่ใช้อยู่ + listener ที่เคย check-in
 * PUT /api/body-weight/listeners { active: "all" | "off" | <ชื่อ listener> }
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth/auth";
import {
  getListenerOverview,
  setActiveListener,
} from "@/features/body-weight/services/scale-listeners.server";
import {
  LISTENER_MODE,
  LISTENER_NAME_PATTERN,
} from "@/features/body-weight/types";

const updateSchema = z.object({
  active: z.union([
    z.literal(LISTENER_MODE.all),
    z.literal(LISTENER_MODE.off),
    z.string().regex(LISTENER_NAME_PATTERN, "ชื่อ listener ไม่ถูกต้อง"),
  ]),
});

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }
    return Response.json(
      { success: true, data: await getListenerOverview() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "[GET /api/body-weight/listeners]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { error: "ไม่สามารถดึงสถานะเครื่องรับสัญญาณได้" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }
    const input = updateSchema.parse(await request.json());
    await setActiveListener(input.active);
    return Response.json(
      { success: true, data: await getListenerOverview() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.issues },
        { status: 400 },
      );
    }
    console.error(
      "[PUT /api/body-weight/listeners]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { error: "ไม่สามารถเปลี่ยนเครื่องรับสัญญาณได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/body-weight/listeners")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      PUT: ({ request }) => PUT(request),
    },
  },
});

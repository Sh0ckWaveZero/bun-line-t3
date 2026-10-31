/**
 * Individual Measurement API
 * PATCH /api/body-weight/measurements/:id  → เปลี่ยนเจ้าของการชั่ง (คำนวณ metrics ใหม่)
 * DELETE /api/body-weight/measurements/:id → ลบการชั่ง
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth/auth";
import {
  deleteMeasurement,
  updateMeasurementProfile,
} from "@/features/body-weight/services/body-weight.server";

const updateMeasurementSchema = z.object({
  profileId: z.string().min(1).nullable(),
});

export async function PATCH(request: Request, measurementId: string) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const input = updateMeasurementSchema.parse(await request.json());
    const result = await updateMeasurementProfile(
      { userId: session.user.id, isAdmin: session.isAdmin },
      measurementId,
      input.profileId,
    );
    if (result.status === "measurement_not_found") {
      return Response.json({ error: "ไม่พบการชั่งนี้" }, { status: 404 });
    }
    if (result.status === "profile_not_found") {
      return Response.json({ error: "ไม่พบโปรไฟล์ที่เลือก" }, { status: 400 });
    }

    return Response.json(
      {
        success: true,
        data: result.measurement,
        message: "เปลี่ยนเจ้าของการชั่งสำเร็จ",
      },
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
      "[PATCH /api/body-weight/measurements/:id]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { error: "ไม่สามารถเปลี่ยนเจ้าของการชั่งได้" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, measurementId: string) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const isDeleted = await deleteMeasurement(
      { userId: session.user.id, isAdmin: session.isAdmin },
      measurementId,
    );
    if (!isDeleted) {
      return Response.json({ error: "ไม่พบการชั่งนี้" }, { status: 404 });
    }

    return Response.json({ success: true, message: "ลบการชั่งสำเร็จ" });
  } catch (error) {
    console.error(
      "[DELETE /api/body-weight/measurements/:id]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถลบการชั่งได้" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/body-weight/measurements/$id")({
  server: {
    handlers: {
      PATCH: ({ request, params }) => PATCH(request, params.id),
      DELETE: ({ request, params }) => DELETE(request, params.id),
    },
  },
});

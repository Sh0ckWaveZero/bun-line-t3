import { createFileRoute } from "@tanstack/react-router";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { authorizeAdminResourceRequest } from "@/lib/auth/admin-resource.server";
import { cronJobPatchSchema } from "@/features/cron-jobs/lib/validation";
import {
  deleteCronJob,
  updateCronJob,
} from "@/features/cron-jobs/services/cron-jobs.server";

export async function PATCH(request: Request, jobId: string) {
  const accessDenied = await authorizeAdminResourceRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const input = cronJobPatchSchema.parse(
      await request.json().catch(() => null),
    );
    const job = await updateCronJob(jobId, input);

    if (!job) {
      return Response.json(
        { success: false, message: "ไม่พบ Cron Job นี้" },
        { status: 404 },
      );
    }

    return Response.json(
      { success: true, data: { job } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          message: "ข้อมูล Cron Job ไม่ถูกต้อง",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { success: false, message: "key ของ Cron Job นี้มีอยู่แล้ว" },
        { status: 409 },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json(
        { success: false, message: "ไม่พบ Cron Job นี้" },
        { status: 404 },
      );
    }

    console.error(`[PATCH /api/admin/cron-jobs/${jobId}]`, error);
    return Response.json(
      { success: false, message: "ไม่สามารถแก้ไข Cron Job ได้" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, jobId: string) {
  const accessDenied = await authorizeAdminResourceRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const deleted = await deleteCronJob(jobId);
    if (!deleted) {
      return Response.json(
        { success: false, message: "ไม่พบ Cron Job นี้" },
        { status: 404 },
      );
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`[DELETE /api/admin/cron-jobs/${jobId}]`, error);
    return Response.json(
      { success: false, message: "ไม่สามารถลบ Cron Job ได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/admin/cron-jobs/$jobId")({
  server: {
    handlers: {
      PATCH: ({ request, params }) => PATCH(request, params.jobId),
      DELETE: ({ request, params }) => DELETE(request, params.jobId),
    },
  },
});

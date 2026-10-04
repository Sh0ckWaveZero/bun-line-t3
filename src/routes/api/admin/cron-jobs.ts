import { createFileRoute } from "@tanstack/react-router";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { authorizeAdminResourceRequest } from "@/lib/auth/admin-resource.server";
import { cronJobInputSchema } from "@/features/cron-jobs/lib/validation";
import {
  createCronJob,
  getCronJobsSnapshot,
} from "@/features/cron-jobs/services/cron-jobs.server";

export async function GET(request: Request) {
  const accessDenied = await authorizeAdminResourceRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const snapshot = await getCronJobsSnapshot();
    return Response.json(
      { success: true, data: snapshot },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Cron-Scheduler": snapshot.source.scheduler,
        },
      },
    );
  } catch (error) {
    console.error("[GET /api/admin/cron-jobs]", error);
    return Response.json(
      { success: false, message: "ไม่สามารถอ่านสถานะ Cron Jobs ได้" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  const accessDenied = await authorizeAdminResourceRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const input = cronJobInputSchema.parse(
      await request.json().catch(() => null),
    );
    const job = await createCronJob(input);

    return Response.json(
      { success: true, data: { job } },
      { status: 201, headers: { "Cache-Control": "no-store" } },
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

    console.error("[POST /api/admin/cron-jobs]", error);
    return Response.json(
      { success: false, message: "ไม่สามารถสร้าง Cron Job ได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/admin/cron-jobs")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});

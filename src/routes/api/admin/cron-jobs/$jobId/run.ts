import { createFileRoute } from "@tanstack/react-router";
import { authorizeAdminResourceRequest } from "@/lib/auth/admin-resource.server";
import { runCronJob } from "@/features/cron-jobs/services/cron-jobs.server";

export async function POST(request: Request, jobId: string) {
  const accessDenied = await authorizeAdminResourceRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const result = await runCronJob(jobId, request.url, "manual");
    if (!result) {
      return Response.json(
        { success: false, message: "ไม่พบ Cron Job นี้" },
        { status: 404 },
      );
    }

    return Response.json(
      { success: true, data: { result } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "CRON_SECRET is not configured"
    ) {
      return Response.json(
        { success: false, message: "ยังไม่ได้ตั้งค่า CRON_SECRET" },
        { status: 503 },
      );
    }

    console.error(`[POST /api/admin/cron-jobs/${jobId}/run]`, error);
    return Response.json(
      { success: false, message: "ไม่สามารถรัน Cron Job ได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/admin/cron-jobs/$jobId/run")({
  server: {
    handlers: {
      POST: ({ request, params }) => POST(request, params.jobId),
    },
  },
});

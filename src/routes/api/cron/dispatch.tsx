import { createFileRoute } from "@tanstack/react-router";
import { dispatchDueCronJobs } from "@/features/cron-jobs/services/cron-jobs.server";
import { validateCronAuth } from "@/lib/utils/cron-auth";

export async function POST(request: Request) {
  const authResult = validateCronAuth(request);
  if (!authResult.success) {
    return Response.json(
      { success: false, message: authResult.error ?? "ไม่ได้รับอนุญาต" },
      { status: authResult.status ?? 401 },
    );
  }

  try {
    const summary = await dispatchDueCronJobs(request.url);
    return Response.json(
      { success: true, data: summary },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[POST /api/cron/dispatch]", error);
    return Response.json(
      { success: false, message: "ไม่สามารถ dispatch Cron Jobs ได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/cron/dispatch")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});

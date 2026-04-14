/**
 * Health Activity Summary API Endpoint
 * Provides activity summaries for different time periods
 */
import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib/auth/auth";
import { healthActivityService } from "@/features/health-activity/services/health-activity.service.server";

/**
 * GET - Get activity summary
 * Query params: period (daily|weekly|monthly), date (optional)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") as
      | "daily"
      | "weekly"
      | "monthly"
      | null;
    const dateParam = searchParams.get("date");

    if (!period || !["daily", "weekly", "monthly"].includes(period)) {
      return Response.json(
        { error: "Invalid period. Must be: daily, weekly, or monthly" },
        { status: 400 },
      );
    }

    const date = dateParam ? new Date(dateParam) : new Date();

    const summary = await healthActivityService.getActivitySummary(
      session.user.id,
      period,
      date,
    );

    return Response.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching activity summary:", error);
    return Response.json(
      { error: "Failed to fetch activity summary" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/health-activity/summary")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});

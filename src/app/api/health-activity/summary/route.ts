/**
 * Health Activity Summary API Endpoint
 * Provides activity summaries for different time periods
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { healthActivityService } from "@/features/health-activity/services/health-activity.service";

/**
 * GET - Get activity summary
 * Query params: period (daily|weekly|monthly), date (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") as
      | "daily"
      | "weekly"
      | "monthly"
      | null;
    const dateParam = searchParams.get("date");

    if (!period || !["daily", "weekly", "monthly"].includes(period)) {
      return NextResponse.json(
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

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching activity summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity summary" },
      { status: 500 },
    );
  }
}

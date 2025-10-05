/**
 * Health Activity API Endpoint
 * Handles CRUD operations for health activities
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { healthActivityService } from "@/features/health-activity/services/health-activity.service";
import { z } from "zod";
import type { ActivityType } from "@prisma/client";

const createActivitySchema = z.object({
  activityType: z.enum([
    "WALKING",
    "RUNNING",
    "CYCLING",
    "SWIMMING",
    "WORKOUT",
    "YOGA",
    "OTHER",
  ]),
  date: z.string().transform((val) => new Date(val)),
  duration: z.number().min(1),
  distance: z.number().optional(),
  calories: z.number().optional(),
  steps: z.number().optional(),
  heartRate: z
    .object({
      average: z.number().optional(),
      max: z.number().optional(),
      min: z.number().optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * GET - Get user's activities
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const activityType = searchParams.get(
      "activityType",
    ) as ActivityType | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const activities = await healthActivityService.getActivities({
      userId: session.user.id,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      activityType: activityType || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: activities,
      count: activities.length,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 },
    );
  }
}

/**
 * POST - Create new activity
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createActivitySchema.parse(body);

    const activity = await healthActivityService.createActivity({
      userId: session.user.id,
      ...validatedData,
    });

    return NextResponse.json(
      {
        success: true,
        data: activity,
        message: "Activity created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating activity:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Delete an activity
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("id");

    if (!activityId) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 },
      );
    }

    const success = await healthActivityService.deleteActivity(
      activityId,
      session.user.id,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete activity" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 },
    );
  }
}

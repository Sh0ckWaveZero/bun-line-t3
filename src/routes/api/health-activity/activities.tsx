/**
 * Health Activity API Endpoint
 * Handles CRUD operations for health activities
 */
import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib/auth/auth";
import { healthActivityService } from "@/features/health-activity/services/health-activity.service.server";
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
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET - Get user's activities
 */
export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
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

    return Response.json({
      success: true,
      data: activities,
      count: activities.length,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return Response.json(
      { error: "Failed to fetch activities" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/health-activity/activities")({
  server: {
    handlers: {
      DELETE: ({ request }) => DELETE(request),
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});

/**
 * POST - Create new activity
 */
export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession(request);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createActivitySchema.parse(body);

    const activity = await healthActivityService.createActivity({
      userId: session.user.id,
      ...validatedData,
    });

    return Response.json(
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
      return Response.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 },
      );
    }

    return Response.json(
      { error: "Failed to create activity" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Delete an activity
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerAuthSession(request);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("id");

    if (!activityId) {
      return Response.json(
        { error: "Activity ID is required" },
        { status: 400 },
      );
    }

    const success = await healthActivityService.deleteActivity(
      activityId,
      session.user.id,
    );

    if (!success) {
      return Response.json(
        { error: "Failed to delete activity" },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return Response.json(
      { error: "Failed to delete activity" },
      { status: 500 },
    );
  }
}

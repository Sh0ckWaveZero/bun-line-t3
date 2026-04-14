/**
 * Health Metrics API Endpoint
 * Handles health metrics like weight, BMI, blood pressure, etc.
 */
import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib/auth/auth";
import { healthActivityService } from "@/features/health-activity/services/health-activity.service.server";
import { z } from "zod";

const healthMetricsSchema = z.object({
  date: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  bmi: z.number().optional(),
  bodyFat: z.number().optional(),
  bloodPressure: z
    .object({
      systolic: z.number(),
      diastolic: z.number(),
    })
    .optional(),
  restingHeartRate: z.number().optional(),
  sleepHours: z.number().optional(),
  waterIntake: z.number().optional(),
});

/**
 * GET - Get health metrics
 */
export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : undefined;

    const metrics = await healthActivityService.getHealthMetrics(
      session.user.id,
      date,
    );

    return Response.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching health metrics:", error);
    return Response.json(
      { error: "Failed to fetch health metrics" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/health-activity/metrics")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});

/**
 * POST - Save health metrics
 */
export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession(request);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = healthMetricsSchema.parse(body);

    const metrics = await healthActivityService.saveHealthMetrics({
      userId: session.user.id,
      ...validatedData,
    });

    return Response.json(
      {
        success: true,
        data: metrics,
        message: "Health metrics saved successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error saving health metrics:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 },
      );
    }

    return Response.json(
      { error: "Failed to save health metrics" },
      { status: 500 },
    );
  }
}

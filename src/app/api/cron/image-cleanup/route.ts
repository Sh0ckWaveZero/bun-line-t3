import { NextRequest } from "next/server";
import { validateCronAuth } from "@/lib/utils/cron-auth";
import { createErrorResponse } from "@/lib/utils/cron-response";
import { cleanupTemporaryImages } from "@/lib/utils/image-cleanup";

export async function POST(req: NextRequest) {
  // Authentication
  const authResult = validateCronAuth(req);
  if (!authResult.success) {
    return createErrorResponse(authResult.error!, authResult.status!);
  }

  try {
    // Default cleanup images older than 2 hours
    await cleanupTemporaryImages(120);

    return Response.json({
      success: true,
      message: "Image cleanup completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Error in image cleanup cron:", error);
    return createErrorResponse("Image cleanup failed", 500, error.message);
  }
}

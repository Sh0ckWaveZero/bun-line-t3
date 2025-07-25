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
    const stats = await cleanupTemporaryImages(120);

    console.log("📊 Image cleanup statistics:", stats);

    return Response.json({
      success: true,
      message: "Image cleanup completed successfully",
      timestamp: new Date().toISOString(),
      statistics: {
        filesProcessed: stats.totalFiles,
        filesDeleted: stats.cleaned,
        errors: stats.errors,
        maxAgeMinutes: 120,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in image cleanup cron:", error);
    return createErrorResponse("Image cleanup failed", 500, error.message);
  }
}

import {
  checkContentSafety,
  generateSafetyResponse,
  logAbuseReport,
} from "@/lib/ai/content-safety";
import { chat } from "@/lib/ai/openai-client";

const { sendMessage, sendLoadingAnimation } =
  await import("@/lib/utils/line-utils");

/**
 * Handle a single chat message without stored conversation history.
 */
export async function handleChatMode(
  req: any,
  userId: string,
  message: string,
) {
  try {
    // 🔄 Send loading animation to user immediately
    await sendLoadingAnimation(req, 15); // 15 seconds for chat response

    // ✅ Safety check: Detect abuse/inappropriate content
    const safetyCheck = checkContentSafety(message);

    if (!safetyCheck.isSafe) {
      // Log abuse report for moderation
      await logAbuseReport({
        userId,
        text: safetyCheck.originalText,
        category: safetyCheck.category,
        severity: safetyCheck.severity,
        triggeredPatterns: safetyCheck.triggeredPatterns,
        timestamp: new Date(),
      });

      // Generate dynamic response using AI
      const aiResponse = await generateSafetyResponse(safetyCheck);

      // Send safe response to user
      await sendMessage(req, [
        {
          type: "text",
          text: aiResponse,
        },
      ]);
      return;
    }

    const response = await chat({
      message,
    });

    await sendMessage(req, [
      {
        type: "text",
        text: `💬 ${response.text}`,
      },
    ]);
  } catch (error) {
    console.error("❌ Error in chat mode:", error);
    throw error;
  }
}

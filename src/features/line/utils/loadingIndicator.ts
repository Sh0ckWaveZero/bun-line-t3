import { env } from "@/env.mjs";

/**
 * LINE Loading Indicator Utility
 * Shows loading animation in LINE chat while processing commands
 *
 * Sends immediately to provide instant visual feedback to user
 * without waiting for actual command processing
 */

interface LineLoadingRequest {
  userId: string;
  chatId?: string;
}

/**
 * Send loading indicator to LINE chat
 * Called immediately when command is received - no waiting!
 * @param userId - LINE user ID from webhook event (can be user/group/room ID)
 * @returns Promise<boolean> - true if sent successfully
 */
export async function sendLoadingIndicator(
  userId: string,
): Promise<boolean> {
  try {
    console.log(`⏳ Sending loading indicator to: ${userId}`);

    const response = await fetch(env.LINE_MESSAGING_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: "text",
            text: "⏳ กำลังประมวลผล...",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Failed to send loading indicator:", {
        userId,
        status: response.status,
        error: errorData,
      });
      return false;
    }

    console.log(`✅ Loading indicator sent to ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending loading indicator to ${userId}:`, error);
    return false;
  }
}

/**
 * Send loading state to LINE (alternative: using rich menu or status message)
 * This is a more elegant approach if LINE supports it
 * @param userId - LINE user ID
 */
export async function sendLoadingState(userId: string): Promise<boolean> {
  try {
    // Alternative: Send a simpler loading message
    const response = await fetch(env.LINE_MESSAGING_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: "text",
            text: "⌛ กำลังประมวลผลคำสั่งของคุณ...",
          },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error in sendLoadingState:", error);
    return false;
  }
}

/**
 * Create a loading indicator action for rich menu or buttons
 */
export const loadingIndicatorAction = {
  type: "message",
  label: "กำลังโหลด...",
  text: "processing",
};

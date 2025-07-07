import { env } from "@/env.mjs";

/**
 * Sends push message to LINE user
 * @param userId LINE user ID
 * @param messages Array of LINE message objects
 * @returns Promise<Response>
 */
export async function sendPushMessage(userId: string, messages: any[]): Promise<Response> {
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };

  try {
    const response = await fetch(`${env.LINE_MESSAGING_API}/push`, {
      method: "POST",
      headers: lineHeader,
      body: JSON.stringify({
        to: userId,
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send push message");
    }

    return response;
  } catch (err: any) {
    console.error("Error sending push message:", err.message);
    throw err;
  }
}

/**
 * Creates flex message carousel
 * @param bubbleItems Array of bubble items
 * @returns Array with flex carousel message
 */
export function createFlexCarousel(bubbleItems: any[]) {
  return [
    {
      type: "flex",
      altText: "Work Attendance System",
      contents: {
        type: "carousel",
        contents: bubbleItems,
      },
    },
  ];
}
// src/lib/utils/line-push.ts
// 🛡️ Utility สำหรับส่ง push message ไปยัง LINE user โดยตรง
import { env } from "@/env.mjs";

/**
 * ส่ง push message ไปยัง LINE userId
 * @param userId LINE userId (accountId)
 * @param messages ข้อมูล message (array)
 * @returns Promise<Response>
 */
export const sendPushMessage = async (userId: string, messages: any[]) => {
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
      const errorBody = await response.text();
      console.error(
        `LINE Push Message Error: ${response.status} - ${errorBody}`,
      );
      throw new Error(
        `Failed to send push message: ${response.status} - ${errorBody}`,
      );
    }

    return response;
  } catch (err: any) {
    console.error("Error sending push message:", err.message);
    throw err;
  }
};

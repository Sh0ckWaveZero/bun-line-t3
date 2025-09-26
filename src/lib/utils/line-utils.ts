// src/features/line/services/line-utils.ts
// 🛡️ Utility สำหรับส่งข้อความ LINE (sendMessage, sendRequest, sendLoadingAnimation)
import { env } from "@/env.mjs";

export const sendRequest = async (
  url: string,
  method: string,
  headers: any,
  body: any,
) => {
  try {
    console.log("🔗 Sending request to:", url);
    console.log(
      "📦 Request body size:",
      JSON.stringify(body).length,
      "characters",
    );
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });
    console.log("📊 Response status:", response.status, response.statusText);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Response error:", errorText);
      throw new Error(
        `Failed to send request: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }
    return response;
  } catch (err: any) {
    console.error("💥 sendRequest error:", err.message);
    throw err;
  }
};

export const sendLoadingAnimation = async (req: any) => {
  try {
    // Check if userId exists
    const userId = req.body?.events?.[0]?.source?.userId;
    if (!userId) {
      console.warn("⚠️ No valid userId found for loading animation");
      return; // Skip loading animation if no userId
    }

    const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
    const lineHeader = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lineChannelAccessToken}`,
    };
    return sendRequest(
      "https://api.line.me/v2/bot/chat/loading/start",
      "POST",
      lineHeader,
      {
        chatId: userId,
        loadingSeconds: 5,
      },
    );
  } catch (error: any) {
    console.warn("⚠️ Failed to send loading animation:", error.message);
    // Don't throw error, just skip loading animation
    return;
  }
};

export const sendMessage = async (req: any, payload: any) => {
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };
  try {
    // Check if replyToken exists and is valid
    const replyToken = req.body?.events?.[0]?.replyToken;
    const userId = req.body?.events?.[0]?.source?.userId;

    if (!replyToken) {
      console.warn(
        "⚠️ No valid replyToken found, falling back to push message",
      );
      return sendPushMessage(req, payload);
    }

    // Only send loading animation if we have userId
    if (userId) {
      try {
        await sendLoadingAnimation(req);
      } catch (loadingErr: any) {
        console.warn(
          "⚠️ Loading animation failed, continuing with message:",
          loadingErr.message,
        );
        // Continue without loading animation
      }
    }

    return sendRequest(`${env.LINE_MESSAGING_API}/reply`, "POST", lineHeader, {
      replyToken: replyToken,
      messages: payload,
    });
  } catch (err: any) {
    console.error("❌ sendMessage error:", err.message);
    // Fallback to push message if reply fails
    try {
      console.log("🔄 Falling back to push message");
      return sendPushMessage(req, payload);
    } catch (pushErr: any) {
      console.error("❌ Push message also failed:", pushErr.message);
      throw pushErr;
    }
  }
};

export const sendPushMessage = async (req: any, payload: any) => {
  console.log("📤 Sending push message");
  console.dir(payload, { depth: null });
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };
  try {
    return sendRequest(`${env.LINE_MESSAGING_API}/push`, "POST", lineHeader, {
      to: req.body.events[0].source.userId,
      messages: payload,
    });
  } catch (err: any) {
    console.error("❌ Push message error:", err.message);
    throw err;
  }
};

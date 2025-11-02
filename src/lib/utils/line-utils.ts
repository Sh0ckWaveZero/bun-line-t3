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

      // Parse error details if available
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.details) {
          console.error(
            "❌ Error details:",
            JSON.stringify(errorJson.details, null, 2),
          );
        }
      } catch {
        // Error text is not JSON, ignore
      }

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

export const sendLoadingAnimation = async (
  req: any,
  loadingSeconds: number = 5,
) => {
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

    // Try LINE Chat Loading API first (newer API)
    try {
      const loadingResponse = await fetch(
        "https://api.line.me/v2/bot/chat/loading/start",
        {
          method: "POST",
          headers: lineHeader,
          body: JSON.stringify({
            chatId: userId,
            loadingSeconds: Math.min(loadingSeconds, 60), // Max 60 seconds
          }),
        },
      );

      if (loadingResponse.ok) {
        console.log("⏳ Loading animation started (Chat Loading API)");
        return loadingResponse;
      }

      // If Chat Loading API fails, fall back to sending a message
      console.log("ℹ️ Chat Loading API not available, using message fallback");
    } catch (apiError) {
      console.log("ℹ️ Chat Loading API failed, using message fallback");
    }

    // Fallback: Send a simple loading message
    const messageResponse = await fetch(env.LINE_MESSAGING_API, {
      method: "POST",
      headers: lineHeader,
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

    if (messageResponse.ok) {
      console.log("⏳ Loading message sent successfully");
      return messageResponse;
    }

    const errorText = await messageResponse.text();
    console.warn("⚠️ Loading message failed:", errorText);
    return;
  } catch (error: any) {
    console.warn("⚠️ Failed to send loading indicator:", error.message);
    // Don't throw error, just skip loading animation
    return;
  }
};

export const sendMessage = async (
  req: any,
  payload: any,
  options?: { showLoading?: boolean },
) => {
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

    // Optionally send loading animation BEFORE reply
    // WARNING: This consumes time and may cause reply token to expire
    if (options?.showLoading && userId) {
      try {
        await sendLoadingAnimation(req, 5);
      } catch (err: any) {
        console.warn("⚠️ Loading animation failed:", err?.message || err);
      }
    }

    // Send reply
    const response = await sendRequest(
      `${env.LINE_MESSAGING_API}/reply`,
      "POST",
      lineHeader,
      {
        replyToken: replyToken,
        messages: payload,
      },
    );

    console.log("✅ Reply message sent successfully");
    return response;
  } catch (err: any) {
    console.error("❌ sendMessage error:", err.message);

    // Always try to fallback to push message on any reply error
    console.log("🔄 Reply failed, attempting push message fallback");
    try {
      return await sendPushMessage(req, payload);
    } catch (pushErr: any) {
      console.error("❌ Push message also failed:", pushErr.message);
      // Don't throw error, just log it to prevent webhook from failing
      console.error("❌ Both reply and push message failed, giving up");
      return null;
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

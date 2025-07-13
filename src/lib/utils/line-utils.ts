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
    console.log("📦 Request body size:", JSON.stringify(body).length, "characters");
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });
    console.log("📊 Response status:", response.status, response.statusText);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Response error:", errorText);
      throw new Error(`Failed to send request: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return response;
  } catch (err: any) {
    console.error("💥 sendRequest error:", err.message);
    throw err;
  }
};

export const sendLoadingAnimation = async (req: any) => {
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
      chatId: req.body.events[0].source.userId,
      loadingSeconds: 5,
    },
  );
};

export const sendMessage = async (req: any, payload: any) => {
  console.dir(payload, { depth: null });
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };
  try {
    await sendLoadingAnimation(req);
    return sendRequest(`${env.LINE_MESSAGING_API}/reply`, "POST", lineHeader, {
      replyToken: req.body.events[0].replyToken,
      messages: payload,
    });
  } catch (err: any) {
    console.error(err.message);
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

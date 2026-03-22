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
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Failed to send request: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }
    return response;
  } catch (err: any) {
    throw err;
  }
};

export const sendLoadingAnimation = async (
  req: any,
  loadingSeconds: number = 5,
) => {
  try {
    const userId = req.body?.events?.[0]?.source?.userId;
    if (!userId) {
      return;
    }

    const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
    const lineHeader = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lineChannelAccessToken}`,
    };

    try {
      const loadingResponse = await fetch(
        "https://api.line.me/v2/bot/chat/loading/start",
        {
          method: "POST",
          headers: lineHeader,
          body: JSON.stringify({
            chatId: userId,
            loadingSeconds: Math.min(loadingSeconds, 60),
          }),
        },
      );

      if (loadingResponse.ok) {
        return loadingResponse;
      }
    } catch {
      // Fallback to message
    }

    await fetch(env.LINE_MESSAGING_API, {
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

    return;
  } catch {
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
    const replyToken = req.body?.events?.[0]?.replyToken;
    const userId = req.body?.events?.[0]?.source?.userId;

    if (!replyToken) {
      return sendPushMessage(req, payload);
    }

    if (options?.showLoading && userId) {
      try {
        await sendLoadingAnimation(req, 5);
      } catch {
        // Skip loading animation
      }
    }

    const response = await sendRequest(
      `${env.LINE_MESSAGING_API}/reply`,
      "POST",
      lineHeader,
      {
        replyToken: replyToken,
        messages: payload,
      },
    );

    return response;
  } catch {
    try {
      return await sendPushMessage(req, payload);
    } catch {
      return null;
    }
  }
};

export const sendPushMessage = async (req: any, payload: any) => {
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
    throw err;
  }
};

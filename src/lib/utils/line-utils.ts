// src/features/line/services/line-utils.ts
// 🛡️ Utility สำหรับส่งข้อความ LINE (sendMessage, sendRequest, sendLoadingAnimation)
import { env } from "@/env.mjs";

export const sendRequest = async (
  url: string,
  method: string,
  headers: any,
  body: any,
) => {
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
};

export const sendLoadingAnimation = async (
  req: any,
  loadingSeconds: number = 5,
) => {
  try {
    // ป้องกันการยิง loading ซ้ำใน request เดียวกัน
    if (req.__lineLoadingAnimationShown) {
      return;
    }

    const source = req.body?.events?.[0]?.source;
    const userId = source?.userId;
    const sourceType = source?.type;

    // ต้องมี userId สำหรับแสดง loading animation
    if (!userId) {
      console.warn("[sendLoadingAnimation] ไม่มี userId - ข้ามการแสดง loading");
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
            chatId: userId, // chatId รองรับทั้ง userId, groupId, และ roomId
            loadingSeconds: Math.min(loadingSeconds, 60),
          }),
        },
      );

      if (loadingResponse.ok) {
        req.__lineLoadingAnimationShown = true;
        console.info(`[sendLoadingAnimation] แสดง loading ที่ ${sourceType || "user"}: ${userId}`);
        return loadingResponse;
      }
    } catch {
      // Fallback to message
    }

    // Fallback: ส่งข้อความแทน
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

    req.__lineLoadingAnimationShown = true;
    return;
  } catch (error) {
    console.error("[sendLoadingAnimation] ล้มเหลว:", error);
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
    const source = req.body?.events?.[0]?.source;
    const userId = source?.userId;
    const sourceType = source?.type; // "user", "group", หรือ "room"

    // ✅ ใช้ replyToken สำหรับตอบกลับ (รองรับทั้ง 1:1, group, และ room)
    if (replyToken) {
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

      console.info(`[sendMessage] ส่ง reply ไปยัง ${sourceType || "user"}: ${userId || "unknown"}`);
      return response;
    }

    // ถ้าไม่มี replyToken ให้ fallback ไปใช้ push
    console.warn("[sendMessage] ไม่มี replyToken - ใช้ push แทน");
    return sendPushMessage(req, payload);
  } catch (error) {
    console.error("LINE reply failed, falling back to push:", error);
    try {
      return await sendPushMessage(req, payload);
    } catch (pushError) {
      console.error("LINE push fallback failed:", pushError);
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

  const source = req.body.events[0].source;
  const userId = source?.userId;
  const sourceType = source?.type; // "user", "group", หรือ "room"

  // ต้องมี userId สำหรับการส่ง push message
  if (!userId) {
    console.error("[sendPushMessage] Event ไม่มี userId:", {
      sourceType,
      source,
    });
    throw new Error("Cannot send push message: missing userId");
  }

  console.info(`[sendPushMessage] ส่ง push ไปยัง ${sourceType || "user"}: ${userId}`);

  return sendRequest(`${env.LINE_MESSAGING_API}/push`, "POST", lineHeader, {
    to: userId,
    messages: payload,
  });
};

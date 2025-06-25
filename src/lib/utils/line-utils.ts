// src/features/line/services/line-utils.ts
// 🛡️ Utility สำหรับส่งข้อความ LINE (sendMessage, sendRequest, sendLoadingAnimation)
import { env } from '@/env.mjs';

export const sendRequest = async (url: string, method: string, headers: any, body: any) => {
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error('Failed to send request');
    }
    return response;
  } catch (err: any) {
    console.error(err.message);
  }
};

export const sendLoadingAnimation = async (req: any) => {
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };
  return sendRequest('https://api.line.me/v2/bot/chat/loading/start', 'POST', lineHeader, {
    chatId: req.body.events[0].source.userId,
    loadingSeconds: 5
  });
};

export const sendMessage = async (req: any, payload: any) => {
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };
  try {
    await sendLoadingAnimation(req);
    return sendRequest(`${env.LINE_MESSAGING_API}/reply`, 'POST', lineHeader, {
      replyToken: req.body.events[0].replyToken,
      messages: payload,
    });
  } catch (err: any) {
    console.error(err.message);
  }
};

// src/lib/utils/line-message-utils.ts
// 🛡️ Utility สำหรับ LINE Flex Message และการตอบกลับ
import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "./line-utils";
import { utils } from "../validation";

export const flexMessage = (bubbleItems: any[]) => [
  {
    type: "flex",
    altText: "CryptoInfo",
    contents: {
      type: "carousel",
      contents: bubbleItems,
    },
  },
];

export const replyNotFound = (req: any) => {
  const payload = flexMessage(bubbleTemplate.notFound());
  sendMessage(req, payload);
};

export const replyRaw = async (
  req: any,
  infoItems: any[],
  options?: string,
) => {
  const bubbleItems: any[] = [];
  for (const index in infoItems) {
    switch (options) {
      case "gold":
        bubbleItems.push(bubbleTemplate.gold(infoItems[index]));
        break;
      case "lotto":
        const bubble = bubbleTemplate.lottery(infoItems[0]);
        bubble.forEach((b: any) => bubbleItems.push(b));
        break;
      default:
        bubbleItems.push(bubbleTemplate.cryptoCurrency(infoItems[index]));
        break;
    }
  }
  Promise.all(bubbleItems)
    .then(async (items) => {
      console.log("🚀 ~ .then ~ items:", items);
      const payload = flexMessage(items);
      await sendMessage(req, payload);
    })
    .catch((err) => {
      console.error("error: ", err.message);
    });
};

export const getFlexMessage = async (
  req: any,
  data: any[],
  options?: string,
) => {
  try {
    const items = await Promise.all(data);
    if (utils.isEmpty(items[0])) {
      replyNotFound(req);
      return;
    }
    replyRaw(req, items, options);
  } catch (err: any) {
    console.error(err?.message);
  }
};

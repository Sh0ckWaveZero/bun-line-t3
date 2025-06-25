import { sendMessage } from "../../../lib/utils/line-utils";
import { replyNotFound } from "@/lib/utils/line-message-utils";
import { env } from "@/env.mjs";

export const handleHelpCommand = async (req: any) => {
  try {
    const helpText = {
      type: "text",
      text: "📝 ดูคำสั่งทั้งหมดและวิธีใช้งานได้ที่:",
    };
    const buttonTemplate = {
      type: "template",
      altText: "คำสั่งทั้งหมดและวิธีใช้งาน",
      template: {
        type: "buttons",
        text: "คลิกที่ปุ่มด้านล่างเพื่อดูคำสั่งทั้งหมดและคำอธิบายโดยละเอียด",
        actions: [
          {
            type: "uri",
            label: "ดูรายการคำสั่งทั้งหมด",
            uri: `${env.FRONTEND_URL}/help`,
          },
        ],
      },
    };
    sendMessage(req, [helpText, buttonTemplate]);
  } catch (error) {
    console.error("Error handling help command:", error);
    replyNotFound(req);
  }
};

import { sendMessage } from "../../../lib/utils/line-utils";
import { replyNotFound } from "@/lib/utils/line-message-utils";
import { env } from "@/env.mjs";

export const handleHelpCommand = async (req: any) => {
  try {
    const helpText = {
      type: "text",
      text: [
        "📋 คำสั่งที่ใช้บ่อย",
        "─────────────────────",
        "💰 รายรับรายจ่าย:",
        "  /จ่าย [จำนวน] [หมวด?]",
        "  /exp 250 อาหาร",
        "  /e 50",
        "  /รับ [จำนวน] [หมวด?]",
        "  /i 30000 เงินเดือน",
        "  /expense — ดูสรุปเดือนนี้",
        "",
        "💼 ลงเวลางาน:",
        "  /checkin  /checkout  /status",
        "",
        "📊 คริปโต:",
        "  /bk /bn /cmc [symbol]",
        "  /chart [symbol]",
        "",
        "📌 /dca — Auto DCA",
        "─────────────────────",
        "📖 ดูคำสั่งทั้งหมดด้านล่าง",
      ].join("\n"),
    };
    const buttonTemplate = {
      type: "template",
      altText: "คำสั่งทั้งหมดและวิธีใช้งาน",
      template: {
        type: "buttons",
        text: "คลิกเพื่อดูคำสั่งทั้งหมดพร้อมตัวอย่าง",
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

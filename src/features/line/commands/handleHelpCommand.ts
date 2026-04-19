import { sendMessage } from "../../../lib/utils/line-utils";
import { flexMessage, replyNotFound } from "@/lib/utils/line-message-utils";
import { env } from "@/env.mjs";

export const handleHelpCommand = async (req: any) => {
  try {
    const section = (emoji: string, title: string, lines: string[]) => ({
      type: "box",
      layout: "vertical",
      spacing: "xs",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          contents: [
            { type: "text", text: emoji, size: "sm", flex: 0 },
            {
              type: "text",
              text: title,
              size: "sm",
              weight: "bold",
              color: "#111827",
              flex: 1,
            },
          ],
        },
        ...lines.map((line) => ({
          type: "text",
          text: line,
          size: "xs",
          color: "#6B7280",
          margin: "xs",
          wrap: true,
        })),
      ],
    });

    const bubble = {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        backgroundColor: "#1E293B",
        contents: [
          {
            type: "text",
            text: "📋 คำสั่งที่ใช้บ่อย",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          section("💰", "รายรับรายจ่าย", [
            "/จ่าย [จำนวน] [หมวด]  หรือ  /exp  /e",
            "/รับ [จำนวน] [หมวด]   หรือ  /i",
            "/expense — ดูสรุปเดือนนี้",
          ]),
          { type: "separator" },
          section("💼", "ลงเวลางาน", [
            "/checkin  /checkout  /status",
          ]),
          { type: "separator" },
          section("📊", "คริปโต", [
            "/bk /bn /cmc [symbol]",
            "/chart [symbol]",
          ]),
          { type: "separator" },
          section("📌", "Auto DCA", ["/dca"]),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "12px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#1E293B",
            action: {
              type: "uri",
              label: "ดูคำสั่งทั้งหมด",
              uri: `${env.FRONTEND_URL}/help`,
            },
          },
        ],
      },
    };

    sendMessage(req, flexMessage([bubble]));
  } catch (error) {
    console.error("Error handling help command:", error);
    replyNotFound(req);
  }
};

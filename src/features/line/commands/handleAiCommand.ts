import { getAIMCPClient } from "@/lib/mcp/client";

const { sendMessage } = await import("@/lib/utils/line-utils");

/**
 * Handle /ai command - AI-powered chat using MCP
 *
 * Supports:
 * - /ai [question] - Ask a single question
 * - /ai chat [message] - Have a conversation (maintains context)
 * - /ai help - Show help message
 *
 * @param req - Request object containing LINE webhook data
 * @param conditions - Command arguments
 */
export async function handleAiCommand(req: any, conditions: string[]) {
  const userId = req.body.events[0].source.userId;

  try {
    // Show help if no arguments
    if (conditions.length === 0) {
      await sendAIHelp(req);
      return;
    }

    const subCommand = conditions[0].toLowerCase();

    // Handle help command
    if (subCommand === "help" || subCommand === "ช่วยเหลือ") {
      await sendAIHelp(req);
      return;
    }

    // Handle chat command (maintains conversation context)
    if (subCommand === "chat" || subCommand === "คุย") {
      if (conditions.length < 2) {
        await sendMessage(req, [
          {
            type: "text",
            text: "กรุณาระบุข้อความ\n\nตัวอย่าง:\n/ai chat สวัสดี\n/ai คุย วันนี้อากาศเป็นอย่างไร",
          },
        ]);
        return;
      }

      const message = conditions.slice(1).join(" ");
      await handleChatMode(req, userId, message);
      return;
    }

    // Default: single question mode
    const question = conditions.join(" ");
    await handleQuestionMode(req, question);
  } catch (error) {
    console.error("❌ Error in handleAiCommand:", error);

    await sendMessage(req, [
      {
        type: "text",
        text:
          "ขอโทษครับ เกิดข้อผิดพลาดในการประมวลผล\n\n" +
          `Error: ${error instanceof Error ? error.message : "Unknown error"}\n\n` +
          "กรุณาลองใหม่อีกครั้ง หรือพิมพ์ /ai help เพื่อดูวิธีใช้งาน",
      },
    ]);
  }
}

/**
 * Handle single question mode (no conversation context)
 */
async function handleQuestionMode(req: any, question: string) {
  try {
    // Send loading message
    await sendMessage(req, [
      {
        type: "text",
        text: "🤖 กำลังประมวลผล...",
      },
    ]);

    const client = getAIMCPClient();
    const response = await client.askAI({
      question,
      model: "gpt-4o",
    });

    await sendMessage(req, [
      {
        type: "text",
        text: `🤖 คำตอบ:\n\n${response.text}`,
      },
    ]);
  } catch (error) {
    console.error("❌ Error in question mode:", error);
    throw error;
  }
}

/**
 * Handle chat mode (maintains conversation context)
 */
async function handleChatMode(req: any, userId: string, message: string) {
  try {
    // Send loading message
    await sendMessage(req, [
      {
        type: "text",
        text: "💬 กำลังคิด...",
      },
    ]);

    const client = getAIMCPClient();
    const response = await client.chat({
      message,
      conversationId: userId, // Use LINE userId as conversation ID
      systemPrompt:
        "คุณเป็นผู้ช่วย AI ที่เป็นมิตรและชาญฉลาด ตอบคำถามเป็นภาษาไทยที่เข้าใจง่าย กระชับ และตรงประเด็น",
    });

    await sendMessage(req, [
      {
        type: "text",
        text: `💬 ${response.text}`,
      },
    ]);
  } catch (error) {
    console.error("❌ Error in chat mode:", error);
    throw error;
  }
}

/**
 * Send AI help message
 */
async function sendAIHelp(req: any) {
  const helpText = `🤖 คำสั่ง AI Assistant

📌 วิธีใช้งาน:

1️⃣ ถามคำถามเดี่ยว:
   /ai [คำถาม]
   ตัวอย่าง: /ai อธิบาย blockchain

2️⃣ สนทนา (จำบริบท):
   /ai chat [ข้อความ]
   /ai คุย [ข้อความ]
   ตัวอย่าง: /ai chat สวัสดี

3️⃣ ดูคำสั่ง:
   /ai help
   /ai ช่วยเหลือ

💡 เคล็ดลับ:
• โหมด chat จะจำบทสนทนาของคุณ
• โหมดถามคำถามเหมาะสำหรับคำถามทั่วไป
• รองรับทั้งภาษาไทยและภาษาอังกฤษ

🔋 Powered by GPT-4o via MCP`;

  await sendMessage(req, [
    {
      type: "text",
      text: helpText,
    },
  ]);
}

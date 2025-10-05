import { getAIMCPClient } from "@/lib/mcp/client";
import { formatCommandsForAI, getCommandByName } from "./command-registry";
import { executeCommand } from "./ai-command-router";

const { sendMessage } = await import("@/lib/utils/line-utils");

/**
 * Handle /ai command - AI-powered natural language command routing
 *
 * Supports:
 * - /ai [natural language request] - Route to appropriate command
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

    // Default: Natural language command routing
    const naturalLanguage = conditions.join(" ");
    await handleCommandRouting(req, naturalLanguage);
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
 * Handle natural language command routing
 */
async function handleCommandRouting(req: any, naturalLanguage: string) {
  try {
    // Send loading message
    await sendMessage(req, [
      {
        type: "text",
        text: "🤖 กำลังวิเคราะห์คำขอ...",
      },
    ]);

    const client = getAIMCPClient();

    // Get available commands in formatted string
    const commandsContext = formatCommandsForAI();

    // Route the command using AI
    const routeResponse = await client.routeCommand({
      userMessage: naturalLanguage,
      availableCommands: commandsContext,
    });

    console.log("🎯 AI Route Response:", routeResponse);

    // Check confidence level
    if (routeResponse.confidence < 0.6) {
      await sendMessage(req, [
        {
          type: "text",
          text: `ขอโทษครับ ไม่แน่ใจว่าคุณต้องการอะไร\n\n💭 ที่เข้าใจ: ${routeResponse.reasoning}\n\nลองพิมพ์ /ai help เพื่อดูคำสั่งที่มี`,
        },
      ]);
      return;
    }

    // Check if command was found
    if (!routeResponse.command) {
      await sendMessage(req, [
        {
          type: "text",
          text: `ไม่พบคำสั่งที่เหมาะสม\n\n💭 ${routeResponse.reasoning}\n\nพิมพ์ /help เพื่อดูคำสั่งทั้งหมด`,
        },
      ]);
      return;
    }

    // Get command definition
    const commandDef = getCommandByName(routeResponse.command);
    if (!commandDef) {
      await sendMessage(req, [
        {
          type: "text",
          text: `ไม่พบคำสั่ง: ${routeResponse.command}`,
        },
      ]);
      return;
    }

    // Send confirmation message
    await sendMessage(req, [
      {
        type: "text",
        text: `✅ เข้าใจแล้ว: ${routeResponse.reasoning}\n\n⚡ กำลังดำเนินการ...`,
      },
    ]);

    // Execute the command
    const result = await executeCommand(
      commandDef,
      routeResponse.parameters,
      req,
    );

    if (!result.success) {
      await sendMessage(req, [
        {
          type: "text",
          text: `❌ เกิดข้อผิดพลาด: ${result.error}`,
        },
      ]);
    }
    // Note: The actual command handler will send its own response
  } catch (error) {
    console.error("❌ Error in command routing:", error);
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
  const helpText = `🤖 AI Assistant - คำสั่งอัจฉริยะ

📌 วิธีใช้งาน:

1️⃣ สั่งงานด้วยภาษาธรรมชาติ:
   /ai [คำขอ]

   ตัวอย่าง:
   • /ai ดึงราคาทองให้หน่อย
   • /ai ราคา Bitcoin ตอนนี้เท่าไหร่
   • /ai เช็คชื่อเข้างาน
   • /ai สร้างกราฟ BTC จาก binance
   • /ai ขอลาวันที่ 10 มกราคม

2️⃣ สนทนา (จำบริบท):
   /ai chat [ข้อความ]
   /ai คุย [ข้อความ]

   ตัวอย่าง:
   • /ai chat สวัสดี
   • /ai คุย วันนี้อากาศเป็นอย่างไร

3️⃣ ดูคำสั่ง:
   /ai help
   /ai ช่วยเหลือ

💡 เคล็ดลับ:
• AI จะวิเคราะห์คำขอและเรียกคำสั่งที่เหมาะสม
• รองรับภาษาไทยและอังกฤษ
• ไม่ต้องจำคำสั่ง แค่บอกสิ่งที่ต้องการ
• โหมด chat สำหรับสนทนาทั่วไป

📚 คำสั่งที่รองรับ:
• คริปโต: ราคาเหรียญ, กราฟ
• การทำงาน: เช็คชื่อเข้า/ออก, รายงาน, ลา
• ข้อมูล: ทอง, หวย, น้ำมัน
• เครื่องมือ: สุ่มเลขบัตร, ตั้งค่า

🔋 Powered by GPT-4o via MCP`;

  await sendMessage(req, [
    {
      type: "text",
      text: helpText,
    },
  ]);
}

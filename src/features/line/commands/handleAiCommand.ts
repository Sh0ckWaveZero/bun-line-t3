import { spotifyHandler } from "@/features/spotify/handlers/handleSpotifyCommand";
import { handleCommandRouting } from "@/features/line/commands/ai/command-routing";
import { handleChatMode } from "@/features/line/commands/ai/chat-mode";
import { sendAIHelp } from "@/features/line/commands/ai/help";

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

    const subCommand = conditions[0]?.toLowerCase() || "";

    // Handle help command
    if (subCommand === "help" || subCommand === "ช่วยเหลือ") {
      await sendAIHelp(req);
      return;
    }

    // Handle Spotify command
    if (
      subCommand === "spotify" ||
      subCommand === "เพลง" ||
      subCommand === "music"
    ) {
      const fullText = `/ai ${conditions.join(" ")}`;
      await spotifyHandler.handle(req, fullText);
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


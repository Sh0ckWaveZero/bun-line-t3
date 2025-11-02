import {
  checkContentSafety,
  generateSafetyResponse,
  logAbuseReport,
} from "@/lib/ai/content-safety";
import { routeNaturalLanguageToCommand } from "@/lib/ai/command-intent";
import { LINE_COMMANDS } from "../command-registry";
import {
  executeCommand,
  parseAICommandResponse,
  type CommandRouteResult,
} from "../ai-command-router";

const { sendMessage, sendLoadingAnimation } = await import("@/lib/utils/line-utils");

/**
 * Handle natural language command routing
 */
export async function handleCommandRouting(req: any, naturalLanguage: string) {
  try {
    const userId = req.body.events[0].source.userId;

    // 🔄 Send loading animation to user immediately
    await sendLoadingAnimation(req, 20); // 20 seconds for AI processing

    // ✅ Safety check: Detect abuse/inappropriate content
    const safetyCheck = checkContentSafety(naturalLanguage);

    if (!safetyCheck.isSafe) {
      console.warn(
        `⚠️ [SAFETY] Blocked unsafe content from ${userId} in command routing: ${safetyCheck.category}`,
      );

      // Log abuse report for moderation
      await logAbuseReport({
        userId,
        text: safetyCheck.originalText,
        category: safetyCheck.category,
        severity: safetyCheck.severity,
        triggeredPatterns: safetyCheck.triggeredPatterns,
        timestamp: new Date(),
      });

      // Generate dynamic response using AI
      const aiResponse = await generateSafetyResponse(safetyCheck);

      // Send safe response to user
      await sendMessage(req, [
        {
          type: "text",
          text: aiResponse,
        },
      ]);
      return;
    }

    // 🤖 Route natural language to command using AI
    console.log(`🔄 Routing natural language: "${naturalLanguage}"`);

    const aiResponse = await routeNaturalLanguageToCommand(
      naturalLanguage,
      LINE_COMMANDS,
    );

    console.log(`📊 AI routing result:`, aiResponse);

    // Parse AI response
    const { command, parameters, reasoning } = parseAICommandResponse(aiResponse);

    if (!command) {
      console.warn(`⚠️ No command detected from AI response`);
      await sendMessage(req, [
        {
          type: "text",
          text: "ขอโทษครับ ไม่เข้าใจคำสั่งของคุณ\n\nพิมพ์ /ai help เพื่อดูตัวอย่างการใช้งาน",
        },
      ]);
      return;
    }

    // Find command definition
    const commandDef = LINE_COMMANDS.find((cmd) => cmd.command === command);

    if (!commandDef) {
      console.warn(`⚠️ Command not found: ${command}`);
      await sendMessage(req, [
        {
          type: "text",
          text: `ไม่พบคำสั่ง: ${command}\n\nพิมพ์ /help เพื่อดูรายการคำสั่งทั้งหมด`,
        },
      ]);
      return;
    }

    // Execute the command
    console.log(`✅ Executing command: ${command} with parameters:`, parameters);

    if (reasoning) {
      console.log(`💡 AI reasoning: ${reasoning}`);
    }

    const result: CommandRouteResult = await executeCommand(
      commandDef,
      parameters,
      req,
    );

    // Log result
    if (result.success) {
      console.log(`✅ Command executed successfully: ${result.command}`);
      if (result.explanation) {
        console.log(`📝 ${result.explanation}`);
      }
    } else {
      console.error(`❌ Command execution failed:`, result.error);
      await sendMessage(req, [
        {
          type: "text",
          text: `ขออภัย! ${result.error}\n\nพิมพ์ /ai help เพื่อดูวิธีใช้งาน`,
        },
      ]);
    }
  } catch (error) {
    console.error("❌ Error in command routing:", error);
    throw error;
  }
}

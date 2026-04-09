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

const { sendMessage, sendLoadingAnimation } = await import(
  "@/lib/utils/line-utils"
);

/**
 * Handle natural language command routing
 */
export async function handleCommandRouting(req: any, naturalLanguage: string) {
  const userId = req.body.events[0].source.userId;

  await sendLoadingAnimation(req, 20);

  const safetyCheck = checkContentSafety(naturalLanguage);

  if (!safetyCheck.isSafe) {
    await logAbuseReport({
      userId,
      text: safetyCheck.originalText,
      category: safetyCheck.category,
      severity: safetyCheck.severity,
      triggeredPatterns: safetyCheck.triggeredPatterns,
      timestamp: new Date(),
    });

    const aiResponse = await generateSafetyResponse(safetyCheck);

    await sendMessage(req, [
      {
        type: "text",
        text: aiResponse,
      },
    ]);
    return;
  }

  const aiResponse = await routeNaturalLanguageToCommand(
    naturalLanguage,
    LINE_COMMANDS,
  );
  const { command, parameters } = parseAICommandResponse(aiResponse);

  if (!command) {
    await sendMessage(req, [
      {
        type: "text",
        text: "ขอโทษครับ ไม่เข้าใจคำสั่งของคุณ\n\nพิมพ์ /ai help เพื่อดูตัวอย่างการใช้งาน",
      },
    ]);
    return;
  }

  const commandDef = LINE_COMMANDS.find((cmd) => cmd.command === command);

  if (!commandDef) {
    await sendMessage(req, [
      {
        type: "text",
        text: `ไม่พบคำสั่ง: ${command}\n\nพิมพ์ /help เพื่อดูรายการคำสั่งทั้งหมด`,
      },
    ]);
    return;
  }

  const result: CommandRouteResult = await executeCommand(
    commandDef,
    parameters,
    req,
  );

  if (!result.success) {
    await sendMessage(req, [
      {
        type: "text",
        text: `ขออภัย! ${result.error}\n\nพิมพ์ /ai help เพื่อดูวิธีใช้งาน`,
      },
    ]);
  }
}

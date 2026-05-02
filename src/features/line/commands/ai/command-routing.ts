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

function extractThaiNumberValues(input: string): number[] {
  const matches = input.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) ?? [];
  return matches
    .map((raw) => Number(raw.replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function inferExpenseParametersFromText(
  naturalLanguage: string,
  parameters: Record<string, any>,
): Record<string, any> {
  const currentSubcommand = String(parameters.subcommand ?? "").toLowerCase();
  if (currentSubcommand) return parameters;

  const text = naturalLanguage.toLowerCase();
  const hasSummaryIntent =
    /สรุป|summary|ดู|รายงาน|ยอดรวม|คงเหลือ|เท่าไหร่|สถานะ/.test(text);

  if (hasSummaryIntent) return parameters;

  const hasExpenseIntent =
    /กิน|ซื้อ|จ่าย|เสีย|หมดไป|ใช้ไป|ค่า|จ่ายไป|paid|spent|expense/.test(text);
  const hasIncomeIntent = /รายรับ|ได้เงิน|รับเงิน|เงินเข้า|income/.test(text);
  const amounts = extractThaiNumberValues(naturalLanguage);

  if (hasIncomeIntent && amounts.length > 0) {
    return {
      ...parameters,
      subcommand: "income",
      amount: parameters.amount ?? amounts.reduce((sum, n) => sum + n, 0),
    };
  }

  if (hasExpenseIntent && amounts.length > 0) {
    return {
      ...parameters,
      subcommand: "add",
      amount: parameters.amount ?? amounts.reduce((sum, n) => sum + n, 0),
    };
  }

  return parameters;
}

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
  const { command, parameters: parsedParameters } = parseAICommandResponse(aiResponse);

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

  const parameters =
    command === "expense"
      ? inferExpenseParametersFromText(naturalLanguage, parsedParameters)
      : parsedParameters;

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

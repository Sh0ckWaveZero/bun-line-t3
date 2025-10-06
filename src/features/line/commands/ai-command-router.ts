/**
 * AI Command Router
 *
 * Routes natural language requests to appropriate LINE command handlers.
 * Uses AI to understand user intent and map to existing commands.
 */

import { LINE_COMMANDS, type CommandDefinition } from "./command-registry";
import { handleExchangeCommand } from "./handleExchangeCommand";
import { handleGoldCommand } from "./handleGoldCommand";
import { handleLottoCommand } from "./handleLottoCommand";
import { handleGasCommand } from "./handleGasCommand";
import { handleCheckInCommand } from "./handleCheckInCommand";
import { handleCheckOutCommand } from "./handleCheckOutCommand";
import { handleWorkAttendanceCommand } from "./handleWorkAttendanceCommand";
import { handleReportCommand } from "./handleReportCommand";
import { handleStatusCommand } from "./handleStatusCommand";
import { handleHelpCommand } from "./handleHelpCommand";
import { handlePolicyInfo } from "./handlePolicyInfo";
import { handleLeaveCommandWrapper } from "./handleLeaveCommandWrapper";
import { handleChartCommand, parseChartCommand } from "./handleChartCommand";
import { handleSettingsCommand } from "./handleSettingsCommand";
import { handleIdGenerator } from "./handleIdGenerator";
import { handleHealthCommand } from "./handleHealthCommand";
import { spotifyHandler } from "@/features/spotify/handlers/handleSpotifyCommand";

export interface CommandRouteResult {
  /** Whether the command was successfully routed */
  success: boolean;
  /** The command that was executed */
  command?: string;
  /** Parameters extracted for the command */
  parameters?: Record<string, any>;
  /** Error message if routing failed */
  error?: string;
  /** AI explanation of what it understood */
  explanation?: string;
}

/**
 * Execute a LINE command handler based on command definition
 */
export async function executeCommand(
  commandDef: CommandDefinition,
  parameters: Record<string, any>,
  req: any,
): Promise<CommandRouteResult> {
  try {
    const command = commandDef.command;

    switch (command) {
      // Crypto commands
      case "bitkub":
      case "binance":
      case "satang":
      case "coinmarketcap": {
        const coin = parameters.coin || "";
        const conditions = coin ? [coin] : [];
        await handleExchangeCommand(
          commandDef.aliases[0] || command,
          conditions,
          req,
        );
        return {
          success: true,
          command,
          parameters,
          explanation: `ดึงราคาเหรียญจาก ${command}${coin ? ` สำหรับ ${coin}` : ""}`,
        };
      }

      case "chart": {
        const userId = req.body.events[0].source.userId;
        const exchange = parameters.exchange || "";
        const coin = parameters.coin || "";

        // Build chart command text
        let chartText = "/chart";
        if (exchange) chartText += ` ${exchange}`;
        if (coin) chartText += ` ${coin}`;

        const chartParams = parseChartCommand(chartText);
        if (chartParams) {
          await handleChartCommand(req, userId, chartParams);
          return {
            success: true,
            command: "chart",
            parameters,
            explanation: `สร้างกราฟราคา ${coin || "crypto"}${exchange ? ` จาก ${exchange}` : ""}`,
          };
        } else {
          return {
            success: false,
            command: "chart",
            error: "ไม่สามารถสร้างกราฟได้ กรุณาระบุชื่อเหรียญ",
          };
        }
      }

      // Work commands
      case "checkin":
        await handleCheckInCommand(req);
        return {
          success: true,
          command: "checkin",
          explanation: "บันทึกเวลาเข้างาน",
        };

      case "checkout":
        await handleCheckOutCommand(req);
        return {
          success: true,
          command: "checkout",
          explanation: "บันทึกเวลาออกงาน",
        };

      case "work":
        await handleWorkAttendanceCommand(req);
        return {
          success: true,
          command: "work",
          explanation: "แสดงข้อมูลการทำงานวันนี้",
        };

      case "status":
        await handleStatusCommand(req);
        return {
          success: true,
          command: "status",
          explanation: "แสดงสถานะการทำงานปัจจุบัน",
        };

      case "report":
        await handleReportCommand(req);
        return {
          success: true,
          command: "report",
          explanation: "แสดงรายงานการทำงานรายเดือน",
        };

      case "leave": {
        const startDate = parameters.startDate || "";
        const endDate = parameters.endDate || "";
        const reason = parameters.reason || "";
        const conditions = [startDate, endDate, reason].filter((v) => v);
        await handleLeaveCommandWrapper(conditions, req);
        return {
          success: true,
          command: "leave",
          parameters,
          explanation: `ยื่นใบลา${startDate ? ` วันที่ ${startDate}` : ""}`,
        };
      }

      // Info commands
      case "gold":
        await handleGoldCommand(req);
        return {
          success: true,
          command: "gold",
          explanation: "แสดงราคาทองคำวันนี้",
        };

      case "lotto": {
        const number = parameters.number || "";
        const conditions = number ? [number] : [];
        await handleLottoCommand(conditions, req);
        return {
          success: true,
          command: "lotto",
          parameters,
          explanation: number ? `ตรวจสอบผลสลาก ${number}` : "แสดงผลสลากล่าสุด",
        };
      }

      case "gas":
        await handleGasCommand([], req);
        return {
          success: true,
          command: "gas",
          explanation: "แสดงราคาน้ำมันวันนี้",
        };

      case "policy":
        await handlePolicyInfo(req);
        return {
          success: true,
          command: "policy",
          explanation: "แสดงนโยบายและกฎการทำงาน",
        };

      // Health commands
      case "health":
        await handleHealthCommand(req);
        return {
          success: true,
          command: "health",
          explanation: "แสดงข้อมูลสุขภาพและกิจกรรม",
        };

      // Music commands
      case "spotify": {
        const mood = parameters.mood || "";
        const query = parameters.query || "";

        // Build spotify command text
        let spotifyText = "/ai spotify";
        if (mood) {
          spotifyText += ` ${mood}`;
        } else if (query) {
          spotifyText += ` ${query}`;
        }

        await spotifyHandler.handle(req, spotifyText);
        return {
          success: true,
          command: "spotify",
          parameters,
          explanation: mood
            ? `แนะนำเพลง mood: ${mood}`
            : query
              ? `ค้นหาและแนะนำเพลง: ${query}`
              : "แสดงเมนูเลือก mood",
        };
      }

      // Utility commands
      case "thai-id":
        await handleIdGenerator(req);
        return {
          success: true,
          command: "thai-id",
          explanation: "สุ่มเลขบัตรประชาชนไทย",
        };

      case "settings": {
        const conditions = parameters.subcommand ? [parameters.subcommand] : [];
        await handleSettingsCommand(req, conditions);
        return {
          success: true,
          command: "settings",
          parameters,
          explanation: "เปิดหน้าตั้งค่า",
        };
      }

      case "help":
        await handleHelpCommand(req);
        return {
          success: true,
          command: "help",
          explanation: "แสดงรายการคำสั่งทั้งหมด",
        };

      default:
        return {
          success: false,
          error: `ไม่พบคำสั่ง: ${command}`,
        };
    }
  } catch (error) {
    console.error(`Error executing command ${commandDef.command}:`, error);
    return {
      success: false,
      command: commandDef.command,
      error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
    };
  }
}

/**
 * Parse AI response to extract command and parameters
 */
export function parseAICommandResponse(aiResponse: string): {
  command: string | null;
  parameters: Record<string, any>;
  reasoning?: string;
} {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(aiResponse);

    return {
      command: parsed.command || null,
      parameters: parsed.parameters || {},
      reasoning: parsed.reasoning,
    };
  } catch {
    // Fallback: simple text parsing
    const lines = aiResponse.split("\n");
    let command: string | null = null;
    const parameters: Record<string, any> = {};
    let reasoning: string | undefined;

    for (const line of lines) {
      if (line.startsWith("command:")) {
        command = line.replace("command:", "").trim();
      } else if (line.startsWith("parameters:")) {
        try {
          const paramStr = line.replace("parameters:", "").trim();
          Object.assign(parameters, JSON.parse(paramStr));
        } catch {
          // Ignore parsing errors
        }
      } else if (line.startsWith("reasoning:")) {
        reasoning = line.replace("reasoning:", "").trim();
      }
    }

    return { command, parameters, reasoning };
  }
}

/**
 * Get command registry as JSON schema for AI
 */
export function getCommandSchemaForAI() {
  return {
    type: "object",
    properties: {
      command: {
        type: "string",
        enum: LINE_COMMANDS.map((cmd) => cmd.command),
        description: "The command to execute",
      },
      parameters: {
        type: "object",
        description: "Parameters for the command",
        additionalProperties: true,
      },
      reasoning: {
        type: "string",
        description: "Explanation of why this command was chosen",
      },
    },
    required: ["command"],
  };
}

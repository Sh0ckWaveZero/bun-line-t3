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
import { handleExpenseCommand } from "./handleExpenseCommand";
import { handleCategoryCommand } from "./handleCategoryCommand";

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

      // Expense tracker commands
      case "expense": {
        const subcommand = parameters.subcommand || "";
        const amount = parameters.amount ? String(parameters.amount) : "";
        const category = parameters.category || "";
        const note = parameters.note ? `#${parameters.note}` : "";
        const tags = parameters.tags
          ? Array.isArray(parameters.tags)
            ? parameters.tags.map((t: string) => `@${t}`).join(" ")
            : `@${parameters.tags}`
          : "";

        // Build conditions array based on subcommand
        let conditions: string[] = [];

        if (subcommand === "add" || subcommand === "จ่าย" || subcommand === "บันทึก") {
          // /จ่าย [amount] [category] [#note] [@tags]
          conditions = [amount, category, note, tags].filter(Boolean);
          await handleExpenseCommand(req, conditions, "EXPENSE");
          return {
            success: true,
            command: "expense",
            parameters,
            explanation: `บันทึกรายจ่าย ${amount} บาท${category ? ` หมวด ${category}` : ""}${note ? ` ${note}` : ""}`,
          };
        }

        if (subcommand === "income" || subcommand === "รับ" || subcommand === "รายรับ") {
          // /รับ [amount] [category] [#note] [@tags]
          conditions = [amount, category, note, tags].filter(Boolean);
          await handleExpenseCommand(req, conditions, "INCOME");
          return {
            success: true,
            command: "expense",
            parameters,
            explanation: `บันทึกรายรับ ${amount} บาท${category ? ` หมวด ${category}` : ""}${note ? ` ${note}` : ""}`,
          };
        }

        if (subcommand === "list" || subcommand === "ล่าสุด" || subcommand === "history") {
          const limit = parameters.limit || parameters.count || 5;
          conditions = [String(limit)];
          await handleExpenseCommand(req, conditions);
          return {
            success: true,
            command: "expense",
            parameters,
            explanation: `แสดงรายการล่าสุด ${limit} รายการ`,
          };
        }

        if (subcommand === "del" || subcommand === "delete" || subcommand === "ลบ") {
          const id = parameters.id || "";
          conditions = id ? [id] : [];
          await handleExpenseCommand(req, conditions);
          return {
            success: true,
            command: "expense",
            parameters,
            explanation: id ? `ลบรายการ ${id}` : "แสดงเมนูลบรายการ",
          };
        }

        if (subcommand === "edit" || subcommand === "แก้" || subcommand === "แก้ไข") {
          const field = parameters.field || parameters.amount ? String(parameters.amount) : "";
          const value = parameters.value || parameters.note || parameters.category || "";
          conditions = [field, String(value)].filter(Boolean);
          await handleExpenseCommand(req, conditions);
          return {
            success: true,
            command: "expense",
            parameters,
            explanation: "แก้ไขรายการล่าสุด",
          };
        }

        if (subcommand === "month" || subcommand === "เดือน") {
          const month = parameters.month || "";
          conditions = [month];
          await handleExpenseCommand(req, conditions);
          return {
            success: true,
            command: "expense",
            parameters,
            explanation: month ? `แสดงสรุปเดือน ${month}` : "แสดงสรุปเดือนปัจจุบัน",
          };
        }

        if (subcommand === "today" || subcommand === "วันนี้") {
          await handleExpenseCommand(req, []);
          return {
            success: true,
            command: "expense",
            explanation: "แสดงสรุปวันนี้",
          };
        }

        if (subcommand === "week" || subcommand === "สัปดาห์") {
          await handleExpenseCommand(req, []);
          return {
            success: true,
            command: "expense",
            explanation: "แสดงสรุปสัปดาห์นี้",
          };
        }

        // Default: show summary
        await handleExpenseCommand(req, []);
        return {
          success: true,
          command: "expense",
          explanation: "แสดงสรุปรายรับรายจ่ายเดือนปัจจุบัน",
        };
      }

      case "category": {
        const subcommand = parameters.subcommand || parameters.action || "";
        const name = parameters.name || "";
        const icon = parameters.icon || "";

        let conditions: string[] = [];

        if (subcommand === "add" || subcommand === "เพิ่ม" || subcommand === "สร้าง" || subcommand === "new") {
          conditions = [name, icon].filter(Boolean);
          await handleCategoryCommand(req, conditions);
          return {
            success: true,
            command: "category",
            parameters,
            explanation: `สร้างหมวดหมู่ "${name}"`,
          };
        }

        if (subcommand === "del" || subcommand === "delete" || subcommand === "ลบ" || subcommand === "rm") {
          conditions = [name];
          await handleCategoryCommand(req, conditions);
          return {
            success: true,
            command: "category",
            parameters,
            explanation: `ลบหมวดหมู่ "${name}"`,
          };
        }

        // Default: list all categories
        await handleCategoryCommand(req, []);
        return {
          success: true,
          command: "category",
          explanation: "แสดงหมวดหมู่ทั้งหมด",
        };
      }

      // Income shortcut (รับ)
      case "รับ": {
        const amount = parameters.amount ? String(parameters.amount) : "";
        const category = parameters.category || "";
        const note = parameters.note ? `#${parameters.note}` : "";
        const tags = parameters.tags
          ? Array.isArray(parameters.tags)
            ? parameters.tags.map((t: string) => `@${t}`).join(" ")
            : `@${parameters.tags}`
          : "";
        const conditions = [amount, category, note, tags].filter(Boolean);
        await handleExpenseCommand(req, conditions, "INCOME");
        return {
          success: true,
          command: "expense",
          parameters,
          explanation: `บันทึกรายรับ ${amount} บาท${category ? ` หมวด ${category}` : ""}`,
        };
      }

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
        const paramStr = line.replace("parameters:", "").trim();
        if (paramStr) {
          try {
            const parsed = JSON.parse(paramStr);
            // Validate that parsed result is an object
            if (
              parsed &&
              typeof parsed === "object" &&
              !Array.isArray(parsed)
            ) {
              Object.assign(parameters, parsed);
            }
          } catch {
            // Continue with empty parameters instead of silently failing
          }
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

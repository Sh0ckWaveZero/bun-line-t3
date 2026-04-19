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
import { handleDefaultCommand } from "./handleDefaultCommand";
import { handleChartCommand, parseChartCommand } from "./handleChartCommand";
import { handleSettingsCommand } from "./handleSettingsCommand";
import { handleIdGenerator } from "./handleIdGenerator";
import { handleAiCommand } from "./handleAiCommand";
import { handleDcaCommand } from "./handleDcaCommand";
import { handleExpenseCommand } from "./handleExpenseCommand";

const { sendMessage } = await import("@/lib/utils/line-utils");

export { handleExpenseCommand } from "./handleExpenseCommand";

export const handleCommand = async (
  command: string,
  conditions: any[],
  req: any,
) => {
  // Exchange group
  if (
    [
      "bk",
      "bitkub",
      "st",
      "satang",
      "btz",
      "bitazza",
      "bn",
      "binance",
      "bnbusd",
      "gate",
      "gateio",
      "gt",
      "mexc",
      "mx",
      "cmc",
      "coinmarketcap",
    ].includes(command)
  ) {
    const handled = await handleExchangeCommand(command, conditions, req);
    if (handled) return;
  }
  // Gold
  if (["gold", "ทอง"].includes(command)) {
    await handleGoldCommand(req);
    return;
  }
  // Lotto
  if (["หวย", "lotto"].includes(command)) {
    await handleLottoCommand(conditions, req);
    return;
  }
  // Gas
  if (["gas", "น้ำมัน"].includes(command)) {
    await handleGasCommand(conditions, req);
    return;
  }
  // Work
  if (["work", "งาน"].includes(command)) {
    await handleWorkAttendanceCommand(req);
    return;
  }
  // Checkin
  if (["checkin", "เข้างาน"].includes(command)) {
    await handleCheckInCommand(req);
    return;
  }
  // Checkout
  if (["เลิกงาน", "ออกงาน", "checkout"].includes(command)) {
    await handleCheckOutCommand(req);
    return;
  }
  // Report
  if (["รายงาน", "report"].includes(command)) {
    await handleReportCommand(req);
    return;
  }
  // Status
  if (["สถานะ", "status"].includes(command)) {
    await handleStatusCommand(req);
    return;
  }
  // Help
  if (["ช่วยเหลือ", "help", "คำสั่ง", "commands"].includes(command)) {
    await handleHelpCommand(req);
    return;
  }
  // Policy
  if (["นโยบาย", "policy", "กฎ", "rule"].includes(command)) {
    await handlePolicyInfo(req);
    return;
  }
  // Leave
  if (["leave", "ลา"].includes(command)) {
    await handleLeaveCommandWrapper(conditions, req);
    return;
  }
  // Settings
  if (
    [
      "ตั้งค่า",
      "settings",
      "setting",
      "config",
      "preferences",
      "pref",
    ].includes(command)
  ) {
    await handleSettingsCommand(req, conditions);
    return;
  }
  // Thai ID Generator
  if (
    [
      // ภาษาไทย (เต็ม)
      "สุ่มเลขบัตร",
      "สุ่มบัตรประชาชน",
      "เลขบัตรประชาชน",
      "บัตรประชาชน",
      "สุ่มเลขบัตรประชาชน",
      "ตรวจสอบเลขบัตรประชาชน",
      "ตรวจสอบบัตร",
      "เช็คบัตร",
      "เช็คเลขบัตรประชาชน",

      // ภาษาอังกฤษ (เต็ม)
      "random id",
      "generate id",
      "random thai id",
      "generate thai id",
      "create id card",
      "create thai id",
      "random citizen id",
      "generate citizen id",
      "validate id",
      "check id",
      "verify id",
      "validate thai id",
      "check thai id",
      "verify thai id",
      "validate citizen id",
      "check citizen id",
      "verify citizen id",

      // ภาษาอังกฤษ (ย่อ)
      "id card",
      "thai id",
      "gen id",
      "rand id",
      "new id",
      "create id",
      "make id",
      "valid id",
      "checkid",
      "verifyid",
      "validateid",
    ].includes(command)
  ) {
    await handleIdGenerator(req);
    return;
  }
  // AI Assistant
  if (["ai", "ถาม", "ask", "คุย", "chat"].includes(command)) {
    await handleAiCommand(req, conditions);
    return;
  }
  // Auto DCA
  if (["dca", "ดีซีเอ", "auto-dca", "autodca"].includes(command)) {
    await handleDcaCommand(req, conditions);
    return;
  }
  // Expense Tracker — รายรับรายจ่าย (full command)
  if (["expense", "เงิน", "รายรับรายจ่าย", "รายจ่าย"].includes(command)) {
    await handleExpenseCommand(req, conditions);
    return;
  }
  // รายจ่าย shortcut: /จ่าย 250 อาหาร
  if (["จ่าย", "exp", "e"].includes(command)) {
    await handleExpenseCommand(req, conditions, "EXPENSE");
    return;
  }
  // รายรับ shortcut: /รับ 30000 เงินเดือน
  if (["รับ", "income", "รายรับ", "i"].includes(command)) {
    await handleExpenseCommand(req, conditions, "INCOME");
    return;
  }
  // Chart
  if (["chart", "กราฟ", "c"].includes(command)) {
    try {
      if (!req.body || !req.body.events || !req.body.events[0]) {
        return;
      }

      const userId = req.body.events[0].source.userId;
      const originalText = req.body.events[0].message.text;

      const chartParams = parseChartCommand(originalText);

      if (chartParams) {
        await handleChartCommand(req, userId, chartParams);
      } else {
        await sendMessage(req, [
          {
            type: "text",
            text: `รูปแบบคำสั่งไม่ถูกต้อง\n\nใช้:\n• /chart [เหรียญ] [ตลาด]\n• /chart [ตลาด] [เหรียญ]\n• /c [ตลาด] [เหรียญ]\n\nตัวอย่าง:\n• /chart btc\n• /chart bn btc\n• /c bn btc`,
          },
        ]);
      }
    } catch {
      try {
        await sendMessage(req, [
          {
            type: "text",
            text: `ขออภัย! ไม่สามารถสร้างกราฟได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง`,
          },
        ]);
      } catch {
        // Silently fail
      }
    }
    return;
  }
  // Default
  handleDefaultCommand(req);
};

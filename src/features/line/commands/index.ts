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
import { handleIdGenerator } from "./id-generator";
const { sendMessage } = await import("@/lib/utils/line-utils");

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
      "สุ่มเลขบัตร",
      "สุ่มบัตรประชาชน",
      "เลขบัตรประชาชน",
      "บัตรประชาชน",
      "ตรวจสอบบัตร",
      "เช็คบัตร",
    ].includes(command)
  ) {
    const response = await handleIdGenerator(req.body.events[0]);
    if (response) {
      await sendMessage(req, [{ type: "text", text: response }]);
    }
    return;
  }
  // Chart
  if (["chart", "กราฟ", "c"].includes(command)) {
    console.log("🚀 Chart command detected, command:", command);
    try {
      // Check if request structure is valid
      if (!req.body || !req.body.events || !req.body.events[0]) {
        console.error("Invalid request structure for chart command");
        return;
      }

      const userId = req.body.events[0].source.userId;
      const originalText = req.body.events[0].message.text;
      console.log(
        "📊 Chart command - userId:",
        userId,
        "originalText:",
        originalText,
      );

      const chartParams = parseChartCommand(originalText);
      console.log("📊 Chart params parsed:", chartParams);

      if (chartParams) {
        console.log("📊 Calling handleChartCommand with params:", chartParams);
        await handleChartCommand(req, userId, chartParams);
        console.log("✅ Chart command completed successfully");
      } else {
        console.error("❌ Chart params parsing failed");
        await sendMessage(req, [
          {
            type: "text",
            text: `รูปแบบคำสั่งไม่ถูกต้อง\n\nใช้:\n• /chart [เหรียญ] [ตลาด]\n• /chart [ตลาด] [เหรียญ]\n• /c [ตลาด] [เหรียญ]\n\nตัวอย่าง:\n• /chart btc\n• /chart bn btc\n• /c bn btc`,
          },
        ]);
      }
    } catch (error) {
      console.error("❌ Chart command error:", error);
      // Send error message back to user
      try {
        await sendMessage(req, [
          {
            type: "text",
            text: `ขออภัย! ไม่สามารถสร้างกราฟได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง\n\nError: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ]);
      } catch (sendError) {
        console.error("Failed to send error message:", sendError);
      }
    }
    return;
  }
  // Default
  handleDefaultCommand(req);
};

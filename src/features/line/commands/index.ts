import { handleExchangeCommand } from './handleExchangeCommand';
import { handleGoldCommand } from './handleGoldCommand';
import { handleLottoCommand } from './handleLottoCommand';
import { handleGasCommand } from './handleGasCommand';
import { handleCheckInCommand } from './handleCheckInCommand';
import { handleCheckOutCommand } from './handleCheckOutCommand';
import { handleWorkAttendanceCommand } from './handleWorkAttendanceCommand';
import { handleReportCommand } from './handleReportCommand';
import { handleStatusCommand } from './handleStatusCommand';
import { handleHelpCommand } from './handleHelpCommand';
import { handlePolicyInfo } from './handlePolicyInfo';
import { handleLeaveCommandWrapper } from './handleLeaveCommandWrapper';
import { handleDefaultCommand } from './handleDefaultCommand';

export const handleCommand = async (command: string, conditions: any[], req: any) => {
  // Exchange group
  if ([
    'bk', 'bitkub', 'st', 'satang', 'btz', 'bitazza', 'bn', 'binance', 'bnbusd', 'gate', 'gateio', 'gt', 'mexc', 'mx', 'cmc', 'coinmarketcap'
  ].includes(command)) {
    const handled = await handleExchangeCommand(command, conditions, req);
    if (handled) return;
  }
  // Gold
  if (['gold', 'ทอง'].includes(command)) {
    await handleGoldCommand(req);
    return;
  }
  // Lotto
  if (['หวย', 'lotto'].includes(command)) {
    await handleLottoCommand(conditions, req);
    return;
  }
  // Gas
  if (['gas', 'น้ำมัน'].includes(command)) {
    await handleGasCommand(conditions, req);
    return;
  }
  // Work
  if (['work', 'งาน'].includes(command)) {
    await handleWorkAttendanceCommand(req);
    return;
  }
  // Checkin
  if (['checkin', 'เข้างาน'].includes(command)) {
    await handleCheckInCommand(req);
    return;
  }
  // Checkout
  if (['เลิกงาน', 'ออกงาน', 'checkout'].includes(command)) {
    await handleCheckOutCommand(req);
    return;
  }
  // Report
  if (['รายงาน', 'report'].includes(command)) {
    await handleReportCommand(req);
    return;
  }
  // Status
  if (['สถานะ', 'status'].includes(command)) {
    await handleStatusCommand(req);
    return;
  }
  // Help
  if (['ช่วยเหลือ', 'help', 'คำสั่ง', 'commands'].includes(command)) {
    await handleHelpCommand(req);
    return;
  }
  // Policy
  if (['นโยบาย', 'policy', 'กฎ', 'rule'].includes(command)) {
    await handlePolicyInfo(req);
    return;
  }
  // Leave
  if (['leave', 'ลา'].includes(command)) {
    await handleLeaveCommandWrapper(conditions, req);
    return;
  }
  // Default
  handleDefaultCommand(req);
};

import { db } from "@/lib/database/db";
import { sendPushMessage } from "@/lib/utils/line-push";
import { bitkubService } from "@/features/exchanges/services/bitkub.service.server";
import { createDcaBalanceAlertFlexMessage } from "@/features/line/line-utils/flex-messages";
import {
  DCA_FUNDING_THRESHOLD_THB,
  isDcaFundingLow,
} from "../constants/funding-alert";

export interface DcaBalanceAlertSummary {
  checkedConnections: number;
  lowBalance: number;
  sent: number;
  failed: number;
  skipped: number;
}

const listConnectedUserIds = async (): Promise<string[]> => {
  const connections = await db.bitkubConnection.findMany({
    where: { connectedAt: { not: null }, encryptedCredentials: { not: null } },
    select: { userId: true },
  });
  return connections.map((connection) => connection.userId);
};

/**
 * user ที่เชื่อม Bitkub ต้องมีบัญชี LINE ผูกไว้และอนุมัติรับ reminder
 * (gate เดียวกับแจ้งเตือนเข้างาน/ออกงาน) จึงจะรับ push นี้
 */
const resolveNotifyLineUserId = async (
  userId: string,
): Promise<string | null> => {
  const account = await db.account.findFirst({
    where: { userId, providerId: "line" },
    orderBy: { updatedAt: "desc" },
    select: { accountId: true },
  });
  const lineUserId = account?.accountId.trim();
  if (!lineUserId) return null;

  const approval = await db.lineApprovalRequest.findUnique({
    where: { lineUserId },
    select: { status: true, canReceiveReminders: true },
  });
  if (!approval || approval.status !== "APPROVED") return null;
  return approval.canReceiveReminders ? lineUserId : null;
};

/**
 * ตรวจยอดเงินบาทใน Bitkub ของทุก user ที่เชื่อมไว้
 * ถ้าต่ำกว่าเกณฑ์ (108 บาท) ส่ง LINE push เตือนให้เติมเงิน
 */
export const runDcaBalanceAlert = async (): Promise<DcaBalanceAlertSummary> => {
  const summary: DcaBalanceAlertSummary = {
    checkedConnections: 0,
    lowBalance: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };
  const appUrl = process.env["APP_URL"] ?? process.env["NEXTAUTH_URL"] ?? "";

  for (const userId of await listConnectedUserIds()) {
    summary.checkedConnections += 1;

    const lineUserId = await resolveNotifyLineUserId(userId);
    if (!lineUserId) {
      summary.skipped += 1;
      continue;
    }

    let thbAvailable: number;
    try {
      thbAvailable = await bitkubService.getThbBalance(userId);
    } catch (error) {
      console.error("[dca-balance-alert] ดึงยอดเงินไม่สำเร็จ", error);
      summary.failed += 1;
      continue;
    }

    if (!isDcaFundingLow(thbAvailable)) continue;
    summary.lowBalance += 1;

    try {
      await sendPushMessage(lineUserId, [
        createDcaBalanceAlertFlexMessage(
          { thbAvailable, threshold: DCA_FUNDING_THRESHOLD_THB },
          appUrl,
        ),
      ]);
      summary.sent += 1;
    } catch (error) {
      console.error("[dca-balance-alert] ส่ง LINE ไม่สำเร็จ", error);
      summary.failed += 1;
    }
  }

  return summary;
};

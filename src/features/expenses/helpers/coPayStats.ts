/**
 * Pure calculations สำหรับ ThaiHelpCalculator (ไทยช่วยไทย 60/40)
 * แยกจาก component เพื่อให้ทดสอบได้ — ผลลัพธ์ต้องตรงกับ logic เดิมทุกประการ
 */

import {
  CO_PAY_DAILY_MAX_SUBSIDY,
  CO_PAY_STATE_SHARE,
  CO_PAY_USER_SHARE,
  calculateCoPaymentSplit,
  parseTransactionSubsidy,
} from "@/features/expenses/helpers/coPayment";

/** รูปร่าง transaction ที่คำนวณต้องใช้ (โครงสร้างย่อยของ TransactionWithCategory) */
export interface CoPayTransactionLike {
  type?: string;
  amount: number;
  note?: string | null;
  tags?: string | null;
  transDate?: string | null;
  transMonth?: string | null;
}

/** รูปร่างหมวดหมู่ที่คำนวณ/แสดงผลต้องใช้ */
export interface CoPayCategory {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  isActive: boolean;
}

export interface DailyCoPayStats {
  todaySubsidyUsed: number;
  todayUserSpent: number;
  todayTotalBill: number;
  todayRemaining: number;
}

export interface MonthlyCoPayStats {
  totalSubsidyUsed: number;
  remainingSubsidy: number;
  totalUserSpent: number;
  count: number;
}

export interface SplitBillResult {
  numericBill: number;
  subsidy60: number;
  userPaid40: number;
  monthlyQuotaExceeded: boolean;
}

export interface TopUpResult {
  numericSubsidy: number;
  topUpNeeded: number;
  purchaseValue: number;
}

/** สถิติรายวัน (client-side only เพื่อเลี่ยง SSR hydration mismatch) */
export function computeDailyCoPayStats(
  transactions: CoPayTransactionLike[],
): DailyCoPayStats {
  const today = new Date().toISOString().split("T")[0]!;
  let todaySubsidyUsed = 0;
  let todayUserSpent = 0;

  transactions.forEach((tx) => {
    const txDate = tx.transDate ? String(tx.transDate).substring(0, 10) : "";
    if (txDate !== today || tx.type !== "EXPENSE") return;
    const subsidy = parseTransactionSubsidy(tx.amount, tx.note, tx.tags);
    if (subsidy > 0) {
      todaySubsidyUsed += subsidy;
      todayUserSpent += tx.amount;
    }
  });

  return {
    todaySubsidyUsed,
    todayUserSpent,
    todayTotalBill: todaySubsidyUsed + todayUserSpent,
    todayRemaining: Math.max(CO_PAY_DAILY_MAX_SUBSIDY - todaySubsidyUsed, 0),
  };
}

/** สถิติรายเดือน (client-side only เพื่อเลี่ยง SSR hydration mismatch) */
export function computeMonthlyCoPayStats(
  transactions: CoPayTransactionLike[],
): MonthlyCoPayStats {
  let totalSubsidyUsed = 0;
  let totalUserSpent = 0;
  let count = 0;

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  transactions.forEach((tx) => {
    const txMonth =
      tx.transMonth || (tx.transDate ? tx.transDate.substring(0, 7) : "");
    if (txMonth !== currentMonthStr || tx.type !== "EXPENSE") return;

    const subsidy = parseTransactionSubsidy(tx.amount, tx.note, tx.tags);
    if (subsidy > 0) {
      count++;
      totalUserSpent += tx.amount;
      totalSubsidyUsed += subsidy;
    }
  });

  return {
    totalSubsidyUsed,
    remainingSubsidy: Math.max(1000 - totalSubsidyUsed, 0),
    totalUserSpent,
    count,
  };
}

/**
 * Calculations for Split Bill — cap subsidy at monthly quota to prevent phantom amounts
 */
export function computeSplitBill(
  totalBill: string,
  remainingSubsidy: number,
): SplitBillResult {
  const numericBill = parseFloat(totalBill) || 0;
  const { subsidyAmount: rawSubsidy60 } = calculateCoPaymentSplit(numericBill);
  const subsidy60 = Math.min(rawSubsidy60, remainingSubsidy);
  const userPaid40 = Math.max(numericBill - subsidy60, 0);
  const monthlyQuotaExceeded =
    numericBill > 0 && rawSubsidy60 > remainingSubsidy;

  return { numericBill, subsidy60, userPaid40, monthlyQuotaExceeded };
}

/** Calculations for Top Up */
export function computeTopUp(desiredSubsidy: string): TopUpResult {
  const numericSubsidy = parseFloat(desiredSubsidy) || 0;
  return {
    numericSubsidy,
    topUpNeeded: numericSubsidy * (CO_PAY_USER_SHARE / CO_PAY_STATE_SHARE),
    purchaseValue: numericSubsidy * (1 / CO_PAY_STATE_SHARE),
  };
}

/** Remaining combined purchasing power (state + user) for this month */
export function computeMonthlyRemainingCombined(
  remainingSubsidy: number,
): number {
  return (
    remainingSubsidy +
    remainingSubsidy * (CO_PAY_USER_SHARE / CO_PAY_STATE_SHARE)
  );
}

/** หมวดหมู่ default สำหรับ split bill (อาหาร/กิน ก่อน แล้วค่อย active ตัวแรก) */
export function findDefaultCoPayCategoryId(
  categories: CoPayCategory[],
): string {
  return (
    categories.find(
      (category) =>
        category.isActive &&
        (category.name.includes("อาหาร") || category.name.includes("กิน")),
    )?.id ??
    categories.find((category) => category.isActive)?.id ??
    ""
  );
}

/** เลือก id ที่ใช้จริง: user-selected เฉพาะเมื่อยัง active */
export function resolveSelectedCoPayCategoryId(
  categories: CoPayCategory[],
  userSelectedCategoryId: string | null,
  defaultCategoryId: string,
): string {
  return userSelectedCategoryId &&
    categories.some(
      (category) => category.id === userSelectedCategoryId && category.isActive,
    )
    ? userSelectedCategoryId
    : defaultCategoryId;
}

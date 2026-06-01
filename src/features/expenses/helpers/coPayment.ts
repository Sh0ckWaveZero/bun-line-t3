/**
 * Co-payment Campaign Helper (ไทยช่วยไทย พลัส 60/40 / คนละครึ่ง)
 *
 * This module isolates all campaign-specific logic.
 * Can be completely toggled off or easily removed after the campaign ends.
 */

// --- FEATURE FLAG ---
// Set to false to immediately deactivate co-payment calculations globally
export const IS_CO_PAYMENT_ACTIVE = true;

// Daily and monthly limits based on the campaign conditions
export const CO_PAY_STATE_SHARE = 0.6; // 60%
export const CO_PAY_USER_SHARE = 0.4; // 40%
export const CO_PAY_DAILY_MAX_SUBSIDY = 200; // 200 THB
export const CO_PAY_MONTHLY_MAX_SUBSIDY = 1000; // 1,000 THB

// Keywords and abbreviations to trigger co-payment calculation
const CO_PAY_KEYWORDS = [
  "ไทยช่วยไทย",
  "60/40",
  "คนละครึ่ง",
  "ทชท",
  "tct",
  "6040",
  "คละคร",
  "klk",
];

/**
 * Checks if a string contains any co-payment trigger keyword or abbreviation
 */
export function isCoPaymentTrigger(text?: string | null): boolean {
  if (!IS_CO_PAYMENT_ACTIVE || !text) return false;

  const normalized = text.toLowerCase().trim();
  return CO_PAY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

/**
 * Checks if a list of tags contains any co-payment trigger
 */
export function hasCoPaymentTag(tags?: string[] | null): boolean {
  if (!IS_CO_PAYMENT_ACTIVE || !tags) return false;

  return tags.some((tag) => isCoPaymentTrigger(tag));
}

/**
 * Checks if the transaction should be treated as co-payment
 */
export function shouldApplyCoPayment(
  type: string,
  note?: string | null,
  tags?: string[] | null,
): boolean {
  if (!IS_CO_PAYMENT_ACTIVE || type !== "EXPENSE") return false;
  return isCoPaymentTrigger(note) || hasCoPaymentTag(tags);
}

/**
 * Calculates co-payment split (60/40) for a given total bill
 */
export function calculateCoPaymentSplit(totalBill: number): {
  subsidyAmount: number;
  userAmount: number;
  isCoPay: boolean;
} {
  if (!IS_CO_PAYMENT_ACTIVE || totalBill <= 0) {
    return { subsidyAmount: 0, userAmount: totalBill, isCoPay: false };
  }

  const rawSubsidy = Math.min(
    totalBill * CO_PAY_STATE_SHARE,
    CO_PAY_DAILY_MAX_SUBSIDY,
  );
  const subsidyAmount = Math.round(rawSubsidy * 100) / 100;
  const userAmount = Math.round((totalBill - subsidyAmount) * 100) / 100;

  return {
    subsidyAmount,
    userAmount,
    isCoPay: true,
  };
}

/**
 * Formulates the standardized co-payment note and tags
 */
export function formatCoPaymentDetails(
  totalBill: number,
  subsidyAmount: number,
  originalNote?: string | null,
  originalTags: string[] = [],
): {
  note: string;
  tags: string[];
} {
  const formattedTotal = totalBill.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedSubsidy = subsidyAmount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Clean note by removing simple trigger words to keep it clean
  let cleanNote = (originalNote || "").trim();
  const lowerNote = cleanNote.toLowerCase();

  const isOnlyTrigger = CO_PAY_KEYWORDS.some((k) => lowerNote === k);
  if (isOnlyTrigger) {
    cleanNote = "";
  }

  const note = `ไทยช่วยไทย 60/40 (ยอดเต็ม: ${formattedTotal} บ., รัฐช่วย: ${formattedSubsidy} บ.)${cleanNote ? ` - ${cleanNote}` : ""}`;

  // Build tags list
  const tags = [...originalTags];
  if (!tags.includes("ไทยช่วยไทย")) tags.push("ไทยช่วยไทย");
  if (!tags.includes("60-40")) tags.push("60-40");

  return { note, tags };
}

/**
 * Parses the state subsidy amount from a transaction
 */
export function parseTransactionSubsidy(
  amount: number,
  note?: string | null,
  tags?: string | null,
): number {
  if (!IS_CO_PAYMENT_ACTIVE) return 0;

  const noteStr = note || "";
  const tagsStr = tags || "";

  const isThaiHelp =
    isCoPaymentTrigger(noteStr) ||
    tagsStr.split(",").some((t) => isCoPaymentTrigger(t));

  if (!isThaiHelp) return 0;

  // 1. Try to parse from standardized note: "รัฐช่วย: 180.00 บ."
  const match = noteStr.match(/รัฐช่วย:\s*([\d,.]+)/);
  if (match && match[1]) {
    return parseFloat(match[1].replace(/,/g, ""));
  }

  // 2. Fallback: estimate based on 60/40 split (userPaid = 40%, subsidy = userPaid * 1.5)
  // Capped at 200 THB daily max limit
  const estimatedSubsidy = amount * 1.5;
  return Math.min(estimatedSubsidy, CO_PAY_DAILY_MAX_SUBSIDY);
}

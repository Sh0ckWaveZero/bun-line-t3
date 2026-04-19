/**
 * Pure helper functions สำหรับระบบรายรับรายจ่าย
 */

import type {
  MonthlySummary,
  CategorySummary,
  TransactionWithCategory,
} from "../types";

// ─────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────

/** แปลง Date เป็น YYYY-MM-DD */
export function toTransDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** แปลง YYYY-MM-DD หรือ Date เป็น YYYY-MM */
export function toTransMonth(value: Date | string = new Date()): string {
  if (typeof value === "string") {
    return value.slice(0, 7);
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** แปลง YYYY-MM เป็น "เดือน ปีพ.ศ." เช่น "เมษายน 2568" */
export function formatMonthThai(transMonth: string): string {
  const [yearStr, monthStr] = transMonth.split("-");
  const year = parseInt(yearStr ?? "2024", 10);
  const month = parseInt(monthStr ?? "1", 10);

  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const buddhistYear = year + 543;
  return `${monthNames[month - 1] ?? ""} ${buddhistYear}`;
}

/** ดึงเดือนปัจจุบัน YYYY-MM */
export function getCurrentMonth(): string {
  return toTransMonth(new Date());
}

/** เดินหน้า/ถอยหลังเดือน */
export function shiftMonth(transMonth: string, delta: number): string {
  const [yearStr, monthStr] = transMonth.split("-");
  const date = new Date(
    parseInt(yearStr ?? "2024", 10),
    parseInt(monthStr ?? "1", 10) - 1 + delta,
    1,
  );
  return toTransMonth(date);
}

/** สร้าง list ของ YYYY-MM ย้อนหลัง N เดือน */
export function getPastMonths(n: number, from?: string): string[] {
  const base = from ?? getCurrentMonth();
  return Array.from({ length: n }, (_, i) => shiftMonth(base, -i));
}

// ─────────────────────────────────────────────
// Amount helpers
// ─────────────────────────────────────────────

/** Format เงินเป็นรูปแบบไทย เช่น "1,234.50 บาท" */
export function formatAmountThai(amount: number): string {
  return `${amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
}

/** Format เงินสั้นๆ เช่น "1,234.50" */
export function formatAmount(amount: number): string {
  return amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─────────────────────────────────────────────
// Summary helpers
// ─────────────────────────────────────────────

/**
 * คำนวณ MonthlySummary จากรายการ transactions ใน memory
 * (ใช้ใน unit tests / client-side aggregation)
 */
export function computeMonthlySummary(
  transMonth: string,
  transactions: TransactionWithCategory[],
): MonthlySummary {
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);

  return {
    transMonth,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: transactions.length,
  };
}

/**
 * คำนวณ CategorySummary จากรายการ transactions
 */
export function computeCategorySummary(
  transactions: TransactionWithCategory[],
): CategorySummary[] {
  const incomeTotal = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, t) => acc + t.amount, 0);

  const expenseTotal = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);

  const map = new Map<string, CategorySummary>();

  for (const tx of transactions) {
    const existing = map.get(tx.categoryId);
    const grandTotal = tx.type === "INCOME" ? incomeTotal : expenseTotal;

    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
      existing.percentage =
        grandTotal > 0 ? (existing.total / grandTotal) * 100 : 0;
    } else {
      map.set(tx.categoryId, {
        categoryId: tx.categoryId,
        categoryName: tx.category.name,
        icon: tx.category.icon,
        color: tx.category.color,
        type: tx.type,
        total: tx.amount,
        count: 1,
        percentage: grandTotal > 0 ? (tx.amount / grandTotal) * 100 : 0,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

/** parse comma-separated tags เป็น array */
export function parseTags(tags?: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** รวม tags array เป็น string */
export function joinTags(tags: string[]): string {
  return tags.join(",");
}

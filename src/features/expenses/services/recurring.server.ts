/**
 * Recurring Transaction Service
 *
 * Manage recurring transactions (auto-create on schedule)
 * Server-only — ห้าม import ใน client components
 */

import { db } from "@/lib/database/index";
import type { RecurringTransaction, RecurringFrequency } from "@prisma/client";
import { toTransDate, toTransMonth } from "../helpers";
import type { TransactionWithCategory } from "../types";

export type RecurringWithCategory = RecurringTransaction & {
  category: ExpenseCategory;
};

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/** ดึง recurring transactions ทั้งหมดของ user */
export async function getRecurringTransactions(
  userId: string,
  activeOnly = true,
): Promise<RecurringWithCategory[]> {
  const rows = await db.recurringTransaction.findMany({
    where: {
      userId,
      ...(activeOnly && { isActive: true }),
    },
    include: { category: true },
    orderBy: { nextRunDate: "asc" },
  });
  return rows as RecurringWithCategory[];
}

/** ดึง recurring transaction เดียวตาม id */
export async function getRecurringById(
  id: string,
  userId: string,
): Promise<RecurringWithCategory | null> {
  const row = await db.recurringTransaction.findFirst({
    where: { id, userId },
    include: { category: true },
  });
  return row as RecurringWithCategory | null;
}

/** ดึง recurring transactions ที่ควร run วันนี้ */
export async function getDueRecurringTransactions(
  forDate: string = toTransDate(),
): Promise<RecurringWithCategory[]> {
  const rows = await db.recurringTransaction.findMany({
    where: {
      isActive: true,
      nextRunDate: { lte: forDate },
    },
    include: { category: true },
  });
  return rows as RecurringWithCategory[];
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/**
 * สร้าง recurring transaction ใหม่
 * คำนวณ nextRunDate อัตโนมัติจากวันนี้
 */
export async function createRecurringTransaction(input: {
  userId: string;
  categoryId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  note?: string | null;
  tags?: string | null;
  frequency: RecurringFrequency;
  dayOfMonth?: number | null;
  dayOfWeek?: number | null;
}): Promise<RecurringWithCategory> {
  const nextRunDate = calculateNextRunDate(
    input.frequency,
    input.dayOfMonth,
    input.dayOfWeek,
  );

  const row = await db.recurringTransaction.create({
    data: {
      userId: input.userId,
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      note: input.note,
      tags: input.tags,
      frequency: input.frequency,
      dayOfMonth: input.dayOfMonth,
      dayOfWeek: input.dayOfWeek,
      nextRunDate,
    },
    include: { category: true },
  });

  return row as RecurringWithCategory;
}

/** อัปเดต recurring transaction */
export async function updateRecurringTransaction(
  id: string,
  userId: string,
  input: {
    amount?: number;
    note?: string | null;
    tags?: string | null;
    frequency?: RecurringFrequency;
    dayOfMonth?: number | null;
    dayOfWeek?: number | null;
    isActive?: boolean;
  },
): Promise<RecurringWithCategory> {
  // ถ้าเปลี่ยน frequency หรือ day → คำนวณ nextRunDate ใหม่
  let nextRunDate: string | undefined;
  if (
    input.frequency !== undefined ||
    input.dayOfMonth !== undefined ||
    input.dayOfWeek !== undefined
  ) {
    const existing = await getRecurringById(id, userId);
    if (existing) {
      const frequency = input.frequency ?? existing.frequency;
      const dayOfMonth = input.dayOfMonth ?? existing.dayOfMonth;
      const dayOfWeek = input.dayOfWeek ?? existing.dayOfWeek;
      nextRunDate = calculateNextRunDate(frequency, dayOfMonth, dayOfWeek);
    }
  }

  const row = await db.recurringTransaction.update({
    where: { id, userId },
    data: {
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.note !== undefined && { note: input.note }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.frequency !== undefined && { frequency: input.frequency }),
      ...(input.dayOfMonth !== undefined && { dayOfMonth: input.dayOfMonth }),
      ...(input.dayOfWeek !== undefined && { dayOfWeek: input.dayOfWeek }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(nextRunDate && { nextRunDate }),
    },
    include: { category: true },
  });

  return row as RecurringWithCategory;
}

/** ลบ recurring transaction (soft delete) */
export async function deactivateRecurringTransaction(
  id: string,
  userId: string,
): Promise<void> {
  await db.recurringTransaction.update({
    where: { id, userId },
    data: { isActive: false },
  });
}

// ─────────────────────────────────────────────
// Recurring Execution (สำหรับ Cron Job)
// ─────────────────────────────────────────────

/**
 * Execute recurring transaction → สร้าง transaction จริง
 * และอัปเดต nextRunDate ครั้งต่อไป
 */
export async function executeRecurringTransaction(
  recurringId: string,
): Promise<TransactionWithCategory | null> {
  const recurring = await db.recurringTransaction.findUnique({
    where: { id: recurringId },
    include: { category: true },
  });

  if (!recurring || !recurring.isActive) {
    return null;
  }

  // สร้าง transaction จริง
  const transaction = await db.transaction.create({
    data: {
      userId: recurring.userId,
      categoryId: recurring.categoryId,
      type: recurring.type,
      amount: recurring.amount,
      note: recurring.note,
      tags: recurring.tags,
      transDate: recurring.nextRunDate,
      transMonth: toTransMonth(new Date(recurring.nextRunDate)),
    },
    include: { category: true },
  });

  // คำนวณ nextRunDate ครั้งต่อไป
  const nextRunDate = calculateNextRunDate(
    recurring.frequency,
    recurring.dayOfMonth,
    recurring.dayOfWeek,
    recurring.nextRunDate,
  );

  // อัปเดต recurring transaction
  await db.recurringTransaction.update({
    where: { id: recurringId },
    data: {
      lastRunDate: recurring.nextRunDate,
      nextRunDate,
    },
  });

  return transaction as TransactionWithCategory;
}

/**
 * Execute all due recurring transactions
 * ให้ cron job รันวันละครั้ง
 */
export async function executeDueRecurringTransactions(): Promise<{
  executed: number;
  transactions: TransactionWithCategory[];
  errors: Array<{ id: string; error: string }>;
}> {
  const dueTransactions = await getDueRecurringTransactions();

  const results: TransactionWithCategory[] = [];
  const errors: Array<{ id: string; error: string }> = [];

  for (const recurring of dueTransactions) {
    try {
      const tx = await executeRecurringTransaction(recurring.id);
      if (tx) {
        results.push(tx);
      }
    } catch (error) {
      errors.push({
        id: recurring.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    executed: results.length,
    transactions: results,
    errors,
  };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * คำนวณ next run date จาก frequency และ day config
 *
 * @param frequency - DAILY, WEEKLY, MONTHLY, YEARLY
 * @param dayOfMonth - วันที่ในเดือน (1-31) สำหรับ MONTHLY
 * @param dayOfWeek - วันในสัปดาห์ (0=อาทิตย์) สำหรับ WEEKLY
 * @param fromDate - วันที่เริ่มคำนวณ (default = วันนี้)
 */
function calculateNextRunDate(
  frequency: RecurringFrequency,
  dayOfMonth: number | null | undefined,
  dayOfWeek: number | null | undefined,
  fromDate?: string,
): string {
  const from = fromDate ? new Date(fromDate) : new Date();
  let next = new Date(from);

  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;

    case "WEEKLY":
      if (dayOfWeek === null || dayOfWeek === undefined) {
        // Default: สัปดาห์หน้าวันเดียวกัน
        next.setDate(next.getDate() + 7);
      } else {
        const currentDay = next.getDay();
        const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
        next.setDate(next.getDate() + daysUntil);
      }
      break;

    case "MONTHLY":
      if (dayOfMonth === null || dayOfMonth === undefined) {
        // Default: เดือนหน้าวันที่ 1
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
      } else {
        const targetDay = Math.min(dayOfMonth, 31); // Cap at 31
        next.setMonth(next.getMonth() + 1);
        next.setDate(targetDay);
      }
      break;

    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return toTransDate(next);
}

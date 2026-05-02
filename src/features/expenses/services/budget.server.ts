/**
 * Budget Service
 *
 * Manage monthly budgets per category
 * Server-only — ห้าม import ใน client components
 */

import { db } from "@/lib/database/index";
import type { Budget, ExpenseCategory } from "@prisma/client";

export type BudgetWithCategory = Budget & {
  category: ExpenseCategory | null;
};

export type BudgetUsage = {
  budget: BudgetWithCategory;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
};

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/** ดึง budgets ทั้งหมดของ user พร้อม category */
export async function getBudgetsByUser(
  userId: string,
): Promise<BudgetWithCategory[]> {
  const rows = await db.budget.findMany({
    where: { userId, isActive: true },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });
  return rows as BudgetWithCategory[];
}

/** ดึง budget เดียวตาม id + ตรวจสิทธิ์ */
export async function getBudgetById(
  id: string,
  userId: string,
): Promise<BudgetWithCategory | null> {
  const row = await db.budget.findFirst({
    where: { id, userId },
    include: { category: true },
  });
  return row as BudgetWithCategory | null;
}

/** ดึง budget ตาม categoryId */
export async function getBudgetByCategory(
  userId: string,
  categoryId: string,
): Promise<BudgetWithCategory | null> {
  const row = await db.budget.findFirst({
    where: { userId, categoryId },
    include: { category: true },
  });
  return row as BudgetWithCategory | null;
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/** สร้าง budget ใหม่ */
export async function createBudget(input: {
  userId: string;
  categoryId?: string | null;
  type: "INCOME" | "EXPENSE";
  amount: number;
  alertAt?: number;
  tags?: string | null;
}): Promise<BudgetWithCategory> {
  const row = await db.budget.create({
    data: {
      userId: input.userId,
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      alertAt: input.alertAt ?? 80,
      tags: input.tags,
    },
    include: { category: true },
  });
  return row as BudgetWithCategory;
}

/** อัปเดต budget */
export async function updateBudget(
  id: string,
  userId: string,
  input: {
    amount?: number;
    alertAt?: number;
    isActive?: boolean;
    tags?: string | null;
  },
): Promise<BudgetWithCategory> {
  const row = await db.budget.update({
    where: { id, userId },
    data: {
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.alertAt !== undefined && { alertAt: input.alertAt }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.tags !== undefined && { tags: input.tags }),
    },
    include: { category: true },
  });
  return row as BudgetWithCategory;
}

/** ลบ budget (soft delete) */
export async function deactivateBudget(
  id: string,
  userId: string,
): Promise<void> {
  await db.budget.update({
    where: { id, userId },
    data: { isActive: false },
  });
}

// ─────────────────────────────────────────────
// Budget Usage Analysis
// ─────────────────────────────────────────────

/**
 * คำนวณการใช้งบของทุก budgets ในเดือนที่กำหนด
 * เอาไปใช้แสดง status และแจ้งเตือน
 */
export async function getBudgetUsage(
  userId: string,
  transMonth: string,
): Promise<BudgetUsage[]> {
  const budgets = await getBudgetsByUser(userId);

  if (budgets.length === 0) return [];

  const usages: BudgetUsage[] = [];

  for (const budget of budgets) {
    // ดึง transactions ในเดือนนี้สำหรับ budget นี้
    const transactions = await db.transaction.findMany({
      where: {
        userId,
        transMonth,
        type: budget.type,
        ...(budget.categoryId && { categoryId: budget.categoryId }),
      },
    });

    const spent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const isOverBudget = spent > budget.amount;
    const isNearLimit = percentage >= budget.alertAt;

    usages.push({
      budget,
      spent,
      remaining,
      percentage,
      isOverBudget,
      isNearLimit,
    });
  }

  return usages;
}

/**
 * หา budgets ที่ใกล้หรือเกิน limit สำหรับแจ้งเตือน
 */
export async function getAlertableBudgets(
  userId: string,
  transMonth: string,
): Promise<BudgetUsage[]> {
  const usages = await getBudgetUsage(userId, transMonth);
  return usages.filter(
    (u) => u.isNearLimit || u.isOverBudget,
  );
}

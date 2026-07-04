/**
 * Savings Goal Service
 *
 * Manage savings goals with progress tracking
 * Server-only — ห้าม import ใน client components
 */

import { db } from "@/lib/database/index";
import type { SavingsGoal } from "@prisma/client";
import { toNum } from "./decimal";

/**
 * SavingsGoal ที่ส่งออกจาก service layer
 * targetAmount/savedAmount เป็น number (แปลงจาก Decimal แล้ว)
 */
export interface SavingsGoalModel {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  targetAmount: number;
  savedAmount: number;
  deadline: string | null;
  tags: string | null;
  isCompleted: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SavingsGoalWithProgress = SavingsGoalModel & {
  progressPercentage: number;
  remainingAmount: number;
  daysUntilDeadline: number | null;
  isCompleted: boolean;
};

/** แปลง Prisma SavingsGoal row → SavingsGoalModel (Decimal → number) */
function mapGoal(goal: SavingsGoal): SavingsGoalModel {
  return {
    id: goal.id,
    userId: goal.userId,
    name: goal.name,
    icon: goal.icon,
    targetAmount: toNum(goal.targetAmount),
    savedAmount: toNum(goal.savedAmount),
    deadline: goal.deadline,
    tags: goal.tags,
    isCompleted: goal.isCompleted,
    isActive: goal.isActive,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/** ดึง savings goals ทั้งหมดของ user พร้อม calculate progress */
export async function getSavingsGoals(
  userId: string,
  activeOnly = true,
): Promise<SavingsGoalWithProgress[]> {
  const goals = await db.savingsGoal.findMany({
    where: {
      userId,
      ...(activeOnly && { isActive: true }),
    },
    orderBy: { createdAt: "asc" },
  });

  return goals.map(mapGoal).map(calculateProgress);
}

/** ดึง savings goal เดียวตาม id + ตรวจสิทธิ์ */
export async function getSavingsGoalById(
  id: string,
  userId: string,
): Promise<SavingsGoalWithProgress | null> {
  const goal = await db.savingsGoal.findFirst({
    where: { id, userId },
  });

  return goal ? calculateProgress(mapGoal(goal)) : null;
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/** สร้าง savings goal ใหม่ */
export async function createSavingsGoal(input: {
  userId: string;
  name: string;
  icon?: string | null;
  targetAmount: number;
  deadline?: string | null;
  tags?: string | null;
}): Promise<SavingsGoalWithProgress> {
  const goal = await db.savingsGoal.create({
    data: {
      userId: input.userId,
      name: input.name,
      icon: input.icon,
      targetAmount: input.targetAmount,
      savedAmount: 0,
      deadline: input.deadline,
      tags: input.tags,
      isCompleted: false,
      isActive: true,
    },
  });

  return calculateProgress(mapGoal(goal));
}

/** อัปเดต savings goal */
export async function updateSavingsGoal(
  id: string,
  userId: string,
  input: {
    name?: string;
    icon?: string | null;
    targetAmount?: number;
    savedAmount?: number;
    deadline?: string | null;
    tags?: string | null;
    isCompleted?: boolean;
    isActive?: boolean;
  },
): Promise<SavingsGoalWithProgress> {
  const goal = await db.savingsGoal.update({
    where: { id, userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.targetAmount !== undefined && {
        targetAmount: input.targetAmount,
      }),
      ...(input.savedAmount !== undefined && {
        savedAmount: input.savedAmount,
      }),
      ...(input.deadline !== undefined && { deadline: input.deadline }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.isCompleted !== undefined && {
        isCompleted: input.isCompleted,
      }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });

  return calculateProgress(mapGoal(goal));
}

/** เพิ่มยอดออม (+/-) */
export async function adjustSavingsAmount(
  id: string,
  userId: string,
  amount: number,
): Promise<SavingsGoalWithProgress> {
  const goal = await db.savingsGoal.findFirst({
    where: { id, userId },
  });

  if (!goal) {
    throw new Error("Savings goal not found");
  }

  // แปลง Decimal → number ก่อน arithmetic
  const currentSaved = toNum(goal.savedAmount);
  const target = toNum(goal.targetAmount);
  const newAmount = Math.max(0, currentSaved + amount);
  const isCompleted = newAmount >= target;

  const updated = await db.savingsGoal.update({
    where: { id },
    data: {
      savedAmount: newAmount,
      isCompleted,
    },
  });

  return calculateProgress(mapGoal(updated));
}

/** ลบ savings goal (soft delete) */
export async function deactivateSavingsGoal(
  id: string,
  userId: string,
): Promise<void> {
  await db.savingsGoal.update({
    where: { id, userId },
    data: { isActive: false },
  });
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** คำนวณ progress และข้อมูลเพิ่มเติม */
function calculateProgress(goal: SavingsGoalModel): SavingsGoalWithProgress {
  const progressPercentage =
    goal.targetAmount > 0
      ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
      : 0;
  const remainingAmount = Math.max(goal.targetAmount - goal.savedAmount, 0);

  let daysUntilDeadline: number | null = null;
  if (goal.deadline) {
    const deadline = new Date(goal.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    ...goal,
    progressPercentage,
    remainingAmount,
    daysUntilDeadline,
    isCompleted: goal.savedAmount >= goal.targetAmount,
  };
}

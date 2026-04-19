/**
 * Service สำหรับจัดการ ExpenseCategory (CRUD)
 * Server-only — ห้าม import ใน client components
 */

import { db } from "@/lib/database";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ExpenseCategory,
} from "../types";
import { DEFAULT_CATEGORIES } from "../constants";

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/** ดึง categories ทั้งหมดของ user (active เท่านั้น) */
export async function getCategoriesByUser(
  userId: string,
): Promise<ExpenseCategory[]> {
  return db.expenseCategory.findMany({
    where: { userId, isActive: true },
    orderBy: { name: "asc" },
  }) as Promise<ExpenseCategory[]>;
}

/** ดึง category เดียวตาม id + ตรวจสิทธิ์ user */
export async function getCategoryById(
  id: string,
  userId: string,
): Promise<ExpenseCategory | null> {
  return db.expenseCategory.findFirst({
    where: { id, userId },
  }) as Promise<ExpenseCategory | null>;
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/** สร้าง category ใหม่ */
export async function createCategory(
  input: CreateCategoryInput,
): Promise<ExpenseCategory> {
  return db.expenseCategory.create({
    data: {
      userId: input.userId,
      name: input.name,
      icon: input.icon ?? null,
      color: input.color ?? null,
      isDefault: input.isDefault ?? false,
    },
  }) as Promise<ExpenseCategory>;
}

/** อัปเดต category */
export async function updateCategory(
  id: string,
  userId: string,
  input: UpdateCategoryInput,
): Promise<ExpenseCategory> {
  return db.expenseCategory.update({
    where: { id, userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  }) as Promise<ExpenseCategory>;
}

/** Soft-delete category (ปิดใช้งาน) */
export async function deactivateCategory(
  id: string,
  userId: string,
): Promise<void> {
  await db.expenseCategory.update({
    where: { id, userId },
    data: { isActive: false },
  });
}

// ─────────────────────────────────────────────
// Seed helpers
// ─────────────────────────────────────────────

/**
 * สร้าง default categories สำหรับ user ใหม่
 * เติมหมวดหมู่เริ่มต้นที่ยังไม่มี เพื่อให้ user เห็นหมวดพื้นฐานเสมอ
 */
export async function seedDefaultCategories(userId: string): Promise<void> {
  const existing = await db.expenseCategory.findMany({
    where: { userId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((c) => c.name));

  const rows = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.name)).map(
    (c) => ({
      userId,
      name: c.name,
      icon: c.icon,
      color: c.color,
      isDefault: true,
    }),
  );

  if (rows.length === 0) return;
  await db.expenseCategory.createMany({ data: rows });
}

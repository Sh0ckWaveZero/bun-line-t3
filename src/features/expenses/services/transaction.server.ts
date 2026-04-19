/**
 * Service สำหรับจัดการ Transaction (CRUD + Summary)
 * Server-only — ห้าม import ใน client components
 */

import { db } from "@/lib/database"
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionWithCategory,
  MonthlySummary,
  CategorySummary,
  TransactionFilter,
} from "../types"
import { toTransMonth } from "../helpers"

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/** ดึง transactions ตาม filter พร้อม category */
export async function getTransactions(
  filter: TransactionFilter,
): Promise<TransactionWithCategory[]> {
  const {
    userId,
    transMonth,
    type,
    categoryId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filter

  const rows = await db.transaction.findMany({
    where: {
      userId,
      ...(transMonth && { transMonth }),
      ...(type && { type }),
      ...(categoryId && { categoryId }),
      ...(startDate && { transDate: { gte: startDate } }),
      ...(endDate && { transDate: { lte: endDate } }),
    },
    include: { category: true },
    orderBy: [{ transDate: "desc" }, { createdAt: "desc" }],
    take: limit,
    skip: offset,
  })

  return rows as TransactionWithCategory[]
}

/** ดึง transaction เดียวตาม id + ตรวจสิทธิ์ */
export async function getTransactionById(
  id: string,
  userId: string,
): Promise<TransactionWithCategory | null> {
  const row = await db.transaction.findFirst({
    where: { id, userId },
    include: { category: true },
  })
  return row as TransactionWithCategory | null
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/** สร้าง transaction ใหม่ */
export async function createTransaction(
  input: CreateTransactionInput,
): Promise<TransactionWithCategory> {
  const transMonth = toTransMonth(input.transDate)

  const row = await db.transaction.create({
    data: {
      userId: input.userId,
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      note: input.note ?? null,
      tags: input.tags ?? null,
      transDate: input.transDate,
      transMonth,
    },
    include: { category: true },
  })

  return row as TransactionWithCategory
}

/** อัปเดต transaction */
export async function updateTransaction(
  id: string,
  userId: string,
  input: UpdateTransactionInput,
): Promise<TransactionWithCategory> {
  const transMonth = input.transDate ? toTransMonth(input.transDate) : undefined

  const row = await db.transaction.update({
    where: { id, userId },
    data: {
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.note !== undefined && { note: input.note }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.transDate !== undefined && { transDate: input.transDate }),
      ...(transMonth !== undefined && { transMonth }),
    },
    include: { category: true },
  })

  return row as TransactionWithCategory
}

/** ลบ transaction (hard delete) */
export async function deleteTransaction(id: string, userId: string): Promise<void> {
  await db.transaction.delete({ where: { id, userId } })
}

// ─────────────────────────────────────────────
// Aggregation / Summary (คำนวณฝั่ง DB)
// ─────────────────────────────────────────────

/** สรุปรายรับ-รายจ่ายรายเดือน */
export async function getMonthlySummary(
  userId: string,
  transMonth: string,
): Promise<MonthlySummary> {
  const [incomeAgg, expenseAgg, count] = await Promise.all([
    db.transaction.aggregate({
      where: { userId, transMonth, type: "INCOME" },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { userId, transMonth, type: "EXPENSE" },
      _sum: { amount: true },
    }),
    db.transaction.count({ where: { userId, transMonth } }),
  ])

  const totalIncome = incomeAgg._sum.amount ?? 0
  const totalExpense = expenseAgg._sum.amount ?? 0

  return {
    transMonth,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: count,
  }
}

/** สรุปตามหมวดหมู่ของเดือนที่กำหนด */
export async function getCategorySummary(
  userId: string,
  transMonth: string,
): Promise<CategorySummary[]> {
  // ดึง transactions พร้อม category ในเดือนนั้น แล้ว aggregate ใน TypeScript
  // หลีกเลี่ยง groupBy เพื่อ type safety ที่ดีกว่า
  const rows = await db.transaction.findMany({
    where: { userId, transMonth },
    include: { category: true },
    orderBy: { transDate: "desc" },
  })

  if (rows.length === 0) return []

  // คำนวณ grand totals ก่อน
  type TxRow = (typeof rows)[number]
  const incomeTotal = rows
    .filter((r: TxRow) => r.type === "INCOME")
    .reduce((acc: number, r: TxRow) => acc + r.amount, 0)
  const expenseTotal = rows
    .filter((r: TxRow) => r.type === "EXPENSE")
    .reduce((acc: number, r: TxRow) => acc + r.amount, 0)

  // Group in-memory
  const map = new Map<string, CategorySummary>()

  for (const r of rows) {
    const key = `${r.categoryId}::${r.type}`
    const existing = map.get(key)
    const grandTotal = r.type === "INCOME" ? incomeTotal : expenseTotal

    if (existing) {
      existing.total += r.amount
      existing.count += 1
      existing.percentage = grandTotal > 0 ? (existing.total / grandTotal) * 100 : 0
    } else {
      map.set(key, {
        categoryId: r.categoryId,
        categoryName: r.category.name,
        icon: r.category.icon ?? null,
        color: r.category.color ?? null,
        type: r.type as "INCOME" | "EXPENSE",
        total: r.amount,
        count: 1,
        percentage: grandTotal > 0 ? (r.amount / grandTotal) * 100 : 0,
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

/** สรุปย้อนหลัง N เดือน (ใช้ใน chart) */
export async function getMultiMonthSummary(
  userId: string,
  months: string[],
): Promise<MonthlySummary[]> {
  return Promise.all(months.map((m) => getMonthlySummary(userId, m)))
}

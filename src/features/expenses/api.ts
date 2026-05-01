import type {
  CategorySummary,
  ExpenseCategory,
  MonthlySummary,
  TransactionWithCategory,
} from "./types"

const NO_CACHE: RequestInit = { cache: "no-store" }

export async function fetchTransactions(
  transMonth: string,
): Promise<TransactionWithCategory[]> {
  const res = await fetch(`/api/expenses?transMonth=${transMonth}&limit=100`, NO_CACHE)
  if (!res.ok) throw new Error("ไม่สามารถดึงรายการได้")
  const json = (await res.json()) as { data: TransactionWithCategory[] }
  return json.data
}

export interface ExpenseOverview {
  transactions: TransactionWithCategory[]
  summary: MonthlySummary
  categorySummary: CategorySummary[]
  categories: ExpenseCategory[]
  hideAmountsWeb: boolean
}

export async function fetchExpenseOverview(
  transMonth: string,
): Promise<ExpenseOverview> {
  const res = await fetch(`/api/expenses/overview?transMonth=${transMonth}&limit=100`, NO_CACHE)
  if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลรายรับรายจ่ายได้")
  const json = (await res.json()) as { data: ExpenseOverview }
  return json.data
}

export async function fetchSummary(
  transMonth: string,
): Promise<{ summary: MonthlySummary; categories: CategorySummary[] }> {
  const res = await fetch(`/api/expenses/summary?transMonth=${transMonth}`, NO_CACHE)
  if (!res.ok) throw new Error("ไม่สามารถดึงสรุปได้")
  const json = (await res.json()) as {
    data: { summary: MonthlySummary; categories: CategorySummary[] }
  }
  return json.data
}

export async function fetchCategories(): Promise<ExpenseCategory[]> {
  const res = await fetch("/api/expenses/categories", NO_CACHE)
  if (!res.ok) throw new Error("ไม่สามารถดึงหมวดหมู่ได้")
  const json = (await res.json()) as { data: ExpenseCategory[] }
  return json.data
}

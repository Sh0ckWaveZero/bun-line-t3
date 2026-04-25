import type {
  CategorySummary,
  ExpenseCategory,
  MonthlySummary,
  TransactionWithCategory,
} from "./types"

export async function fetchTransactions(
  transMonth: string,
): Promise<TransactionWithCategory[]> {
  const res = await fetch(`/api/expenses?transMonth=${transMonth}&limit=100`)
  if (!res.ok) throw new Error("ไม่สามารถดึงรายการได้")
  const json = (await res.json()) as { data: TransactionWithCategory[] }
  return json.data
}

export async function fetchSummary(
  transMonth: string,
): Promise<{ summary: MonthlySummary; categories: CategorySummary[] }> {
  const res = await fetch(`/api/expenses/summary?transMonth=${transMonth}`)
  if (!res.ok) throw new Error("ไม่สามารถดึงสรุปได้")
  const json = (await res.json()) as {
    data: { summary: MonthlySummary; categories: CategorySummary[] }
  }
  return json.data
}

export async function fetchCategories(): Promise<ExpenseCategory[]> {
  const res = await fetch("/api/expenses/categories")
  if (!res.ok) throw new Error("ไม่สามารถดึงหมวดหมู่ได้")
  const json = (await res.json()) as { data: ExpenseCategory[] }
  return json.data
}

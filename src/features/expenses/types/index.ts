/**
 * ไทป์และอินเทอร์เฟซสำหรับระบบบันทึกรายรับรายจ่าย
 */

export type TransactionType = "INCOME" | "EXPENSE";

// ─────────────────────────────────────────────
// ExpenseCategory
// ─────────────────────────────────────────────

export interface ExpenseCategory {
  id: string;
  userId: string;
  name: string;
  icon?: string | null; // emoji เช่น "🍔", "🏠"
  color?: string | null; // hex เช่น "#FF5733"
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean;
}

// ─────────────────────────────────────────────
// Transaction
// ─────────────────────────────────────────────

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: number; // THB
  note?: string | null;
  tags?: string | null; // comma-separated
  transDate: string; // YYYY-MM-DD
  transMonth: string; // YYYY-MM
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionWithCategory extends Transaction {
  category: ExpenseCategory;
}

export interface CreateTransactionInput {
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  note?: string;
  tags?: string;
  transDate: string; // YYYY-MM-DD
}

export interface UpdateTransactionInput {
  categoryId?: string;
  amount?: number;
  note?: string | null;
  tags?: string | null;
  transDate?: string;
}

// ─────────────────────────────────────────────
// Summary / Aggregated
// ─────────────────────────────────────────────

/** สรุปรายรับ-รายจ่ายรายเดือน */
export interface MonthlySummary {
  transMonth: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  balance: number; // income - expense
  transactionCount: number;
}

/** สรุปตามหมวดหมู่ */
export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  icon?: string | null;
  color?: string | null;
  type: TransactionType;
  total: number;
  count: number;
  percentage: number; // % ของ income หรือ expense รวม
}

/** สรุปทั้งปีรายเดือน */
export interface YearlySummary {
  year: number;
  months: MonthlySummary[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

/** Query filter สำหรับ list transactions */
export interface TransactionFilter {
  userId: string;
  transMonth?: string; // YYYY-MM
  type?: TransactionType;
  categoryId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  limit?: number;
  offset?: number;
}

"use client";

import { SummaryCard } from "@/features/expenses/components/SummaryCard";
import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import { BudgetOverviewCard } from "@/features/expenses/components/BudgetOverviewCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TRANSACTION_TABS } from "@/features/expenses/constants";
import { useExpenseCategories } from "@/features/expenses/hooks/useExpenseCategories";
import { useExpenseTransactions } from "@/features/expenses/hooks/useExpenseTransactions";
import { useMonthlyCharts } from "@/features/expenses/hooks/useMonthlyCharts";
import { useMonthNavigation } from "@/features/expenses/hooks/useMonthNavigation";
import { useCategoryModalFlow } from "@/features/expenses/hooks/useCategoryModalFlow";
import { useTransactionModal } from "@/features/expenses/hooks/useTransactionModal";
import { useExpensePageUI } from "@/features/expenses/hooks/useExpensePageUI";
import { useBudgets } from "@/features/expenses/hooks/useBudgets";
import { formatMonthThai, getCurrentMonth } from "@/features/expenses/helpers";
import { useSession } from "@/lib/auth/client";
import { lazy, Suspense, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Tag,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

const ExpenseDonutChart = lazy(async () => {
  const module = await import("@/features/expenses/components/ExpenseDonutChart");
  return { default: module.ExpenseDonutChart };
});

const MonthlyBarChart = lazy(async () => {
  const module = await import("@/features/expenses/components/MonthlyBarChart");
  return { default: module.MonthlyBarChart };
});

const AddTransactionModal = lazy(async () => {
  const module = await import("@/features/expenses/components/AddTransactionModal");
  return { default: module.AddTransactionModal };
});

const CategoryManagerModal = lazy(async () => {
  const module = await import("@/features/expenses/components/CategoryManagerModal");
  return { default: module.CategoryManagerModal };
});

const AddCategoryModal = lazy(async () => {
  const module = await import("@/features/expenses/components/AddCategoryModal");
  return { default: module.AddCategoryModal };
});

const BudgetSettingsModal = lazy(async () => {
  const module = await import("@/features/expenses/components/BudgetSettingsModal");
  return { default: module.BudgetSettingsModal };
});

export function ExpensesPage() {
  const { data: session } = useSession();
  const isAuthed = !!session?.user;

  const { currentMonth, prevMonth, nextMonth } = useMonthNavigation();

  const {
    transactions,
    summary,
    categorySummary,
    isLoading: txLoading,
    refetch: refetchTx,
    isSaving: txSaving,
    categories,
    hideAmountsWeb,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useExpenseTransactions(currentMonth, isAuthed);

  const {
    isSaving: catSaving,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useExpenseCategories(false, () => void refetchTx());

  const { hideAmounts, showCharts, exporting, toggleHideAmounts, toggleCharts, handleExport } =
    useExpensePageUI({
      transactions,
      summary,
      currentMonth,
      initialHideAmounts: hideAmountsWeb,
    });

  const { multiMonthSummaries } = useMonthlyCharts(currentMonth, isAuthed && showCharts);

  const { budgets, createBudget, updateBudget, deleteBudget } = useBudgets(currentMonth, isAuthed);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const txModal = useTransactionModal({ createTransaction, updateTransaction, deleteTransaction });
  const catFlow = useCategoryModalFlow({
    createCategory,
    updateCategory,
    deleteCategory,
    onReturnToAddTransaction: txModal.openAdd,
  });

  return (
    <div id="expenses-page" className="bg-background min-h-screen w-full">
      <div className="container mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">

        <div className="border-border/70 bg-card/80 dark:bg-card/65 mb-6 overflow-hidden rounded-lg border p-4 sm:mb-8 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="border-primary/20 bg-primary/10 text-primary mb-2 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium">
                <Wallet className="h-3.5 w-3.5" />
                Expense Tracker
              </div>
              <h1 className="text-foreground text-2xl font-bold sm:text-3xl">รายรับรายจ่าย</h1>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm">บันทึกและติดตามการเงินของคุณ</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleHideAmounts} aria-label={hideAmounts ? "แสดงจำนวนเงิน" : "ซ่อนจำนวนเงิน"}>
                {hideAmounts ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
              <Button variant="outline" size="sm" disabled={exporting || transactions.length === 0} onClick={handleExport} className="gap-2">
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => catFlow.setShowManagerModal(true)} className="gap-2">
                <Tag size={14} />
                <span className="hidden sm:inline">หมวดหมู่</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => void refetchTx()} disabled={txLoading} aria-label="รีเฟรชข้อมูล">
                <RefreshCw className={`h-4 w-4 ${txLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>

        <Card className="border-border/70 bg-card/85 dark:bg-card/70 mb-4 border sm:mb-6">
          <CardContent className="pointer-events-auto flex items-center justify-between p-3 sm:p-4">
            <Button variant="ghost" size="sm" onClick={prevMonth} aria-label="เดือนก่อน" className="hover:bg-muted h-8 w-8 rounded-lg sm:h-9 sm:w-9">
              <ChevronLeft size={18} />
            </Button>
            <span className="text-foreground text-sm font-semibold sm:text-base">{formatMonthThai(currentMonth)}</span>
            <Button variant="ghost" size="sm" onClick={nextMonth} disabled={currentMonth >= getCurrentMonth()} aria-label="เดือนหน้า" className="hover:bg-muted h-8 w-8 rounded-lg disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9">
              <ChevronRight size={18} />
            </Button>
          </CardContent>
        </Card>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryCard id="income" label="รายรับ" amount={summary?.totalIncome ?? 0} icon={<TrendingUp className="text-card-green h-4 w-4 sm:h-5 sm:w-5" />} iconBg="bg-card-green" hideAmounts={hideAmounts} />
          <SummaryCard id="expense" label="รายจ่าย" amount={summary?.totalExpense ?? 0} icon={<TrendingDown className="text-card-red h-4 w-4 sm:h-5 sm:w-5" />} iconBg="bg-card-red" hideAmounts={hideAmounts} />
          <SummaryCard id="balance" label="คงเหลือ" className="col-span-2 sm:col-span-1" amount={summary?.balance ?? 0}
            icon={<Wallet className={`h-4 w-4 sm:h-5 sm:w-5 ${summary && summary.balance >= 0 ? "text-card-blue" : "text-destructive"}`} />}
            iconBg={summary && summary.balance >= 0 ? "bg-card-blue" : "bg-destructive/10"} hideAmounts={hideAmounts}
          />
        </div>

        <div className="mb-6">
          <BudgetOverviewCard
            budgets={budgets}
            hideAmounts={hideAmounts}
            onManageBudgets={() => setShowBudgetModal(true)}
          />
        </div>

        <div className="mb-4 sm:mb-6">
          <button type="button" onClick={toggleCharts} className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between rounded-lg px-1 py-2 text-xs font-medium transition-colors">
            <span>กราฟสรุป</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${showCharts ? "rotate-180" : ""}`} />
          </button>
          {showCharts && (
            <div className="mt-2 space-y-3">
              <Suspense
                fallback={
                  <Card className="border-border/70 bg-card/85 dark:bg-card/70 border">
                    <CardContent className="text-muted-foreground flex items-center justify-center py-10">
                      <Loader2 size={20} className="animate-spin" />
                    </CardContent>
                  </Card>
                }
              >
                <ExpenseDonutChart data={categorySummary} hideAmounts={hideAmounts} />
                <MonthlyBarChart data={multiMonthSummaries} hideAmounts={hideAmounts} />
              </Suspense>
            </div>
          )}
        </div>

        <Tabs defaultValue="all">
          <TabsList className="border-border/50 bg-muted/50 mb-3 w-full border p-1 sm:mb-4">
            {TRANSACTION_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className={`flex-1 text-xs font-medium sm:text-sm ${tab === "EXPENSE" ? "text-card-red" : tab === "INCOME" ? "text-card-green" : ""}`}>
                {tab === "all" ? "ทั้งหมด" : tab === "EXPENSE" ? "รายจ่าย" : "รายรับ"}
              </TabsTrigger>
            ))}
          </TabsList>
          {TRANSACTION_TABS.map((tab) => {
            const list = tab === "all" ? transactions : transactions.filter((t) => t.type === tab);
            return (
              <TabsContent key={tab} value={tab} className="space-y-2 pb-24">
                {txLoading && <div className="text-muted-foreground flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin" /></div>}
                {!txLoading && list.length === 0 && (
                  <Card className="border-border/50 bg-card/60 dark:bg-card/45">
                    <CardContent className="text-muted-foreground py-12 text-center"><p className="text-sm">ยังไม่มีรายการ</p></CardContent>
                  </Card>
                )}
                <div className="space-y-2">
                  {list.map((tx) => <TransactionRow key={tx.id} tx={tx} onEdit={txModal.openEdit} onDelete={txModal.handleDelete} hideAmounts={hideAmounts} />)}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 sm:bottom-8">
        <Button onClick={txModal.openAdd} className="h-12 rounded-full bg-primary px-6 text-primary-foreground shadow-xl transition-all hover:scale-105 hover:bg-primary/90 sm:h-14">
          <Plus size={20} className="mr-2" />
          <span className="text-base font-semibold">เพิ่มรายการ</span>
        </Button>
      </div>

      <Suspense fallback={null}>
        {txModal.showModal && (
          <AddTransactionModal
            key={`transaction-${txModal.showModal ? "open" : "closed"}-${txModal.editingTx?.id ?? "new"}`}
            categories={categories} open={txModal.showModal}
            onOpenChange={(open) => { if (!open) txModal.close(); }}
            onSave={txModal.handleSave} isLoading={txSaving}
            onAddCategory={catFlow.openAddFromTransaction} editData={txModal.editingTx}
          />
        )}
        {catFlow.showManagerModal && (
          <CategoryManagerModal open={catFlow.showManagerModal} onOpenChange={catFlow.setShowManagerModal} categories={categories} onEdit={catFlow.openEdit} onDelete={catFlow.handleDelete} onAdd={catFlow.openAddFromManager} />
        )}
        {catFlow.showCategoryModal && (
          <AddCategoryModal
            key={`category-${catFlow.showCategoryModal ? "open" : "closed"}-${catFlow.editingCategory?.id ?? "new"}`}
            open={catFlow.showCategoryModal} onOpenChange={catFlow.handleCategoryModalOpenChange}
            onSave={catFlow.handleSave} isLoading={catSaving}
            editMode={!!catFlow.editingCategory} category={catFlow.editingCategory}
          />
        )}
        <BudgetSettingsModal
          open={showBudgetModal}
          onOpenChange={setShowBudgetModal}
          budgets={budgets.map((b) => b.budget)}
          categories={categories}
          onCreateBudget={async (data) => {
            await new Promise((resolve) => {
              createBudget(data, {
                onSuccess: () => resolve(undefined),
                onError: () => resolve(undefined),
              });
            });
          }}
          onUpdateBudget={async (id, data) => {
            await new Promise((resolve) => {
              updateBudget(id, data, {
                onSuccess: () => resolve(undefined),
                onError: () => resolve(undefined),
              });
            });
          }}
          onDeleteBudget={async (id) => {
            await new Promise((resolve) => {
              deleteBudget(id, {
                onSuccess: () => resolve(undefined),
                onError: () => resolve(undefined),
              });
            });
          }}
        />
      </Suspense>
    </div>
  );
}

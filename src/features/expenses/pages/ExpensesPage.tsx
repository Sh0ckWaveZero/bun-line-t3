"use client";

import { SummaryCard } from "@/features/expenses/components/SummaryCard";
import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import { BudgetOverviewCard } from "@/features/expenses/components/BudgetOverviewCard";
import { MonthNavigationCard } from "@/features/expenses/components/MonthNavigationCard";
import { SummaryCardSkeleton, BudgetOverviewSkeleton, ChartSkeleton } from "@/features/expenses/components/LoadingSkeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TRANSACTION_TABS, TransactionTab } from "@/features/expenses/constants";
import { useExpenseCategories } from "@/features/expenses/hooks/useExpenseCategories";
import { useExpenseTransactions } from "@/features/expenses/hooks/useExpenseTransactions";
import { useMonthlyCharts } from "@/features/expenses/hooks/useMonthlyCharts";
import { useMonthNavigationWithSwipe } from "@/features/expenses/hooks/useMonthNavigationWithSwipe";
import { useCategoryModalFlow } from "@/features/expenses/hooks/useCategoryModalFlow";
import { useTransactionModal } from "@/features/expenses/hooks/useTransactionModal";
import { useExpensePageUI } from "@/features/expenses/hooks/useExpensePageUI";
import { useBudgets } from "@/features/expenses/hooks/useBudgets";
import type { BudgetUsage } from "@/features/expenses/services/budget.server";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
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
  useEffect(() => {
    const recoverPointerLock = () => {
      const hasOpenModal =
        document.querySelector('[role="dialog"][data-state="open"]') !== null ||
        document.querySelector('[role="alertdialog"][data-state="open"]') !== null

      if (!hasOpenModal && document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = ""
      }
    }

    recoverPointerLock()
    const intervalId = window.setInterval(recoverPointerLock, 500)

    return () => {
      window.clearInterval(intervalId)
      recoverPointerLock()
    }
  }, [])

  // Month navigation with swipe support
  const {
    currentMonth,
    prevMonth,
    nextMonth,
    monthNavRef,
    swipeTransform,
    isSwiping,
    contentOpacity,
    contentTransform,
  } = useMonthNavigationWithSwipe();

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
  } = useExpenseTransactions(currentMonth, true);

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

  const { multiMonthSummaries } = useMonthlyCharts(currentMonth, showCharts);

  const { budgets, createBudget, updateBudget, deleteBudget } = useBudgets(currentMonth, true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TransactionTab>("all");
  const tabIndex = TRANSACTION_TABS.indexOf(activeTab);
  const tabCount = TRANSACTION_TABS.length;

  const fabRef = useRef<HTMLDivElement>(null);

  // FAB glow animation
  useEffect(() => {
    const el = fabRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      if (deg < 0) deg += 360;
      el.style.setProperty("--start", String(deg + 90));
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const txModal = useTransactionModal({ createTransaction, updateTransaction, deleteTransaction });
  const catFlow = useCategoryModalFlow({
    createCategory,
    updateCategory,
    deleteCategory,
    onReturnToAddTransaction: txModal.openAdd,
  });

  return (
    <TooltipProvider>
      <div id="expenses-page" className="bg-background min-h-screen w-full">
      <div id="expenses-container" className="container mx-auto max-w-5xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-32">

        <div id="expenses-header" className="border-border/70 bg-card/80 dark:bg-card/65 mb-6 overflow-hidden rounded-xl border p-4 sm:mb-8 sm:p-5">
          <div id="expenses-header-inner" className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div id="expenses-header-title">
              <h1 id="expenses-title" className="text-foreground text-2xl font-bold sm:text-3xl">รายรับรายจ่าย</h1>
              <p id="expenses-subtitle" className="text-muted-foreground mt-1 max-w-2xl text-sm">บันทึกและติดตามการเงินของคุณ</p>
            </div>
            <div id="expenses-header-actions" className="flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button id="btn-toggle-amounts" variant="outline" size="sm" onClick={toggleHideAmounts} aria-label={hideAmounts ? "แสดงจำนวนเงิน" : "ซ่อนจำนวนเงิน"} className="hover:bg-muted transition-colors">
                    {hideAmounts ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{hideAmounts ? "แสดงจำนวนเงิน" : "ซ่อนจำนวนเงิน"}</p>
                </TooltipContent>
              </Tooltip>
              <Button id="btn-export" variant="outline" size="sm" disabled={exporting || transactions.length === 0} onClick={handleExport} className="gap-2 hover:bg-muted transition-colors">
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button id="btn-category-manager" variant="outline" size="sm" onClick={() => catFlow.setShowManagerModal(true)} className="gap-2 hover:bg-muted transition-colors">
                <Tag size={14} />
                <span className="hidden sm:inline">หมวดหมู่</span>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button id="btn-refresh" variant="outline" size="sm" onClick={() => void refetchTx()} disabled={txLoading} aria-label="รีเฟรชข้อมูล" className="hover:bg-muted transition-colors">
                    <RefreshCw className={`h-4 w-4 ${txLoading ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>รีเฟรชข้อมูล</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <MonthNavigationCard
          currentMonth={currentMonth}
          onPreviousMonth={prevMonth}
          onNextMonth={nextMonth}
          swipeTransform={swipeTransform}
          isSwiping={isSwiping}
          ref={monthNavRef}
        />

        <div
          id="content-animator"
          className="transition-all duration-300 ease-out min-h-[400px]"
          style={{
            opacity: contentOpacity,
            transform: `translateY(${contentTransform}px)`
          }}
        >
          <div id="summary-cards-grid" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {txLoading ? (
            <>
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
            </>
          ) : (
            <>
              <SummaryCard id="income" label="รายรับ" amount={summary?.totalIncome ?? 0} icon={<TrendingUp className="text-card-green h-4 w-4 sm:h-5 sm:w-5" />} iconBg="bg-card-green" hideAmounts={hideAmounts} />
              <SummaryCard id="expense" label="รายจ่าย" amount={summary?.totalExpense ?? 0} icon={<TrendingDown className="text-card-red h-4 w-4 sm:h-5 sm:w-5" />} iconBg="bg-card-red" hideAmounts={hideAmounts} />
              <SummaryCard id="balance" label="คงเหลือ" className="col-span-2 sm:col-span-1" amount={summary?.balance ?? 0}
                icon={<Wallet className={`h-4 w-4 sm:h-5 sm:w-5 ${summary && summary.balance >= 0 ? "text-card-blue" : "text-destructive"}`} />}
                iconBg={summary && summary.balance >= 0 ? "bg-card-blue" : "bg-destructive/10"} hideAmounts={hideAmounts}
              />
            </>
          )}
        </div>

        <div id="budget-overview-section" className="mb-6">
          {txLoading ? (
            <BudgetOverviewSkeleton />
          ) : (
            <BudgetOverviewCard
              budgets={budgets}
              hideAmounts={hideAmounts}
              onManageBudgets={() => setShowBudgetModal(true)}
            />
          )}
        </div>

        <div id="charts-section" className="mb-4 sm:mb-6">
          <button id="btn-toggle-charts" type="button" onClick={toggleCharts} className="text-muted-foreground hover:text-foreground cursor-pointer flex w-full items-center justify-between rounded-lg px-1 py-2 text-xs font-medium transition-colors hover:bg-muted/50 active:bg-muted">
            <span id="charts-toggle-label">กราฟสรุป</span>
            <ChevronDown id="charts-toggle-icon" size={14} className={`transition-transform duration-200 ${showCharts ? "rotate-180" : ""}`} />
          </button>
          {showCharts && (
            <div id="charts-container" className="mt-2 space-y-3">
              <Suspense fallback={<ChartSkeleton height={200} />}>
                <ExpenseDonutChart data={categorySummary} hideAmounts={hideAmounts} />
              </Suspense>
              <Suspense fallback={<ChartSkeleton height={250} />}>
                <MonthlyBarChart data={multiMonthSummaries} hideAmounts={hideAmounts} />
              </Suspense>
            </div>
          )}
        </div>

        <Tabs id="transactions-tabs" value={activeTab} onValueChange={(value) => setActiveTab(value as TransactionTab)}>
          <div
            id="transactions-tabs-list"
            role="tablist"
            className="relative mb-3 flex w-full rounded-xl bg-muted/50 p-1 sm:mb-4"
          >
            <div
              aria-hidden="true"
              className="absolute rounded-lg bg-background shadow-sm"
              style={{
                top: "4px",
                bottom: "4px",
                left: `calc(${(tabIndex / tabCount) * 100}% + ${4 - (tabIndex * 8) / tabCount}px)`,
                width: `calc(${(1 / tabCount) * 100}% - ${8 / tabCount}px)`,
                transition: "left 250ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
            {TRANSACTION_TABS.map((tab) => (
              <button
                key={tab}
                id={`tab-trigger-${tab}`}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "relative z-10 flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors duration-200 sm:text-sm",
                  activeTab === tab
                    ? "text-foreground"
                    : tab === "EXPENSE"
                      ? "text-card-red/60 hover:text-card-red"
                      : tab === "INCOME"
                        ? "text-card-green/60 hover:text-card-green"
                        : "text-muted-foreground hover:text-foreground/70"
                )}
              >
                {tab === "all" ? "ทั้งหมด" : tab === "EXPENSE" ? "รายจ่าย" : "รายรับ"}
              </button>
            ))}
          </div>
          {TRANSACTION_TABS.map((tab) => {
            const list = tab === "all" ? transactions : transactions.filter((t) => t.type === tab);
            return (
              <TabsContent id={`tab-content-${tab}`} key={tab} value={tab} className="space-y-2 pb-24 data-[state=active]:animate-tab-in">
                {txLoading && <div id="transactions-loading" className="text-muted-foreground flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin" /></div>}
                {!txLoading && list.length === 0 && (
                  <Card id="transactions-empty-card" className="border-border/50 bg-card/60 dark:bg-card/45">
                    <CardContent id="transactions-empty-content" className="text-muted-foreground py-12 text-center">
                      <p id="transactions-empty-msg" className="text-sm">ยังไม่มีรายการ</p>
                    </CardContent>
                  </Card>
                )}
                <div id={`transactions-list-${tab}`} className="space-y-2">
                  {list.map((tx) => <TransactionRow key={tx.id} tx={tx} onEdit={txModal.openEdit} onDelete={txModal.handleDelete} hideAmounts={hideAmounts} />)}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
        </div>
      </div>

      <div id="fab-wrapper" ref={fabRef} className="glow-fab-wrapper fixed bottom-6 right-4 z-40 sm:bottom-8 sm:right-8">
        <div id="fab-glow-ring" className="glow-fab-ring" />
        <Button
          id="fab-add-btn"
          onClick={txModal.openAdd}
          aria-label="เพิ่มรายการ"
          className="group/btn relative h-14 w-14 overflow-hidden rounded-full bg-primary/40 p-0 text-primary-foreground shadow-lg"
        >
          <span id="fab-hover-layer" className="pointer-events-none absolute inset-0 bg-primary [clip-path:circle(0%)] transition-[clip-path] duration-500 ease-in-out group-hover/btn:[clip-path:circle(100%)] group-active/btn:[clip-path:circle(100%)]" />
          <Plus id="fab-icon" size={24} className="relative z-10" />
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
          budgets={budgets.map((b: BudgetUsage) => b.budget)}
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
    </TooltipProvider>
  );
}

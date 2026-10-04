"use client";

import { SummaryCardsGrid } from "@/features/expenses/components/SummaryCardsGrid";
import { ChartsSection } from "@/features/expenses/components/ChartsSection";
import { TransactionsTabs } from "@/features/expenses/components/TransactionsTabs";
import { ExpensesHeader } from "@/features/expenses/components/ExpensesHeader";
import { ExpensesFab } from "@/features/expenses/components/ExpensesFab";
import { ExpensesModals } from "@/features/expenses/components/ExpensesModals";
import { BudgetOverviewCard } from "@/features/expenses/components/BudgetOverviewCard";
import { MonthNavigationCard } from "@/features/expenses/components/MonthNavigationCard";
import { BudgetOverviewSkeleton } from "@/features/expenses/components/LoadingSkeletons";
import { ThaiHelpCalculator } from "@/features/expenses/components/ThaiHelpCalculator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useExpenseCategories } from "@/features/expenses/hooks/useExpenseCategories";
import { useExpenseTransactions } from "@/features/expenses/hooks/useExpenseTransactions";
import { useMonthlyCharts } from "@/features/expenses/hooks/useMonthlyCharts";
import { useMonthNavigationWithSwipe } from "@/features/expenses/hooks/useMonthNavigationWithSwipe";
import { useCategoryModalFlow } from "@/features/expenses/hooks/useCategoryModalFlow";
import { useTransactionModal } from "@/features/expenses/hooks/useTransactionModal";
import { useExpensePageUI } from "@/features/expenses/hooks/useExpensePageUI";
import { useBudgets } from "@/features/expenses/hooks/useBudgets";
import { usePointerLockRecovery } from "@/features/expenses/hooks/usePointerLockRecovery";
import { useFabGlow } from "@/features/expenses/hooks/useFabGlow";
import { useState } from "react";

export function ExpensesPage() {
  usePointerLockRecovery();

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

  const {
    hideAmounts,
    showCharts,
    exporting,
    toggleHideAmounts,
    toggleCharts,
    handleExport,
  } = useExpensePageUI({
    transactions,
    summary,
    currentMonth,
    initialHideAmounts: hideAmountsWeb,
  });

  const { multiMonthSummaries } = useMonthlyCharts(currentMonth, showCharts);

  const { budgets, createBudget, updateBudget, deleteBudget } = useBudgets(
    currentMonth,
    true,
  );
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const fabRef = useFabGlow();

  const txModal = useTransactionModal({
    createTransaction,
    updateTransaction,
    deleteTransaction,
  });
  const catFlow = useCategoryModalFlow({
    createCategory,
    updateCategory,
    deleteCategory,
    onReturnToAddTransaction: txModal.openAdd,
  });

  return (
    <TooltipProvider>
      <div id="expenses-page" className="bg-background min-h-screen w-full">
        <div
          id="expenses-container"
          className="container mx-auto max-w-5xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-32"
        >
          <ExpensesHeader
            hideAmounts={hideAmounts}
            onToggleHideAmounts={toggleHideAmounts}
            exporting={exporting}
            onExport={() => void handleExport()}
            hasTransactions={transactions.length > 0}
            isRefreshing={txLoading}
            onRefresh={refetchTx}
            onManageCategories={() => catFlow.setShowManagerModal(true)}
          />

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
            className="min-h-[400px] transition-[opacity,transform] duration-300 ease-out"
            style={{
              opacity: contentOpacity,
              transform: `translateY(${contentTransform}px)`,
            }}
          >
            <SummaryCardsGrid
              isLoading={txLoading}
              summary={summary}
              hideAmounts={hideAmounts}
            />

            <ThaiHelpCalculator
              categories={categories}
              transactions={transactions}
              isSaving={txSaving}
              isLoading={txLoading}
              onSave={createTransaction}
              refetch={refetchTx}
            />

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

            <ChartsSection
              showCharts={showCharts}
              onToggleCharts={toggleCharts}
              categorySummary={categorySummary}
              multiMonthSummaries={multiMonthSummaries}
              hideAmounts={hideAmounts}
            />

            <TransactionsTabs
              transactions={transactions}
              isLoading={txLoading}
              hideAmounts={hideAmounts}
              onEdit={txModal.openEdit}
              onDelete={txModal.handleDelete}
            />
          </div>
        </div>

        <ExpensesFab wrapperRef={fabRef} onAdd={txModal.openAdd} />

        <ExpensesModals
          txModal={txModal}
          catFlow={catFlow}
          showBudgetModal={showBudgetModal}
          setShowBudgetModal={setShowBudgetModal}
          budgets={budgets}
          categories={categories}
          txSaving={txSaving}
          catSaving={catSaving}
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
      </div>
    </TooltipProvider>
  );
}

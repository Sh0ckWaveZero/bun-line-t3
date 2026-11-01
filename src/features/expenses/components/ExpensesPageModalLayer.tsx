"use client";

import { lazy, Suspense } from "react";
import type { useCategoryModalFlow } from "@/features/expenses/hooks/useCategoryModalFlow";
import type { useTransactionModal } from "@/features/expenses/hooks/useTransactionModal";
import type { useExpenseTransactions } from "@/features/expenses/hooks/useExpenseTransactions";
import type { useBudgets } from "@/features/expenses/hooks/useBudgets";
import type { BudgetUsage } from "@/features/expenses/services/budget.server";

const AddTransactionModal = lazy(async () => {
  const module =
    await import("@/features/expenses/components/AddTransactionModal");
  return { default: module.AddTransactionModal };
});

const CategoryManagerModal = lazy(async () => {
  const module =
    await import("@/features/expenses/components/CategoryManagerModal");
  return { default: module.CategoryManagerModal };
});

const AddCategoryModal = lazy(async () => {
  const module =
    await import("@/features/expenses/components/AddCategoryModal");
  return { default: module.AddCategoryModal };
});

const BudgetSettingsModal = lazy(async () => {
  const module =
    await import("@/features/expenses/components/BudgetSettingsModal");
  return { default: module.BudgetSettingsModal };
});

type TransactionModal = ReturnType<typeof useTransactionModal>;
type CategoryModalFlow = ReturnType<typeof useCategoryModalFlow>;
type ExpenseTransactions = ReturnType<typeof useExpenseTransactions>;
type Budgets = ReturnType<typeof useBudgets>;

interface ExpensesPageModalLayerProps {
  categories: ExpenseTransactions["categories"];
  txSaving: boolean;
  catSaving: boolean;
  txModal: TransactionModal;
  catFlow: CategoryModalFlow;
  budgets: Budgets["budgets"];
  showBudgetModal: boolean;
  onBudgetModalOpenChange: (open: boolean) => void;
  budgetActions: Pick<
    Budgets,
    "createBudget" | "updateBudget" | "deleteBudget"
  >;
}

export function ExpensesPageModalLayer({
  categories,
  txSaving,
  catSaving,
  txModal,
  catFlow,
  budgets,
  showBudgetModal,
  onBudgetModalOpenChange,
  budgetActions,
}: ExpensesPageModalLayerProps) {
  const { createBudget, updateBudget, deleteBudget } = budgetActions;

  return (
    <Suspense fallback={null}>
      {txModal.showModal && (
        <AddTransactionModal
          key={`transaction-${txModal.showModal ? "open" : "closed"}-${txModal.editingTx?.id ?? "new"}`}
          categories={categories}
          open={txModal.showModal}
          onOpenChange={(open) => {
            if (!open) txModal.close();
          }}
          onSave={txModal.handleSave}
          isLoading={txSaving}
          onAddCategory={catFlow.openAddFromTransaction}
          editData={txModal.editingTx}
        />
      )}
      {catFlow.showManagerModal && (
        <CategoryManagerModal
          open={catFlow.showManagerModal}
          onOpenChange={catFlow.setShowManagerModal}
          categories={categories}
          onEdit={catFlow.openEdit}
          onDelete={catFlow.handleDelete}
          onAdd={catFlow.openAddFromManager}
        />
      )}
      {catFlow.showCategoryModal && (
        <AddCategoryModal
          key={`category-${catFlow.showCategoryModal ? "open" : "closed"}-${catFlow.editingCategory?.id ?? "new"}`}
          open={catFlow.showCategoryModal}
          onOpenChange={catFlow.handleCategoryModalOpenChange}
          onSave={catFlow.handleSave}
          isLoading={catSaving}
          editMode={!!catFlow.editingCategory}
          category={catFlow.editingCategory}
        />
      )}
      <BudgetSettingsModal
        open={showBudgetModal}
        onOpenChange={onBudgetModalOpenChange}
        budgets={budgets.map((usage: BudgetUsage) => usage.budget)}
        categories={categories}
        onCreateBudget={async (data) => {
          await new Promise<void>((resolve) => {
            createBudget(data, {
              onSuccess: resolve,
              onError: () => resolve(undefined),
            });
          });
        }}
        onUpdateBudget={async (id, data) => {
          await new Promise<void>((resolve) => {
            updateBudget(id, data, {
              onSuccess: resolve,
              onError: () => resolve(undefined),
            });
          });
        }}
        onDeleteBudget={async (id) => {
          await new Promise<void>((resolve) => {
            deleteBudget(id, {
              onSuccess: resolve,
              onError: () => resolve(undefined),
            });
          });
        }}
      />
    </Suspense>
  );
}

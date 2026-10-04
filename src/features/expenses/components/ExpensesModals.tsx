import { lazy, Suspense } from "react";
import type { useTransactionModal } from "@/features/expenses/hooks/useTransactionModal";
import type { useCategoryModalFlow } from "@/features/expenses/hooks/useCategoryModalFlow";
import type { ExpenseCategory } from "@/features/expenses/types";
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

interface ExpensesModalsProps {
  txModal: ReturnType<typeof useTransactionModal>;
  catFlow: ReturnType<typeof useCategoryModalFlow>;
  showBudgetModal: boolean;
  setShowBudgetModal: (open: boolean) => void;
  budgets: BudgetUsage[];
  categories: ExpenseCategory[];
  txSaving: boolean;
  catSaving: boolean;
  onCreateBudget: (data: {
    categoryId: string | null;
    amount: number;
    alertAt: number;
  }) => Promise<void>;
  onUpdateBudget: (
    id: string,
    data: { amount?: number; alertAt?: number },
  ) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
}

/** กลุ่ม modal ทั้งหมดของหน้ารายรับรายจ่าย (lazy load ทั้งหมด) */
export function ExpensesModals({
  txModal,
  catFlow,
  showBudgetModal,
  setShowBudgetModal,
  budgets,
  categories,
  txSaving,
  catSaving,
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
}: ExpensesModalsProps) {
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
        onOpenChange={setShowBudgetModal}
        budgets={budgets.map((b: BudgetUsage) => b.budget)}
        categories={categories}
        onCreateBudget={onCreateBudget}
        onUpdateBudget={onUpdateBudget}
        onDeleteBudget={onDeleteBudget}
      />
    </Suspense>
  );
}

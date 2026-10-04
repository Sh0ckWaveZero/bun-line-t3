import { AlertDialog, AlertDialogContent } from "@/components/ui/AlertDialog";
import { PopoverDatePicker } from "@/components/ui/date-picker";
import { toTransDate } from "@/features/expenses/helpers";
import { AddTransactionModalHeader } from "@/features/expenses/components/AddTransactionModalHeader";
import { TransactionTypeField } from "@/features/expenses/components/TransactionTypeField";
import { TransactionCategoryField } from "@/features/expenses/components/TransactionCategoryField";
import { TransactionAmountField } from "@/features/expenses/components/TransactionAmountField";
import { TransactionNoteField } from "@/features/expenses/components/TransactionNoteField";
import { TransactionTagsField } from "@/features/expenses/components/TransactionTagsField";
import { TransactionFormActions } from "@/features/expenses/components/TransactionFormActions";
import { useTransactionForm } from "@/features/expenses/hooks/useTransactionForm";
import type {
  CreateTransactionInput,
  ExpenseCategory,
  TransactionWithCategory,
} from "@/features/expenses/types";

interface AddTransactionModalProps {
  categories: ExpenseCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: Omit<CreateTransactionInput, "userId">) => Promise<void>;
  isLoading: boolean;
  onAddCategory: () => void;
  editData?: TransactionWithCategory | null;
}

export function AddTransactionModal(props: AddTransactionModalProps) {
  const { open, ...formProps } = props;
  if (!open) return null;

  const editData = props.editData;
  const formKey = editData
    ? [
        editData.id,
        editData.type,
        editData.categoryId,
        editData.amount,
        editData.note ?? "",
        editData.tags ?? "",
        editData.transDate,
      ].join(":")
    : "new";

  return <AddTransactionModalForm key={formKey} {...formProps} />;
}

function AddTransactionModalForm({
  categories,
  onOpenChange,
  onSave,
  isLoading,
  onAddCategory,
  editData,
}: Omit<AddTransactionModalProps, "open">) {
  const form = useTransactionForm({ editData, onSave });

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent
        id="add-transaction-modal"
        className="border-border bg-card fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border p-0"
      >
        <AddTransactionModalHeader
          isEditMode={!!editData}
          onClose={() => onOpenChange(false)}
        />

        <div
          id="add-transaction-modal-content"
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6"
        >
          <form
            id="add-transaction-form"
            onSubmit={form.handleSubmit}
            className="space-y-4"
          >
            <TransactionTypeField value={form.type} onChange={form.setType} />

            <TransactionCategoryField
              categories={categories}
              value={form.categoryId}
              onChange={form.setCategoryId}
              onManageCategories={() => onAddCategory()}
            />

            <TransactionAmountField
              value={form.amount}
              onChange={form.setAmount}
              isCoPayTx={form.isCoPayTx}
            />

            <PopoverDatePicker
              id="transaction-date-picker"
              label="วันที่"
              required
              value={
                form.transDate
                  ? new Date(form.transDate + "T00:00:00")
                  : undefined
              }
              onChange={(date) =>
                form.setTransDate(date ? toTransDate(date) : "")
              }
              maxDate={form.today}
            />

            <TransactionNoteField value={form.note} onChange={form.setNote} />

            <TransactionTagsField value={form.tags} onChange={form.setTags} />

            <TransactionFormActions
              type={form.type}
              isLoading={isLoading}
              isEditMode={!!editData}
              saveDisabled={isLoading || !form.categoryId || !form.amount}
              onCancel={() => onOpenChange(false)}
            />
          </form>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

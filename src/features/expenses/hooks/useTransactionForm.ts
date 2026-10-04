import { useState } from "react";
import type { FormEvent } from "react";
import { formatAmountInput } from "@/features/expenses/helpers/amountInput";
import {
  getInitialFormState,
  type TransactionFormState,
} from "@/features/expenses/helpers/transactionForm";
import {
  calculateCoPaymentSplit,
  formatCoPaymentDetails,
  shouldApplyCoPayment,
} from "@/features/expenses/helpers/coPayment";
import type {
  CreateTransactionInput,
  TransactionWithCategory,
} from "@/features/expenses/types";

interface UseTransactionFormArgs {
  editData: TransactionWithCategory | null | undefined;
  onSave: (input: Omit<CreateTransactionInput, "userId">) => Promise<void>;
}

/**
 * Form state + submit logic ของ AddTransactionModalForm
 * (ย้ายมาจาก component เดิม — ลำดับ state และพฤติกรรมเดิมทุกอย่าง)
 */
export function useTransactionForm({
  editData,
  onSave,
}: UseTransactionFormArgs) {
  const [initialFormState] = useState(() => getInitialFormState(editData));
  const [type, setType] = useState<TransactionFormState["type"]>(
    initialFormState.type,
  );
  const [categoryId, setCategoryId] = useState(initialFormState.categoryId);
  const [amount, setAmount] = useState(initialFormState.amount);
  const [note, setNote] = useState(initialFormState.note);
  const [tags, setTags] = useState(initialFormState.tags);
  const [transDate, setTransDate] = useState(initialFormState.transDate);
  const today = new Date();

  const isCoPayTx =
    !!editData &&
    shouldApplyCoPayment(
      editData.type,
      editData.note,
      editData.tags?.split(","),
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numeric = parseFloat(amount.replace(/,/g, ""));
    if (!categoryId || !amount || !transDate || isNaN(numeric) || numeric <= 0)
      return;

    if (isCoPayTx) {
      const split = calculateCoPaymentSplit(numeric);
      const originalTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t && t !== "ไทยช่วยไทย" && t !== "60-40");
      const formatted = formatCoPaymentDetails(
        numeric,
        split.subsidyAmount,
        note || undefined,
        originalTags,
      );
      await onSave({
        categoryId,
        type,
        amount: split.userAmount,
        note: formatted.note,
        tags: formatted.tags.join(","),
        transDate,
      });
    } else {
      await onSave({
        categoryId,
        type,
        amount: numeric,
        note: note || undefined,
        tags: tags || undefined,
        transDate,
      });
    }
  };

  return {
    type,
    setType,
    categoryId,
    setCategoryId,
    amount,
    setAmount: (value: string) => setAmount(formatAmountInput(value)),
    note,
    setNote,
    tags,
    setTags,
    transDate,
    setTransDate,
    today,
    isCoPayTx,
    handleSubmit,
  };
}

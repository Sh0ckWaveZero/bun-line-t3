/**
 * Form state helpers สำหรับ AddTransactionModal
 * (pure functions — ไม่พึ่ง React)
 */

import { toTransDate } from "@/features/expenses/helpers";
import {
  parseTransactionSubsidy,
  shouldApplyCoPayment,
} from "@/features/expenses/helpers/coPayment";
import { formatAmountInput } from "@/features/expenses/helpers/amountInput";
import type { TransactionWithCategory } from "@/features/expenses/types";

export interface TransactionFormState {
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  amount: string;
  note: string;
  tags: string;
  transDate: string;
}

export function getInitialFormState(
  editData: TransactionWithCategory | null | undefined,
): TransactionFormState {
  if (!editData) {
    return {
      type: "EXPENSE",
      categoryId: "",
      amount: "",
      note: "",
      tags: "",
      transDate: toTransDate(),
    };
  }

  const isCoPayTx = shouldApplyCoPayment(
    editData.type,
    editData.note,
    editData.tags?.split(","),
  );
  if (!isCoPayTx) {
    return {
      type: editData.type,
      categoryId: editData.categoryId,
      amount: formatAmountInput(editData.amount.toString()),
      note: editData.note ?? "",
      tags: editData.tags ?? "",
      transDate: editData.transDate,
    };
  }

  const subsidy = parseTransactionSubsidy(
    editData.amount,
    editData.note,
    editData.tags,
  );
  const customNoteMatch = (editData.note ?? "").match(/ - (.+)$/);
  const customTags = (editData.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag && tag !== "ไทยช่วยไทย" && tag !== "60-40")
    .join(",");

  return {
    type: editData.type,
    categoryId: editData.categoryId,
    amount: formatAmountInput((editData.amount + subsidy).toString()),
    note: customNoteMatch?.[1] ?? "",
    tags: customTags,
    transDate: editData.transDate,
  };
}

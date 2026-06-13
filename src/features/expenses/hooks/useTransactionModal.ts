import { useCallback, useState } from "react";
import { useToast } from "@/components/common/ToastProvider";
import type { CreateTransactionInput, TransactionWithCategory } from "../types";

interface Deps {
  createTransaction: (
    input: Omit<CreateTransactionInput, "userId">,
  ) => Promise<void>;
  updateTransaction: (args: {
    id: string;
    input: Omit<CreateTransactionInput, "userId">;
  }) => Promise<void>;
  deleteTransaction: (id: string) => void;
}

export function useTransactionModal({
  createTransaction,
  updateTransaction,
  deleteTransaction,
}: Deps) {
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionWithCategory | null>(
    null,
  );

  const openAdd = useCallback(() => {
    setEditingTx(null);
    setShowModal(true);
  }, []);

  const openEdit = useCallback((tx: TransactionWithCategory) => {
    setEditingTx(tx);
    setShowModal(true);
  }, []);

  const close = useCallback(() => {
    setShowModal(false);
    setEditingTx(null);
  }, []);

  const handleSave = useCallback(
    async (input: Omit<CreateTransactionInput, "userId">) => {
      try {
        if (editingTx) {
          await updateTransaction({ id: editingTx.id, input });
          showToast({ title: "✅ แก้ไขรายการสำเร็จ", type: "success" });
        } else {
          await createTransaction(input);
          showToast({ title: "✅ บันทึกรายการสำเร็จ", type: "success" });
        }
        close();
      } catch {
        showToast({ title: "❌ เกิดข้อผิดพลาด กรุณาลองใหม่", type: "error" });
      }
    },
    [editingTx, createTransaction, updateTransaction, close, showToast],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("ยืนยันการลบรายการนี้?")) deleteTransaction(id);
    },
    [deleteTransaction],
  );

  return {
    showModal,
    editingTx,
    openAdd,
    openEdit,
    close,
    handleSave,
    handleDelete,
  };
}

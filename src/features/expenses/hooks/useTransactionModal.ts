import { useCallback, useState } from "react"
import type { CreateTransactionInput, TransactionWithCategory } from "../types"

interface Deps {
  createTransaction: (input: Omit<CreateTransactionInput, "userId">) => Promise<void>
  updateTransaction: (args: { id: string; input: Omit<CreateTransactionInput, "userId"> }) => Promise<void>
  deleteTransaction: (id: string) => void
}

export function useTransactionModal({ createTransaction, updateTransaction, deleteTransaction }: Deps) {
  const [showModal, setShowModal] = useState(false)
  const [editingTx, setEditingTx] = useState<TransactionWithCategory | null>(null)

  const openAdd = useCallback(() => {
    setEditingTx(null)
    setShowModal(true)
  }, [])

  const openEdit = useCallback((tx: TransactionWithCategory) => {
    setEditingTx(tx)
    setShowModal(true)
  }, [])

  const close = useCallback(() => {
    setShowModal(false)
    setEditingTx(null)
  }, [])

  const handleSave = useCallback(
    async (input: Omit<CreateTransactionInput, "userId">) => {
      if (editingTx) {
        await updateTransaction({ id: editingTx.id, input })
      } else {
        await createTransaction(input)
      }
      close()
    },
    [editingTx, createTransaction, updateTransaction, close],
  )

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("ยืนยันการลบรายการนี้?")) deleteTransaction(id)
    },
    [deleteTransaction],
  )

  return {
    showModal,
    editingTx,
    openAdd,
    openEdit,
    close,
    handleSave,
    handleDelete,
  }
}

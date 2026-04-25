import { useCallback, useState } from "react"
import type { ExpenseCategory } from "../types"

interface Deps {
  createCategory: (
    data: { name: string; icon: string },
    callbacks?: { onSuccess?: () => void; onError?: (msg: string) => void },
  ) => Promise<void>
  updateCategory: (
    id: string,
    data: { name: string; icon: string },
    callbacks?: { onSuccess?: () => void; onError?: (msg: string) => void },
  ) => Promise<void>
  deleteCategory: (
    id: string,
    callbacks?: { onError?: (msg: string) => void },
  ) => void
  onReturnToAddTransaction: () => void
}

export function useCategoryModalFlow({
  createCategory,
  updateCategory,
  deleteCategory,
  onReturnToAddTransaction,
}: Deps) {
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showManagerModal, setShowManagerModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [returnTarget, setReturnTarget] = useState<"addTransaction" | "manager" | null>(null)

  // เปิด add category จาก transaction modal
  const openAddFromTransaction = useCallback(() => {
    setEditingCategory(null)
    setReturnTarget("addTransaction")
    setShowManagerModal(false)
    setShowCategoryModal(true)
  }, [])

  // เปิด add category จาก manager modal
  const openAddFromManager = useCallback(() => {
    setEditingCategory(null)
    setReturnTarget("manager")
    setShowManagerModal(false)
    setShowCategoryModal(true)
  }, [])

  const openEdit = useCallback((category: ExpenseCategory) => {
    setEditingCategory(category)
    setReturnTarget("manager")
    setShowManagerModal(false)
    setShowCategoryModal(true)
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("ยืนยันการลบหมวดหมู่นี้?"))
        deleteCategory(id, { onError: (msg) => alert(msg) })
    },
    [deleteCategory],
  )

  const handleSave = useCallback(
    async (data: { name: string; icon: string }) => {
      const onSuccess = () => {
        setShowCategoryModal(false)
        setEditingCategory(null)
        if (returnTarget === "addTransaction") {
          setReturnTarget(null)
          onReturnToAddTransaction()
        } else if (returnTarget === "manager") {
          setReturnTarget(null)
          setShowManagerModal(true)
        }
      }

      if (editingCategory) {
        await updateCategory(editingCategory.id, data, { onSuccess, onError: alert })
      } else {
        await createCategory(data, { onSuccess, onError: alert })
      }
    },
    [editingCategory, returnTarget, createCategory, updateCategory, onReturnToAddTransaction],
  )

  const handleCategoryModalOpenChange = useCallback(
    (open: boolean) => {
      setShowCategoryModal(open)
      if (!open) {
        if (returnTarget === "addTransaction") {
          setReturnTarget(null)
          onReturnToAddTransaction()
        } else if (returnTarget === "manager") {
          setReturnTarget(null)
          setShowManagerModal(true)
        }
      }
    },
    [returnTarget, onReturnToAddTransaction],
  )

  return {
    showCategoryModal,
    showManagerModal,
    editingCategory,
    setShowManagerModal,
    openAddFromTransaction,
    openAddFromManager,
    openEdit,
    handleDelete,
    handleSave,
    handleCategoryModalOpenChange,
  }
}

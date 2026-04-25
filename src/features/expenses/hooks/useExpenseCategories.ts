import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchCategories } from "../api"

interface SaveCategoryCallbacks {
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useExpenseCategories(enabled: boolean) {
  const queryClient = useQueryClient()

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["expense-categories"] })

  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: fetchCategories,
    enabled,
    staleTime: 5 * 60_000,
  })

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string }) => {
      const res = await fetch("/api/expenses/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? "เพิ่มหมวดหมู่ไม่สำเร็จ")
      }
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; icon: string } }) => {
      const res = await fetch(`/api/expenses/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? "แก้ไขหมวดหมู่ไม่สำเร็จ")
      }
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/categories/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? "ลบหมวดหมู่ไม่สำเร็จ")
      }
    },
    onSuccess: invalidate,
  })

  const createCategory = async (
    data: { name: string; icon: string },
    callbacks?: SaveCategoryCallbacks,
  ) => {
    try {
      await createMutation.mutateAsync(data)
      callbacks?.onSuccess?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "เพิ่มหมวดหมู่ไม่สำเร็จ"
      callbacks?.onError?.(msg)
    }
  }

  const updateCategory = async (
    id: string,
    data: { name: string; icon: string },
    callbacks?: SaveCategoryCallbacks,
  ) => {
    try {
      await updateMutation.mutateAsync({ id, data })
      callbacks?.onSuccess?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "แก้ไขหมวดหมู่ไม่สำเร็จ"
      callbacks?.onError?.(msg)
    }
  }

  const deleteCategory = (id: string, callbacks?: SaveCategoryCallbacks) => {
    deleteMutation.mutate(id, {
      onSuccess: callbacks?.onSuccess,
      onError: (e) => callbacks?.onError?.(e.message ?? "ลบหมวดหมู่ไม่สำเร็จ"),
    })
  }

  return {
    categories,
    isSaving: createMutation.isPending || updateMutation.isPending,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}

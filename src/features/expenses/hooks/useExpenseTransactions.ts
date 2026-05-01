import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchSummary, fetchTransactions } from "../api"
import type { CreateTransactionInput } from "../types"

export function useExpenseTransactions(currentMonth: string, enabled: boolean) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["expenses", currentMonth] })
    void queryClient.invalidateQueries({ queryKey: ["expenses-summary", currentMonth] })
    void queryClient.invalidateQueries({ queryKey: ["expenses-multi-month"] })
  }

  const {
    data: transactions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["expenses", currentMonth],
    queryFn: () => fetchTransactions(currentMonth),
    enabled,
  })

  const { data: summaryData } = useQuery({
    queryKey: ["expenses-summary", currentMonth],
    queryFn: () => fetchSummary(currentMonth),
    enabled,
  })

  const createMutation = useMutation({
    mutationFn: async (input: Omit<CreateTransactionInput, "userId">) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ")
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: Omit<CreateTransactionInput, "userId">
    }) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error("แก้ไขไม่สำเร็จ")
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("ลบไม่สำเร็จ")
    },
    onSuccess: invalidate,
  })

  return {
    transactions,
    summary: summaryData?.summary,
    categorySummary: summaryData?.categories ?? [],
    isLoading,
    refetch,
    isSaving: createMutation.isPending || updateMutation.isPending,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutate,
  }
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface SaveBudgetCallbacks {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useBudgets(currentMonth: string, enabled: boolean) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["expense-budgets"] });
  };

  // Fetch budgets with usage for current month
  const { data: budgetUsage = [], isLoading } = useQuery({
    queryKey: ["expense-budgets", currentMonth],
    queryFn: async () => {
      const res = await fetch(`/api/expenses/budgets?month=${currentMonth}`);
      if (!res.ok) {
        throw new Error("Failed to fetch budgets");
      }
      const json = await res.json();
      return json.data || [];
    },
    enabled,
    staleTime: 60_000, // 1 minute
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      categoryId: string | null;
      amount: number;
      alertAt: number;
    }) => {
      const res = await fetch("/api/expenses/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "เพิ่มงบประมาณไม่สำเร็จ");
      }
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { amount?: number; alertAt?: number };
    }) => {
      const res = await fetch(`/api/expenses/budgets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "แก้ไขงบประมาณไม่สำเร็จ");
      }
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/budgets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "ลบงบประมาณไม่สำเร็จ");
      }
    },
    onSuccess: invalidate,
  });

  const createBudget = async (
    data: {
      categoryId: string | null;
      amount: number;
      alertAt: number;
    },
    callbacks?: SaveBudgetCallbacks,
  ) => {
    try {
      await createMutation.mutateAsync(data);
      callbacks?.onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "เพิ่มงบประมาณไม่สำเร็จ";
      callbacks?.onError?.(msg);
    }
  };

  const updateBudget = async (
    id: string,
    data: { amount?: number; alertAt?: number },
    callbacks?: SaveBudgetCallbacks,
  ) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      callbacks?.onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "แก้ไขงบประมาณไม่สำเร็จ";
      callbacks?.onError?.(msg);
    }
  };

  const deleteBudget = (id: string, callbacks?: SaveBudgetCallbacks) => {
    deleteMutation.mutate(id, {
      onSuccess: callbacks?.onSuccess,
      onError: (e) =>
        callbacks?.onError?.(e.message ?? "ลบงบประมาณไม่สำเร็จ"),
    });
  };

  return {
    budgets: budgetUsage,
    isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}

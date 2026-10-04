"use client";

/**
 * useSubscriptionMutations — mutations สำหรับสร้าง / แก้ไข / ลบ subscription
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SubscriptionFormData } from "@/features/subscriptions/components/AddSubscriptionModal";

interface UseSubscriptionMutationsArgs {
  /** id ของ subscription ที่กำลังแก้ไข (ใช้เป็น prefix ของ detail query key) */
  editingSubId: string | null;
  /** เรียกเมื่อลบ subscription สำเร็จ (เดิม: setSelectedId(null)) */
  onSubDeleted: () => void;
}

export function useSubscriptionMutations({
  editingSubId,
  onSubDeleted,
}: UseSubscriptionMutationsArgs) {
  const queryClient = useQueryClient();

  const createSubMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate).toISOString(),
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const updateSubMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: SubscriptionFormData;
    }) => {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate).toISOString(),
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", editingSubId],
      });
    },
  });

  const deleteSubMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      onSubDeleted();
    },
  });

  return { createSubMutation, updateSubMutation, deleteSubMutation };
}

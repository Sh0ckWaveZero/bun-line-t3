"use client";

/**
 * usePaymentMutations — mutations สำหรับสถานะการจ่ายเงิน / แก้ไข / ลบ / สร้างรายการจ่ายเงิน
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PaymentFormData } from "@/features/subscriptions/components/EditPaymentModal";

interface UsePaymentMutationsArgs {
  /** id ของ subscription ที่เลือกอยู่ (ใช้เป็น prefix ของ detail query key) */
  selectedId: string | null;
  /** เรียกเมื่อแก้ไข / ลบรายการจ่ายเงินสำเร็จ (เดิม: setEditingPayment(null)) */
  onEditingClosed: () => void;
  /** เรียกเมื่อสร้างรายการจ่ายเงินสำเร็จ (เดิม: setGenerateSuccessAlert({ created })) */
  onGenerateSuccess: (created: number) => void;
}

export function usePaymentMutations({
  selectedId,
  onEditingClosed,
  onGenerateSuccess,
}: UsePaymentMutationsArgs) {
  const queryClient = useQueryClient();

  const paymentMutation = useMutation({
    mutationFn: async ({
      paymentId,
      action,
    }: {
      paymentId: string;
      action: "paid" | "unpaid" | "skip";
    }) => {
      const res = await fetch(
        `/api/subscriptions/payments?paymentId=${paymentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({
      paymentId,
      data,
    }: {
      paymentId: string;
      data: PaymentFormData;
    }) => {
      const res = await fetch(
        `/api/subscriptions/payments?paymentId=${paymentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: data.amount,
            status: data.status,
            paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
            note: data.note || null,
          }),
        },
      );
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
    },
    onSuccess: () => {
      onEditingClosed();
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await fetch(
        `/api/subscriptions/payments?paymentId=${paymentId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
    },
    onSuccess: () => {
      onEditingClosed();
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
    },
  });

  const generatePaymentsMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const res = await fetch(
        `/api/subscriptions/payments?subscriptionId=${subscriptionId}`,
        {
          method: "POST",
        },
      );
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
      return (await res.json()) as { created: number };
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
      onGenerateSuccess(data.created);
    },
  });

  return {
    paymentMutation,
    updatePaymentMutation,
    deletePaymentMutation,
    generatePaymentsMutation,
  };
}

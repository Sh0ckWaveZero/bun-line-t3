"use client";

/**
 * useMemberMutations — mutations สำหรับเพิ่ม / ลบ / แก้ไขสมาชิกใน subscription
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { MemberFormData } from "@/features/subscriptions/components/AddMemberModal";

interface UseMemberMutationsArgs {
  /** id ของ subscription ที่เลือกอยู่ (ใช้เป็น prefix ของ detail query key) */
  selectedId: string | null;
  /** เรียกเมื่อลบสมาชิกสำเร็จ (เดิม: setDeletingMemberId(null)) */
  onMemberDeleted: () => void;
  /** เรียกเมื่อแก้ไขสมาชิกสำเร็จ (เดิม: setEditingMemberId(null)) */
  onMemberUpdated: () => void;
}

export function useMemberMutations({
  selectedId,
  onMemberDeleted,
  onMemberUpdated,
}: UseMemberMutationsArgs) {
  const queryClient = useQueryClient();

  const addMemberMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      const res = await fetch("/api/subscriptions/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(
        `/api/subscriptions/members?memberId=${memberId}`,
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
      onMemberDeleted();
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({
      memberId,
      data,
    }: {
      memberId: string;
      data: MemberFormData;
    }) => {
      const res = await fetch(
        `/api/subscriptions/members?memberId=${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error);
      }
    },
    onSuccess: () => {
      onMemberUpdated();
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  return { addMemberMutation, deleteMemberMutation, updateMemberMutation };
}

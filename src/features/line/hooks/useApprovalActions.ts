import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/common/ToastProvider";
import {
  LINE_APPROVALS_KEY,
  LINE_APPROVAL_STATS_KEY,
} from "@/features/line/line-utils/approvals";
import type {
  ApprovalActionInput,
  ApprovalItem,
  ApprovalListResponse,
} from "@/features/line/line-utils/approvals";

/**
 * mutation สำหรับ action การอนุมัติ (approve/reject/unlock/set-admin) พร้อม optimistic update
 * และ success/error toast — hook แยกจากหน้า page เพื่อลดขนาด/ความซับซ้อนของ component
 */
export function useApprovalActions() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const approvalActionMutation = useMutation({
    mutationFn: async (input: ApprovalActionInput) => {
      const res = await fetch("/api/line/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.body),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(json?.error ?? "ดำเนินการไม่สำเร็จ");
      }
      return input;
    },
    // Optimistic update: สถานะเปลี่ยนทันทีที่คลิก ไม่ต้องรอ round-trip
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: LINE_APPROVALS_KEY });
      const previous =
        queryClient.getQueryData<ApprovalListResponse>(LINE_APPROVALS_KEY);
      queryClient.setQueryData<ApprovalListResponse>(
        LINE_APPROVALS_KEY,
        (old) =>
          old
            ? {
                ...old,
                data: old.data.map((item) =>
                  item.lineUserId === input.lineUserId
                    ? { ...item, ...input.patch }
                    : item,
                ),
              }
            : old,
      );
      return { previous };
    },
    onSuccess: (_data, input) => {
      showToast({ title: input.successTitle, type: "success" });
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(LINE_APPROVALS_KEY, context.previous);
      }
      showToast({
        title: "ดำเนินการไม่สำเร็จ",
        description:
          error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        type: "error",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: LINE_APPROVALS_KEY });
      void queryClient.invalidateQueries({
        queryKey: LINE_APPROVAL_STATS_KEY,
      });
    },
  });

  // mutate เป็น stable reference (TanStack v5) — destructure ก่อนเพื่อไม่ให้
  // callback identity เปลี่ยนทุก render
  const { mutate: mutateApprovalAction } = approvalActionMutation;

  const handleApprove = useCallback(
    (item: ApprovalItem) => {
      if (!item.approvalId) return;
      mutateApprovalAction({
        body: { action: "approve", id: item.approvalId },
        lineUserId: item.lineUserId,
        patch: {
          status: "APPROVED",
          approvedAt: new Date().toISOString(),
          rejectReason: null,
        },
        successTitle: `อนุมัติ ${item.displayName ?? "ผู้ใช้"} เรียบร้อยแล้ว`,
      });
    },
    [mutateApprovalAction],
  );

  const handleRejectConfirm = useCallback(
    (item: ApprovalItem, reason: string) => {
      mutateApprovalAction({
        body: {
          action: "reject",
          id: item.approvalId ?? undefined,
          lineUserId: item.approvalId ? undefined : item.lineUserId,
          rejectReason: reason || undefined,
        },
        lineUserId: item.lineUserId,
        patch: { status: "REJECTED", rejectReason: reason || null },
        successTitle: `ปฏิเสธ ${item.displayName ?? "ผู้ใช้"} เรียบร้อยแล้ว`,
      });
    },
    [mutateApprovalAction],
  );

  const handleUnlock = useCallback(
    (item: ApprovalItem) => {
      if (!item.approvalId) return;
      mutateApprovalAction({
        body: { action: "unlock", id: item.approvalId },
        lineUserId: item.lineUserId,
        patch: { status: "PENDING", rejectReason: null },
        successTitle: `ปลดล็อค ${item.displayName ?? "ผู้ใช้"} เรียบร้อยแล้ว — รอคำขอใหม่`,
      });
    },
    [mutateApprovalAction],
  );

  const handleToggleAdmin = useCallback(
    (item: ApprovalItem) => {
      const nextIsAdmin = !item.isAdmin;
      mutateApprovalAction({
        body: {
          action: "set-admin",
          lineUserId: item.lineUserId,
          isAdmin: nextIsAdmin,
        },
        lineUserId: item.lineUserId,
        patch: { isAdmin: nextIsAdmin },
        successTitle: nextIsAdmin
          ? `ตั้ง ${item.displayName ?? "ผู้ใช้"} เป็น Admin เรียบร้อยแล้ว`
          : `ยกเลิกสิทธิ์ Admin ของ ${item.displayName ?? "ผู้ใช้"} แล้ว`,
      });
    },
    [mutateApprovalAction],
  );

  return {
    approvalActionMutation,
    handleApprove,
    handleRejectConfirm,
    handleUnlock,
    handleToggleAdmin,
  };
}

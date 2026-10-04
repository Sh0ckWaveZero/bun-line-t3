/**
 * useApprovalActions
 * Hook จัดการ actions บนหน้า LINE Approval (approve/reject/set-admin/unlock)
 * รวมถึงสถานะ loading ต่อรายการ และ dialog ยืนยันการปฏิเสธ
 */
import { useState } from "react";

import type {
  ApprovalRequest,
  ApprovalToastState,
} from "@/features/line/helpers/approvalDisplay.helpers";

interface UseApprovalActionsOptions {
  showToast: (type: ApprovalToastState["type"], msg: string) => void;
  setPermissionError: (error: string) => void;
  fetchList: () => Promise<void>;
  fetchStats: () => Promise<void>;
}

export function useApprovalActions({
  showToast,
  setPermissionError,
  fetchList,
  fetchStats,
}: UseApprovalActionsOptions) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApprovalRequest | null>(
    null,
  );

  const openRejectDialog = (req: ApprovalRequest) => {
    setRejectTarget(req);
  };

  const closeRejectDialog = () => {
    setRejectTarget(null);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/line/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", id }),
      });
      const json = await res.json();
      if (res.status === 403) {
        setPermissionError(json.error ?? "คุณไม่มีสิทธิ์ดำเนินการนี้");
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "อนุมัติไม่สำเร็จ");
      showToast("success", "อนุมัติผู้ใช้เรียบร้อยแล้ว ✅");
      await Promise.all([fetchList(), fetchStats()]);
    } catch (err: any) {
      showToast("error", err.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    const target = rejectTarget;
    setRejectTarget(null);
    try {
      const res = await fetch("/api/line/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          id: target.approvalId ?? undefined,
          lineUserId: target.approvalId ? undefined : target.lineUserId,
          rejectReason: reason || undefined,
        }),
      });
      const json = await res.json();
      if (res.status === 403) {
        setPermissionError(json.error ?? "คุณไม่มีสิทธิ์ดำเนินการนี้");
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "ปฏิเสธไม่สำเร็จ");
      showToast("success", "ปฏิเสธผู้ใช้เรียบร้อยแล้ว ❌");
      await Promise.all([fetchList(), fetchStats()]);
    } catch (err: any) {
      showToast("error", err.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetAdmin = async (req: ApprovalRequest, isAdmin: boolean) => {
    const loadingKey = `admin:${req.lineUserId}`;
    setActionLoading(loadingKey);
    try {
      const res = await fetch("/api/line/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-admin",
          lineUserId: req.lineUserId,
          isAdmin,
        }),
      });
      const json = await res.json();
      if (res.status === 403) {
        setPermissionError(json.error ?? "คุณไม่มีสิทธิ์ดำเนินการนี้");
        return;
      }
      if (!res.ok) {
        throw new Error(json.error ?? "ตั้งค่าสิทธิ์ admin ไม่สำเร็จ");
      }
      showToast(
        "success",
        isAdmin
          ? "ตั้งผู้ใช้นี้เป็น Admin เรียบร้อยแล้ว"
          : "ยกเลิกสิทธิ์ Admin เรียบร้อยแล้ว",
      );
      await fetchList();
    } catch (err: any) {
      showToast("error", err.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlock = async (req: ApprovalRequest) => {
    if (!req.approvalId) {
      showToast("error", "ไม่พบคำขออนุมัติ");
      return;
    }
    setActionLoading(req.id);
    try {
      const res = await fetch("/api/line/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unlock",
          id: req.approvalId,
        }),
      });
      const json = await res.json();
      if (res.status === 403) {
        setPermissionError(json.error ?? "คุณไม่มีสิทธิ์ดำเนินการนี้");
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "ปลดล็อคไม่สำเร็จ");
      showToast("success", "ปลดล็อคผู้ใช้เรียบร้อยแล้ว ✅");
      await Promise.all([fetchList(), fetchStats()]);
    } catch (err: any) {
      showToast("error", err.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(null);
    }
  };

  return {
    actionLoading,
    rejectTarget,
    openRejectDialog,
    closeRejectDialog,
    handleApprove,
    handleRejectConfirm,
    handleSetAdmin,
    handleUnlock,
  };
}

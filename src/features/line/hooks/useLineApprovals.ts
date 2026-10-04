/**
 * useLineApprovals
 * Hook จัดการ state และการดึงข้อมูลรายการ/สถานะคำขอ LINE Approval
 * (tab, pagination, list, stats, permission error)
 *
 * การ trigger fetch เมื่อ session พร้อมอยู่ฝั่ง page (เจ้าของ state เอง)
 * hook นี้ derive isLoading ระหว่าง render แทนการ adjust ใน effect
 */
import { useCallback, useState } from "react";

import type {
  ApprovalAuthStatus,
  ApprovalStats,
  ApprovalTab,
  ApprovalToastState,
  ListResponse,
} from "@/features/line/helpers/approvalDisplay.helpers";

interface UseLineApprovalsOptions {
  authStatus: ApprovalAuthStatus;
  showToast: (type: ApprovalToastState["type"], msg: string) => void;
  setPermissionError: (error: string) => void;
}

export function useLineApprovals({
  authStatus,
  showToast,
  setPermissionError,
}: UseLineApprovalsOptions) {
  const [activeTab, setActiveTab] = useState<ApprovalTab>("ALL");
  const [listData, setListData] = useState<ListResponse | null>(null);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [page, setPage] = useState(1);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/line/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stats" }),
      });
      if (res.status === 403) {
        const json = await res.json();
        setPermissionError(json.error ?? "คุณไม่มีสิทธิ์ดำเนินการนี้");
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setStats(json.data as ApprovalStats);
      }
    } catch {
      /* silent */
    }
  }, [setPermissionError]);

  const fetchList = useCallback(async () => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });
      if (activeTab !== "ALL") {
        params.set("status", activeTab);
      }
      const res = await fetch(`/api/line/approvals?${params.toString()}`);
      if (res.status === 403) {
        const json = await res.json();
        setPermissionError(json.error ?? "คุณไม่มีสิทธิ์ดำเนินการนี้");
        return;
      }
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const json = await res.json();
      setListData(json as ListResponse);
    } catch (err: any) {
      showToast("error", err.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setIsFetching(false);
    }
  }, [activeTab, page, showToast, setPermissionError]);

  // derive ระหว่าง render: ยังโหลดอยู่เมื่อ session ยังไม่พร้อม
  // หรือ session พร้อมแล้วแต่ fetch กำลังรันอยู่
  const isLoading =
    authStatus === "loading" || (authStatus === "authenticated" && isFetching);

  const refreshAll = useCallback(() => {
    void fetchList();
    void fetchStats();
  }, [fetchList, fetchStats]);

  const handleTabChange = useCallback((tab: ApprovalTab) => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  return {
    activeTab,
    handleTabChange,
    page,
    setPage,
    listData,
    stats,
    isLoading,
    fetchList,
    fetchStats,
    refreshAll,
  };
}

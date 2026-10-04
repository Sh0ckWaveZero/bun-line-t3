"use client";

/**
 * LineApprovalPage
 * หน้าจัดการคำขอใช้งาน LINE Messaging API (อนุมัติ/ปฏิเสธ/ตั้งสิทธิ์ Admin)
 * ประกอบจาก sections + hooks (โครงสร้าง slim composition)
 */
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useLineApproval } from "@/lib/auth/hooks/useLineApproval";
import { useSession } from "@/lib/auth/client";
import { ApprovalPageHeader } from "@/features/line/components/ApprovalPageHeader";
import { ApprovalPermissionError } from "@/features/line/components/ApprovalPermissionError";
import { ApprovalRejectDialog } from "@/features/line/components/ApprovalRejectDialog";
import { ApprovalRequestList } from "@/features/line/components/ApprovalRequestList";
import { ApprovalStatsGrid } from "@/features/line/components/ApprovalStatsGrid";
import { ApprovalTabs } from "@/features/line/components/ApprovalTabs";
import { ApprovalToast } from "@/features/line/components/ApprovalToast";
import { getApprovalTabCount } from "@/features/line/helpers/approvalDisplay.helpers";
import { useApprovalActions } from "@/features/line/hooks/useApprovalActions";
import { useLineApprovals } from "@/features/line/hooks/useLineApprovals";
import { useLineApprovalToast } from "@/features/line/hooks/useLineApprovalToast";

export function LineApprovalPage() {
  const { status: authStatus } = useSession();
  const navigate = useNavigate();
  const { needsApproval } = useLineApproval();

  const { toast, showToast } = useLineApprovalToast();
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const {
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
  } = useLineApprovals({ authStatus, showToast, setPermissionError });

  // โหลดข้อมูลเมื่อ session พร้อม + refetch เมื่อ tab/page เปลี่ยน
  // (fetchList identity เปลี่ยนตาม activeTab/page)
  useEffect(() => {
    if (authStatus === "authenticated") {
      void fetchList();
      void fetchStats();
    }
  }, [authStatus, fetchList, fetchStats]);

  const {
    actionLoading,
    rejectTarget,
    openRejectDialog,
    closeRejectDialog,
    handleApprove,
    handleRejectConfirm,
    handleSetAdmin,
    handleUnlock,
  } = useApprovalActions({
    showToast,
    setPermissionError,
    fetchList,
    fetchStats,
  });

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  if (permissionError) {
    return (
      <ApprovalPermissionError
        message={permissionError}
        onBack={() => void navigate({ to: "/dashboard" })}
      />
    );
  }

  return (
    <>
      <PendingApprovalModal open={needsApproval} />

      <div
        id="line-approval-page"
        className="bg-background text-foreground min-h-screen w-full pb-16"
      >
        <ApprovalToast toast={toast} />

        <div
          id="line-approval-container"
          className="container mx-auto max-w-6xl px-4 py-8"
        >
          <ApprovalPageHeader isLoading={isLoading} onRefresh={refreshAll} />

          <ApprovalStatsGrid stats={stats} />

          <ApprovalTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            getTabCount={(tab) => getApprovalTabCount(stats, tab)}
          />

          <ApprovalRequestList
            isLoading={isLoading}
            listData={listData}
            activeTab={activeTab}
            page={page}
            actionLoading={actionLoading}
            onApprove={(id) => void handleApprove(id)}
            onSetAdmin={(req, isAdmin) => void handleSetAdmin(req, isAdmin)}
            onUnlock={(req) => void handleUnlock(req)}
            onReject={openRejectDialog}
            onPageChange={setPage}
          />
        </div>

        <ApprovalRejectDialog
          isOpen={rejectTarget !== null}
          onClose={closeRejectDialog}
          onConfirm={(reason) => void handleRejectConfirm(reason)}
          isLoading={actionLoading !== null}
        />
      </div>
    </>
  );
}

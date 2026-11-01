"use client";

import { useSession } from "@/lib/auth/client";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useApprovalActions } from "@/features/line/hooks/useApprovalActions";
import { useLineApproval } from "@/lib/auth/hooks/useLineApproval";
import { cn } from "@/lib/utils";
import {
  TablePageSizeSelect,
  TablePagination,
} from "@/components/ui/table-pagination";
import { CircleAlert } from "lucide-react";
import { ApprovalActionsMenu } from "@/features/line/components/ApprovalActionsMenu";
import type { OpenApprovalMenu } from "@/features/line/components/ApprovalActionsMenu";
import { ApprovalPageHeader } from "@/features/line/components/ApprovalPageHeader";
import { ApprovalPermissionError } from "@/features/line/components/ApprovalPermissionError";
import { ApprovalSkeleton } from "@/features/line/components/ApprovalSkeleton";
import { ApprovalStatsSection } from "@/features/line/components/ApprovalStatsSection";
import { ApprovalTable } from "@/features/line/components/ApprovalTable";
import { ApprovalToolbar } from "@/features/line/components/ApprovalToolbar";
import {
  ApprovalFetchError,
  computeApprovalCounts,
  countRejectedWithReason,
  fetchApprovalStats,
  fetchApprovals,
  filterApprovalItems,
  findLatestPending,
  LINE_APPROVALS_KEY,
  LINE_APPROVAL_STATS_KEY,
  PAGE_SIZE_OPTIONS,
  SKELETON_REMOVE_DELAY_MS,
} from "@/features/line/line-utils/approvals";
import type {
  ApprovalItem,
  ApprovalTab,
} from "@/features/line/line-utils/approvals";
import { mapApprovalListView } from "@/features/line/line-utils/approval-views";

export function LineApprovalPage() {
  const { status: authStatus } = useSession();
  const { needsApproval } = useLineApproval();
  const {
    approvalActionMutation,
    handleApprove,
    handleRejectConfirm,
    handleUnlock,
    handleToggleAdmin,
  } = useApprovalActions();

  const [activeTab, setActiveTab] = useState<ApprovalTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [approvalMenu, setApprovalMenu] = useState<OpenApprovalMenu | null>(
    null,
  );
  const closeApprovalMenu = useCallback(() => setApprovalMenu(null), []);

  const approvalsQuery = useQuery({
    queryKey: LINE_APPROVALS_KEY,
    queryFn: fetchApprovals,
    // mapping layer แนบสตริงวันที่ที่ฟอร์แมตไว้แล้ว (นอก JSX/render path) — กัน hydration mismatch
    select: mapApprovalListView,
    enabled: authStatus === "authenticated",
  });

  const statsQuery = useQuery({
    queryKey: LINE_APPROVAL_STATS_KEY,
    queryFn: fetchApprovalStats,
    enabled: authStatus === "authenticated",
  });

  const items = useMemo(
    () => approvalsQuery.data?.data ?? [],
    [approvalsQuery.data],
  );
  const stats = statsQuery.data ?? null;
  const isFetchingList = approvalsQuery.isFetching;

  const counts = useMemo(
    () => computeApprovalCounts(stats, items),
    [stats, items],
  );

  // พิมพ์ค้นหาได้ลื่นขึ้น: ตารางอัปเดตตามหลัง input ที่ priority สูงกว่า
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredItems = useMemo(
    () => filterApprovalItems(items, activeTab, deferredSearchQuery),
    [items, activeTab, deferredSearchQuery],
  );

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstVisibleRow =
    filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleRow = Math.min(currentPage * pageSize, filteredItems.length);
  const hasFilters = Boolean(searchQuery) || activeTab !== "all";
  const isTruncated = (approvalsQuery.data?.total ?? 0) > items.length;

  const latestPending = useMemo(() => findLatestPending(items), [items]);
  const rejectedWithReason = useMemo(
    () => countRejectedWithReason(items),
    [items],
  );

  // โหลดครั้งแรก = session ยังไม่มา หรือ query กำลังยิงครั้งแรก (refetch พื้นหลังไม่นับ)
  const isInitialLoading =
    authStatus !== "authenticated" || approvalsQuery.isLoading;
  const isRevealed = !isInitialLoading;
  // skeleton ติดตั้งแต่แรก และถูกปลดหลัง reveal + fade-out จบ (set ใน timer ไม่ใช่ effect)
  const [skeletonDismissed, setSkeletonDismissed] = useState(false);
  const skeletonMounted = !skeletonDismissed;

  useEffect(() => {
    if (!isRevealed) return;
    const timer = setTimeout(
      () => setSkeletonDismissed(true),
      SKELETON_REMOVE_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [isRevealed]);

  const handleRefresh = useCallback(() => {
    void approvalsQuery.refetch();
    void statsQuery.refetch();
  }, [approvalsQuery, statsQuery]);

  const handleOpenActions = useCallback(
    (rowItem: ApprovalItem, trigger: HTMLElement) => {
      setApprovalMenu({
        item: rowItem,
        trigger,
        rect: trigger.getBoundingClientRect(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      });
    },
    [],
  );

  const fetchError =
    approvalsQuery.error instanceof ApprovalFetchError
      ? approvalsQuery.error
      : null;
  const permissionError =
    fetchError && (fetchError.status === 401 || fetchError.status === 403)
      ? fetchError.message
      : null;

  if (permissionError) {
    return <ApprovalPermissionError message={permissionError} />;
  }

  return (
    <>
      <PendingApprovalModal open={needsApproval} />

      <main className="min-h-[calc(100vh-3.5rem)] bg-[#f5f7f8] py-7 text-slate-900 dark:bg-[#0d0f11] dark:text-slate-100">
        <div className="container mx-auto px-4">
          <ApprovalPageHeader
            counts={counts}
            isFetchingList={isFetchingList}
            onRefresh={handleRefresh}
          />

          {approvalActionMutation.isError && (
            <div
              className="mt-5 flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200"
              role="alert"
            >
              <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              {approvalActionMutation.error.message}
            </div>
          )}

          <ApprovalStatsSection
            counts={counts}
            latestPending={latestPending}
            rejectedWithReason={rejectedWithReason}
          />

          <section
            className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_34px_rgba(16,24,40,0.05)] dark:border-white/[0.08] dark:bg-[#151719] dark:shadow-none"
            aria-label="รายการคำขออนุมัติ LINE users"
          >
            <div className={cn("t-skel", isRevealed && "is-revealed")}>
              {skeletonMounted && (
                <div
                  className="t-skel-skeleton is-pulsing bg-white dark:bg-[#151719]"
                  aria-hidden="true"
                >
                  <ApprovalSkeleton />
                </div>
              )}
              <div className="t-skel-content" inert={!isRevealed}>
                <div className="border-b border-slate-200 px-5 py-5 sm:px-6 dark:border-white/[0.08]">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    คำขอทั้งหมด
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {counts.all} บัญชี · {counts.PENDING} รออนุมัติ ·{" "}
                    {counts.REJECTED} ปฏิเสธ
                    {isTruncated &&
                      ` · แสดง ${items.length} รายการล่าสุดจาก ${approvalsQuery.data?.total ?? 0}`}
                  </p>
                </div>

                <ApprovalToolbar
                  activeTab={activeTab}
                  counts={counts}
                  onTabChange={(tab) => {
                    setActiveTab(tab);
                    setPage(1);
                  }}
                  searchQuery={searchQuery}
                  onSearchChange={(query) => {
                    setSearchQuery(query);
                    setPage(1);
                  }}
                />

                <ApprovalTable
                  rows={visibleItems}
                  onOpenActions={handleOpenActions}
                  hasFilters={hasFilters}
                />

                <footer className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-white/[0.08] dark:text-slate-400">
                  <TablePageSizeSelect
                    value={pageSize}
                    options={PAGE_SIZE_OPTIONS}
                    onChange={(next) => {
                      setPageSize(next);
                      setPage(1);
                    }}
                  />
                  <TablePagination
                    firstVisibleRow={firstVisibleRow}
                    lastVisibleRow={lastVisibleRow}
                    total={filteredItems.length}
                    unit="คน"
                    currentPage={currentPage}
                    pageCount={pageCount}
                    onPageChange={setPage}
                  />
                </footer>
              </div>
            </div>
          </section>
        </div>

        {approvalMenu && (
          <ApprovalActionsMenu
            key={approvalMenu.item.id}
            menu={approvalMenu}
            isBusy={approvalActionMutation.isPending}
            onClose={closeApprovalMenu}
            onApprove={handleApprove}
            onReject={handleRejectConfirm}
            onUnlock={handleUnlock}
            onToggleAdmin={handleToggleAdmin}
          />
        )}
      </main>
    </>
  );
}

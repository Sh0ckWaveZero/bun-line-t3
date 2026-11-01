"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "@/lib/auth/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/common/ToastProvider";
import { PermissionRow } from "@/features/line/components/PermissionRow";
import { PermissionFilterTabs } from "@/features/line/components/PermissionFilterTabs";
import { PermissionTableHead } from "@/features/line/components/PermissionTableHead";
import { PermissionToolbar } from "@/features/line/components/PermissionToolbar";
import { PermissionsSkeleton } from "@/features/line/components/PermissionsSkeleton";
import { EmptyPermissionsState } from "@/features/line/components/PermissionsEmptyState";
import type {
  LineApproval,
  PermissionKey,
} from "@/features/line/types/permissions.types";
import { cn } from "@/lib/utils";
import {
  TablePageSizeSelect,
  TablePagination,
} from "@/components/ui/table-pagination";
import { AlertTriangle, Users } from "lucide-react";
import {
  countPermissionStatuses,
  fetchPermissions,
  filterPermissionApprovals,
  LINE_PERMISSIONS_KEY,
  PAGE_SIZE_OPTIONS,
  SKELETON_REMOVE_DELAY_MS,
} from "@/features/line/line-utils/permissions";
import type {
  FilterStatus,
  TogglePermissionInput,
} from "@/features/line/line-utils/permissions";

export function LinePermissionsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  const {
    data: approvals = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: LINE_PERMISSIONS_KEY,
    queryFn: fetchPermissions,
    enabled: !!session?.isAdmin,
  });

  // Optimistic update: สถานะเปลี่ยนทันทีที่คลิก ไม่ต้องรอ round-trip + refetch ทั้งลิสต์
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ lineUserId, permissions }: TogglePermissionInput) => {
      const res = await fetch("/api/line/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId, ...permissions }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "ไม่สามารถอัปเดตสิทธิ์ได้");
      }
      const data = await res.json();
      return data.data as LineApproval;
    },
    onMutate: async ({ lineUserId, permissions }) => {
      await queryClient.cancelQueries({ queryKey: LINE_PERMISSIONS_KEY });
      const previous =
        queryClient.getQueryData<LineApproval[]>(LINE_PERMISSIONS_KEY);
      queryClient.setQueryData<LineApproval[]>(LINE_PERMISSIONS_KEY, (old) =>
        old?.map((approval) =>
          approval.lineUserId === lineUserId
            ? { ...approval, ...permissions }
            : approval,
        ),
      );
      return { previous };
    },
    onSuccess: () => {
      showToast({ title: "อัปเดตสิทธิ์สำเร็จ", type: "success" });
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(LINE_PERMISSIONS_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: LINE_PERMISSIONS_KEY });
    },
  });

  // mutate เป็น stable reference (TanStack v5) — destructure ก่อนเพื่อไม่ให้
  // callback identity เปลี่ยนทุก render และทำให้ PermissionRow ที่ memo ไว้ re-render
  const { mutate: mutatePermission } = updatePermissionMutation;

  const handleTogglePermission = useCallback(
    (lineUserId: string, permission: PermissionKey, value: boolean) => {
      mutatePermission({
        lineUserId,
        permissions: { [permission]: value },
      });
    },
    [mutatePermission],
  );

  // พิมพ์ค้นหาได้ลื่นขึ้น: ตารางอัปเดตตามหลัง input ที่ priority สูงกว่า
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredApprovals = useMemo(
    () =>
      filterPermissionApprovals(approvals, filterStatus, deferredSearchQuery),
    [approvals, filterStatus, deferredSearchQuery],
  );

  const statusCounts = useMemo(
    () => countPermissionStatuses(approvals),
    [approvals],
  );

  const pageCount = Math.max(1, Math.ceil(filteredApprovals.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleApprovals = filteredApprovals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstVisibleRow =
    filteredApprovals.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleRow = Math.min(
    currentPage * pageSize,
    filteredApprovals.length,
  );
  const hasFilters = Boolean(searchQuery) || filterStatus !== "all";

  // โหลดครั้งแรก = session ยังไม่มา หรือ query กำลังยิงครั้งแรก (refetch พื้นหลังไม่นับ)
  const isInitialLoading = isLoading || !session;
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

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#f5f7f8] py-7 text-slate-900 dark:bg-[#0d0f11] dark:text-slate-100">
      <div className="container mx-auto px-4">
        <header>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-none font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
              จัดการสิทธิ์ LINE Features
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Users className="size-3.5" aria-hidden="true" />
              {statusCounts.approved} อนุมัติแล้ว
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            อนุมัติสิทธิ์การใช้งานฟีเจอร์ต่างๆ สำหรับ LINE users · DCA
            อัตโนมัติใช้เฉพาะแชตส่วนตัว
          </p>
        </header>

        {updatePermissionMutation.isError && (
          <div
            role="alert"
            className="mt-5 flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200"
          >
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {updatePermissionMutation.error.message}
          </div>
        )}

        <section
          className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_34px_rgba(16,24,40,0.05)] dark:border-white/[0.08] dark:bg-[#151719] dark:shadow-none"
          aria-label="รายการสิทธิ์ LINE users"
        >
          <div className={cn("t-skel", isRevealed && "is-revealed")}>
            {skeletonMounted && (
              <div
                className="t-skel-skeleton is-pulsing bg-white dark:bg-[#151719]"
                aria-hidden="true"
              >
                <PermissionsSkeleton />
              </div>
            )}
            <div className="t-skel-content" inert={!isRevealed}>
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6 dark:border-white/[0.08]">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  สิทธิ์ผู้ใช้ทั้งหมด
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {approvals.length} คน · {statusCounts.pending} รออนุมัติ ·{" "}
                  {statusCounts.rejected} ปฏิเสธ
                </p>
              </div>

              <PermissionFilterTabs
                filterStatus={filterStatus}
                statusCounts={statusCounts}
                onFilterChange={(status) => {
                  setFilterStatus(status);
                  setPage(1);
                }}
              />

              <PermissionToolbar
                searchQuery={searchQuery}
                onSearchChange={(query) => {
                  setSearchQuery(query);
                  setPage(1);
                }}
                isFetching={isFetching}
                onRefresh={() => void refetch()}
              />

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <caption className="sr-only">
                    รายชื่อ LINE users และสิทธิ์การใช้งานฟีเจอร์
                  </caption>
                  <PermissionTableHead />
                  <tbody>
                    {visibleApprovals.map((approval) => (
                      <PermissionRow
                        key={approval.id}
                        approval={approval}
                        onTogglePermission={handleTogglePermission}
                      />
                    ))}
                  </tbody>
                </table>
                {visibleApprovals.length === 0 && (
                  <EmptyPermissionsState hasFilters={hasFilters} />
                )}
              </div>

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
                  total={filteredApprovals.length}
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
    </main>
  );
}

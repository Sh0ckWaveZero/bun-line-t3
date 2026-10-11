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
import type {
  LineApproval,
  PermissionKey,
  PermissionUpdate,
} from "@/features/line/types/permissions.types";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  UserCheck,
  Users,
} from "lucide-react";

const LINE_PERMISSIONS_KEY = ["line-permissions"] as const;

type FilterStatus = "all" | "pending" | "approved" | "rejected";

const PERMISSION_TABS = [
  ["all", "ทั้งหมด"],
  ["pending", "รออนุมัติ"],
  ["approved", "อนุมัติแล้ว"],
  ["rejected", "ปฏิเสธ"],
] as const satisfies readonly [FilterStatus, string][];

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const STATUS_COUNT_KEYS: Record<FilterStatus, LineApproval["status"] | null> = {
  all: null,
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
};

const SKELETON_ROW_COUNT = 5;
/** skeleton อยู่ต่อหลัง reveal เพื่อเล่น fade-out ให้จบ (--reveal-dur 400ms + buffer) */
const SKELETON_REMOVE_DELAY_MS = 450;

function PermissionsSkeleton() {
  return (
    <div>
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6 dark:border-white/[0.08]">
        <div className="skel-bar h-4 w-44 rounded-md" />
        <div className="skel-bar mt-2.5 h-3 w-64 rounded-md" />
      </div>
      <div className="flex gap-6 border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-white/[0.08]">
        {Array.from({ length: PERMISSION_TABS.length }, (_, index) => (
          <div key={index} className="skel-bar h-4 w-16 rounded-md" />
        ))}
      </div>
      <div className="border-b border-slate-200 px-5 py-3 sm:px-6 dark:border-white/[0.08]">
        <div className="skel-bar h-10 max-w-[340px] rounded-xl" />
      </div>
      <div>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 border-b border-slate-200/80 px-3 py-4 dark:border-white/[0.07]"
          >
            <div className="skel-bar size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="skel-bar h-3.5 w-40 rounded-md" />
              <div className="skel-bar mt-1.5 h-3 w-52 rounded-md" />
            </div>
            <div className="skel-bar h-6 w-20 shrink-0 rounded-md" />
            <div className="flex shrink-0 gap-16 pr-2">
              {Array.from({ length: 4 }, (_, checkboxIndex) => (
                <div
                  key={checkboxIndex}
                  className="skel-bar size-5 rounded-md"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 sm:px-6 dark:border-white/[0.08]">
        <div className="skel-bar h-5 w-24 rounded-md" />
        <div className="skel-bar h-5 w-40 rounded-md" />
      </div>
    </div>
  );
}

interface TogglePermissionInput {
  lineUserId: string;
  permissions: PermissionUpdate;
}

async function fetchPermissions(): Promise<LineApproval[]> {
  const res = await fetch("/api/line/permissions");
  if (!res.ok) {
    throw new Error("ไม่สามารถดึงข้อมูลสิทธิ์ได้");
  }
  const data = await res.json();
  return data.data;
}

function EmptyPermissionsState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 dark:border-white/[0.1] dark:bg-white/[0.06]">
        <Users className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {hasFilters ? "ไม่พบผู้ใช้ที่ตรงกับตัวกรอง" : "ยังไม่มีผู้ใช้ขออนุมัติ"}
      </h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        {hasFilters
          ? "ลองเปลี่ยนคำค้นหาหรือสถานะ แล้วค้นหาอีกครั้ง"
          : "เมื่อมีผู้ใช้ขออนุมัติผ่าน LINE จะแสดงรายการในหน้านี้"}
      </p>
    </div>
  );
}

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

  const filteredApprovals = useMemo(() => {
    const statusFilter = STATUS_COUNT_KEYS[filterStatus];
    const query = deferredSearchQuery.trim().toLowerCase();
    return approvals.filter((approval) => {
      if (statusFilter && approval.status !== statusFilter) {
        return false;
      }
      if (query) {
        return (
          approval.displayName?.toLowerCase().includes(query) ||
          approval.lineUserId.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [approvals, filterStatus, deferredSearchQuery]);

  const statusCounts = useMemo(() => {
    const counts = {
      all: approvals.length,
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    for (const approval of approvals) {
      if (approval.status === "PENDING") counts.pending += 1;
      else if (approval.status === "APPROVED") counts.approved += 1;
      else if (approval.status === "REJECTED") counts.rejected += 1;
    }
    return counts;
  }, [approvals]);

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

              <div
                className="flex gap-6 overflow-x-auto border-b border-slate-200 px-5 sm:px-6 dark:border-white/[0.08]"
                role="group"
                aria-label="กรองตามสถานะ"
              >
                {PERMISSION_TABS.map(([value, label]) => {
                  const isActive = filterStatus === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setFilterStatus(value);
                        setPage(1);
                      }}
                      className={cn(
                        "relative flex shrink-0 cursor-pointer items-center gap-2 py-3.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none",
                        isActive
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
                      )}
                    >
                      {label}
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px]",
                          isActive
                            ? "bg-slate-100 text-slate-700 dark:bg-white/[0.1] dark:text-slate-200"
                            : "bg-slate-100/70 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400",
                        )}
                      >
                        {statusCounts[value]}
                      </span>
                      {isActive && (
                        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-slate-900 dark:bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-white/[0.08]">
                <div className="relative w-full sm:max-w-[340px]">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <label htmlFor="permission-search" className="sr-only">
                    ค้นหาผู้ใช้
                  </label>
                  <input
                    id="permission-search"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder="ค้นหาชื่อ หรือ LINE User ID…"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  aria-label="รีเฟรชรายการสิทธิ์ LINE"
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none sm:self-auto dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08]"
                >
                  <RefreshCw
                    className={cn(
                      "size-4 motion-reduce:animate-none",
                      isFetching && "animate-spin",
                    )}
                    aria-hidden="true"
                  />
                  รีเฟรช
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <caption className="sr-only">
                    รายชื่อ LINE users และสิทธิ์การใช้งานฟีเจอร์
                  </caption>
                  <thead className="bg-slate-50/80 dark:bg-white/[0.02]">
                    <tr className="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                      <th
                        scope="col"
                        className="min-w-[260px] px-3 py-3 text-left"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="min-w-[130px] px-3 py-3 text-left"
                      >
                        สถานะ
                      </th>
                      <th
                        scope="col"
                        className="min-w-[120px] px-3 py-3 text-center"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarCheck
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          รายงานเข้างาน
                        </span>
                      </th>
                      <th
                        scope="col"
                        className="min-w-[120px] px-3 py-3 text-center"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <UserCheck className="size-3.5" aria-hidden="true" />
                          ขอลา
                        </span>
                      </th>
                      <th
                        scope="col"
                        className="min-w-[120px] px-3 py-3 text-center"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Bell className="size-3.5" aria-hidden="true" />
                          แจ้งเตือน
                        </span>
                      </th>
                      <th
                        scope="col"
                        className="min-w-[120px] px-3 py-3 text-center"
                      >
                        บันทึก DCA อัตโนมัติ
                      </th>
                    </tr>
                  </thead>
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
                <label className="flex items-center gap-2">
                  แถวต่อหน้า
                  <span className="relative">
                    <select
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setPage(1);
                      }}
                      className="h-8 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-2.5 pr-7 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-200"
                    >
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <span>
                    {firstVisibleRow}–{lastVisibleRow} จาก{" "}
                    {filteredApprovals.length} คน
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      aria-label="ไปหน้าก่อนหน้า"
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white/[0.08]"
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                    </button>
                    {Array.from({ length: pageCount }, (_, index) => index + 1)
                      .slice(0, 5)
                      .map((pageNumber) => (
                        <button
                          key={pageNumber}
                          type="button"
                          aria-current={
                            currentPage === pageNumber ? "page" : undefined
                          }
                          onClick={() => setPage(pageNumber)}
                          className={cn(
                            "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none",
                            currentPage === pageNumber
                              ? "bg-slate-200 text-slate-900 dark:bg-white/[0.12] dark:text-white"
                              : "hover:bg-slate-100 dark:hover:bg-white/[0.08]",
                          )}
                        >
                          {pageNumber}
                        </button>
                      ))}
                    <button
                      type="button"
                      disabled={currentPage === pageCount}
                      onClick={() =>
                        setPage((current) => Math.min(pageCount, current + 1))
                      }
                      aria-label="ไปหน้าถัดไป"
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white/[0.08]"
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

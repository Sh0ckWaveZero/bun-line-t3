import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  type LucideIcon,
} from "lucide-react";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DisplayApprovalStatus = ApprovalStatus | "UNREQUESTED";
export type ApprovalTab = "all" | DisplayApprovalStatus;

export interface ApprovalItem {
  id: string;
  approvalId: string | null;
  accountId: string;
  lineUserId: string;
  displayName: string | null;
  pictureUrl: string | null;
  statusMessage: string | null;
  reason: string | null;
  rejectReason: string | null;
  status: DisplayApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  expiresAt: string | null;
  notifiedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  userName?: string | null;
  userEmail?: string | null;
  isAdmin?: boolean;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  accountsTotal: number;
}

export interface ApprovalListResponse {
  data: ApprovalItem[];
  total: number;
}

export interface ApprovalActionInput {
  body: Record<string, unknown>;
  lineUserId: string;
  patch: Partial<ApprovalItem>;
  successTitle: string;
}

export const LINE_APPROVALS_KEY = ["line-approvals"] as const;
export const LINE_APPROVAL_STATS_KEY = ["line-approval-stats"] as const;

/** ดึงรายการบัญชี LINE ทั้งหมดครั้งเดียวแล้วกรอง/แบ่งหน้า client-side (เหมือน cron-jobs) */
export const APPROVALS_FETCH_LIMIT = 500;

export const APPROVAL_TABS = [
  ["all", "ทั้งหมด"],
  ["PENDING", "รออนุมัติ"],
  ["APPROVED", "อนุมัติแล้ว"],
  ["REJECTED", "ปฏิเสธ"],
  ["UNREQUESTED", "ยังไม่ขอ"],
] as const satisfies readonly [ApprovalTab, string][];

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export const STATUS_META: Record<
  DisplayApprovalStatus,
  { label: string; badgeClass: string; dotClass: string; Icon: LucideIcon }
> = {
  PENDING: {
    label: "รอการอนุมัติ",
    badgeClass:
      "border-amber-400/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dotClass: "bg-amber-500 dark:bg-amber-400",
    Icon: Clock,
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    badgeClass:
      "border-emerald-400/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dotClass: "bg-emerald-500 dark:bg-emerald-400",
    Icon: CircleCheck,
  },
  REJECTED: {
    label: "ปฏิเสธแล้ว",
    badgeClass:
      "border-rose-400/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    dotClass: "bg-rose-500 dark:bg-rose-400",
    Icon: CircleX,
  },
  UNREQUESTED: {
    label: "ยังไม่ขออนุมัติ",
    badgeClass:
      "border-slate-400/20 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    dotClass: "bg-slate-400 dark:bg-slate-500",
    Icon: CircleAlert,
  },
};

export const SEGMENT_BAR_CLASSES: Record<DisplayApprovalStatus, string> = {
  PENDING: "bg-amber-400 dark:bg-amber-400/90",
  APPROVED: "bg-emerald-400 dark:bg-emerald-400/90",
  REJECTED: "bg-rose-400 dark:bg-rose-400/90",
  UNREQUESTED: "bg-slate-300 dark:bg-slate-600",
};

export const SKELETON_ROW_COUNT = 5;
/** skeleton อยู่ต่อหลัง reveal เพื่อเล่น fade-out ให้จบ (--reveal-dur 400ms + buffer) */
export const SKELETON_REMOVE_DELAY_MS = 450;

export class ApprovalFetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** แปลง error จากการดึงรายการเป็นข้อความ "ไม่มีสิทธิ์" เมื่อ status เป็น 401/403 (helper นอก component) */
export const getApprovalPermissionMessage = (error: unknown): string | null => {
  const fetchError = error instanceof ApprovalFetchError ? error : null;
  return fetchError && (fetchError.status === 401 || fetchError.status === 403)
    ? fetchError.message
    : null;
};

export async function fetchApprovals(): Promise<ApprovalListResponse> {
  const res = await fetch(`/api/line/approvals?limit=${APPROVALS_FETCH_LIMIT}`);
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new ApprovalFetchError(
      json?.error ?? "ไม่สามารถดึงรายการคำขอได้",
      res.status,
    );
  }
  return (await res.json()) as ApprovalListResponse;
}

export async function fetchApprovalStats(): Promise<ApprovalStats> {
  const res = await fetch("/api/line/approvals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "stats" }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new ApprovalFetchError(
      json?.error ?? "ไม่สามารถดึงสถิติได้",
      res.status,
    );
  }
  const json = await res.json();
  return json.data as ApprovalStats;
}

/** นับจำนวนตามสถานะสำหรับแท็บกรองและการ์ดสรุป (helper นอก component) */
export const computeApprovalCounts = (
  stats: ApprovalStats | null,
  items: readonly ApprovalItem[],
): Record<ApprovalTab, number> => ({
  all: stats?.accountsTotal ?? items.length,
  PENDING: stats?.pending ?? 0,
  APPROVED: stats?.approved ?? 0,
  REJECTED: stats?.rejected ?? 0,
  UNREQUESTED: items.filter((item) => item.status === "UNREQUESTED").length,
});

/** กรองตามแท็บสถานะ + คำค้นหา (helper นอก component) */
export const filterApprovalItems = <T extends ApprovalItem>(
  items: readonly T[],
  activeTab: ApprovalTab,
  searchQuery: string,
): T[] => {
  const query = searchQuery.trim().toLowerCase();
  return items.filter((item) => {
    if (activeTab !== "all" && item.status !== activeTab) {
      return false;
    }
    if (query) {
      return (
        item.displayName?.toLowerCase().includes(query) ||
        item.userEmail?.toLowerCase().includes(query) ||
        item.lineUserId.toLowerCase().includes(query)
      );
    }
    return true;
  });
};

/** คำขอรออนุมัติล่าสุด (helper นอก component) */
export const findLatestPending = <T extends ApprovalItem>(
  items: readonly T[],
): T | undefined =>
  [...items]
    .filter((item) => item.status === "PENDING")
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )[0];

/** จำนวนรายการปฏิเสธที่บันทึกเหตุผลไว้ (helper นอก component) */
export const countRejectedWithReason = (
  items: readonly ApprovalItem[],
): number =>
  items.filter((item) => item.status === "REJECTED" && item.rejectReason)
    .length;

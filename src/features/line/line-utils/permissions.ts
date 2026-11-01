import type {
  LineApproval,
  PermissionUpdate,
} from "@/features/line/types/permissions.types";

export const LINE_PERMISSIONS_KEY = ["line-permissions"] as const;

export type FilterStatus = "all" | "pending" | "approved" | "rejected";

export const PERMISSION_TABS = [
  ["all", "ทั้งหมด"],
  ["pending", "รออนุมัติ"],
  ["approved", "อนุมัติแล้ว"],
  ["rejected", "ปฏิเสธ"],
] as const satisfies readonly [FilterStatus, string][];

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export const STATUS_COUNT_KEYS: Record<FilterStatus, LineApproval["status"] | null> = {
  all: null,
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
};

export const SKELETON_ROW_COUNT = 5;
/** skeleton อยู่ต่อหลัง reveal เพื่อเล่น fade-out ให้จบ (--reveal-dur 400ms + buffer) */
export const SKELETON_REMOVE_DELAY_MS = 450;

export interface PermissionStatusCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface TogglePermissionInput {
  lineUserId: string;
  permissions: PermissionUpdate;
}

export async function fetchPermissions(): Promise<LineApproval[]> {
  const res = await fetch("/api/line/permissions");
  if (!res.ok) {
    throw new Error("ไม่สามารถดึงข้อมูลสิทธิ์ได้");
  }
  const data = await res.json();
  return data.data;
}

/** นับจำนวนตามสถานะสำหรับแท็บกรอง (helper นอก component) */
export const countPermissionStatuses = (
  approvals: readonly LineApproval[],
): PermissionStatusCounts => {
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
};

/** กรองตามแท็บสถานะ + คำค้นหา (helper นอก component) */
export const filterPermissionApprovals = (
  approvals: readonly LineApproval[],
  filterStatus: FilterStatus,
  searchQuery: string,
): LineApproval[] => {
  const statusFilter = STATUS_COUNT_KEYS[filterStatus];
  const query = searchQuery.trim().toLowerCase();
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
};

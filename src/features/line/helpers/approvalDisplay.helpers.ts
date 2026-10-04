/**
 * LINE Approval display helpers
 * Pure helpers + shared types สำหรับหน้า LINE Approval (isomorphic)
 */

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DisplayApprovalStatus = ApprovalStatus | "UNREQUESTED";
export type ApprovalTab = "ALL" | ApprovalStatus;

/** สถานะ session จาก useSession() */
export type ApprovalAuthStatus =
  "loading" | "authenticated" | "unauthenticated";

/** สถานะ toast แจ้งเตือนบนหน้า */
export interface ApprovalToastState {
  type: "success" | "error";
  msg: string;
}

export interface ApprovalRequest {
  id: string;
  approvalId?: string | null;
  accountId?: string;
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
  updatedAt: string;
  userName?: string | null;
  userEmail?: string | null;
  isAdmin?: boolean;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  accountsTotal?: number;
}

export interface ListResponse {
  data: ApprovalRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const APPROVAL_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  return APPROVAL_DATE_FORMATTER.format(new Date(dateStr));
};

/** นับจำนวนรายการตาม tab จากสถิติ */
export const getApprovalTabCount = (
  stats: ApprovalStats | null,
  tab: ApprovalTab,
): number => {
  if (!stats) return 0;
  if (tab === "ALL") return stats.accountsTotal ?? stats.total;
  if (tab === "PENDING") return stats.pending;
  if (tab === "APPROVED") return stats.approved;
  return stats.rejected;
};

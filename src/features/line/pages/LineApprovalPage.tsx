"use client";

import { useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth/client";
import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  RefreshCw,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  ShieldPlus,
  User,
} from "lucide-react";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useLineApproval } from "@/lib/auth/hooks/useLineApproval";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
type DisplayApprovalStatus = ApprovalStatus | "UNREQUESTED";
type ApprovalTab = "ALL" | ApprovalStatus;

interface ApprovalRequest {
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

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  accountsTotal?: number;
}

interface ListResponse {
  data: ApprovalRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusConfig: Record<
  DisplayApprovalStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  UNREQUESTED: {
    label: "ยังไม่มีคำขอ",
    color:
      "border border-slate-300 bg-slate-200 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  PENDING: {
    label: "รอการอนุมัติ",
    color:
      "border border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-300",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    color:
      "border border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  REJECTED: {
    label: "ปฏิเสธแล้ว",
    color:
      "border border-red-300 bg-red-100 text-red-900 dark:border-red-700/60 dark:bg-red-900/30 dark:text-red-300",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const tabConfig: Record<ApprovalTab, { label: string; icon: React.ReactNode }> =
  {
    ALL: {
      label: "ทั้งหมด",
      icon: <Users className="h-3.5 w-3.5" />,
    },
    PENDING: {
      label: statusConfig.PENDING.label,
      icon: statusConfig.PENDING.icon,
    },
    APPROVED: {
      label: statusConfig.APPROVED.label,
      icon: statusConfig.APPROVED.icon,
    },
    REJECTED: {
      label: statusConfig.REJECTED.label,
      icon: statusConfig.REJECTED.icon,
    },
  };

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
};

function StatsCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardContent className="p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`shrink-0 rounded-lg p-2.5 ${color}`}>{icon}</div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-400">
              {label}
            </p>
            <p className="text-2xl leading-tight font-bold tabular-nums">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: DisplayApprovalStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs leading-none font-medium ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function UserAvatar({
  pictureUrl,
  displayName,
}: {
  pictureUrl: string | null;
  displayName: string | null;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const initials = (displayName ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (pictureUrl && !hasImageError) {
    return (
      <img
        src={pictureUrl}
        alt={displayName ?? "user"}
        className="ring-border h-12 w-12 shrink-0 rounded-full object-cover ring-2"
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-200 to-slate-300 text-sm font-semibold text-slate-700 ring-2 ring-slate-300 dark:from-slate-700 dark:to-slate-800 dark:text-slate-200 dark:ring-slate-600"
      aria-label={displayName ?? "ผู้ใช้ LINE"}
    >
      {initials === "?" ? <User className="h-5 w-5" /> : initials}
    </div>
  );
}

function RejectDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background w-full max-w-md rounded-xl shadow-xl">
        <div className="border-border border-b p-5">
          <h3 className="font-semibold">ยืนยันการปฏิเสธ</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            กรุณาระบุเหตุผลในการปฏิเสธ (ไม่บังคับ)
          </p>
        </div>
        <div className="p-5">
          <textarea
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            rows={3}
            placeholder="เช่น ไม่ผ่านเกณฑ์การใช้งาน, ข้อมูลไม่ครบ..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
          <p className="text-muted-foreground mt-1 text-right text-xs">
            {reason.length}/500
          </p>
        </div>
        <div className="border-border flex justify-end gap-2 border-t p-5">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
          >
            {isLoading ? "กำลังดำเนินการ..." : "ยืนยันปฏิเสธ"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function LineApprovalPage() {
  const { data: session, status: authStatus } = useSession();
  const navigate = useNavigate();
  const { needsApproval } = useLineApproval();

  const [activeTab, setActiveTab] = useState<ApprovalTab>("ALL");
  const [listData, setListData] = useState<ListResponse | null>(null);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApprovalRequest | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

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
  }, []);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      void fetchList();
      void fetchStats();
    } else if (authStatus !== "loading") {
      setIsLoading(false);
    }
  }, [fetchList, fetchStats, authStatus]);

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

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  const getTabCount = (tab: ApprovalTab): number => {
    if (!stats) return 0;
    if (tab === "ALL") return stats.accountsTotal ?? stats.total;
    if (tab === "PENDING") return stats.pending;
    if (tab === "APPROVED") return stats.approved;
    return stats.rejected;
  };

  if (permissionError) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <div className="border-border bg-card max-w-md rounded-xl border p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-foreground mb-2 text-xl font-bold">
            ไม่มีสิทธิ์เข้าถึง
          </h2>
          <p className="text-muted-foreground mb-6">{permissionError}</p>
          <Button
            onClick={() => void navigate({ to: "/dashboard" })}
            variant="outline"
          >
            กลับหน้าหลัก
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PendingApprovalModal open={needsApproval} />

      <div
        id="line-approval-page"
        className="min-h-screen w-full bg-background pb-16 text-foreground"
      >
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {toast.msg}
          </div>
        )}

        <div
          id="line-approval-container"
          className="container mx-auto max-w-6xl px-4 py-8"
        >
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-100 p-3 dark:bg-green-900/30">
                <MessageSquare className="h-6 w-6 text-green-700 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">
                  LINE Approval
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  จัดการคำขอใช้งาน LINE Messaging API
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void fetchList();
                void fetchStats();
              }}
              disabled={isLoading}
              className="gap-2 border-border bg-card text-foreground hover:bg-muted/50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              รีเฟรช
            </Button>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              label="รอการอนุมัติ"
              value={stats?.pending ?? 0}
              icon={<Clock className="h-5 w-5 text-amber-700 dark:text-amber-400" />}
              color="bg-amber-100 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:ring-amber-700/50"
            />
            <StatsCard
              label="อนุมัติแล้ว"
              value={stats?.approved ?? 0}
              icon={<CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              color="bg-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:ring-emerald-700/50"
            />
            <StatsCard
              label="ปฏิเสธแล้ว"
              value={stats?.rejected ?? 0}
              icon={<XCircle className="h-5 w-5 text-red-700 dark:text-red-400" />}
              color="bg-red-100 ring-1 ring-red-200 dark:bg-red-900/30 dark:ring-red-700/50"
            />
            <StatsCard
              label="ทั้งหมด"
              value={stats?.accountsTotal ?? stats?.total ?? 0}
              icon={<Users className="h-5 w-5 text-blue-700 dark:text-blue-400" />}
              color="bg-blue-100 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:ring-blue-700/50"
            />
          </div>

          <div
            className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-white/10"
            role="tablist"
            aria-label="สถานะคำขอ LINE Approval"
          >
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={`-mb-px inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "border-green-600 text-slate-950 dark:border-green-400 dark:text-slate-50"
                    : "border-transparent text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {tabConfig[tab].icon}
                  {tabConfig[tab].label}
                </span>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-[11px] leading-none font-bold text-slate-700 tabular-nums dark:bg-white/10 dark:text-slate-300">
                  {getTabCount(tab)}
                </span>
              </button>
            ))}
          </div>

          <Card className="border-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-slate-950 dark:text-slate-50">
                รายการคำขอ — {tabConfig[activeTab].label}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                {listData ? `พบ ${listData.total} รายการ` : "กำลังโหลด..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading || !listData ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-500 dark:text-slate-400" />
                </div>
              ) : !listData.data.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquare className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="font-medium text-slate-600 dark:text-slate-400">
                    ไม่มีรายการ{tabConfig[activeTab].label}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-white/10">
                  {listData.data.map((req) => (
                    <div
                      key={req.id}
                      id={`approval-row-${req.id}`}
                      className="grid gap-4 p-4 transition-colors hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center dark:hover:bg-white/[0.03]"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <UserAvatar
                          pictureUrl={req.pictureUrl}
                          displayName={req.displayName}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-950 dark:text-slate-50">
                            {req.displayName ?? "ไม่ระบุชื่อ"}
                          </p>
                          <p className="truncate font-mono text-xs text-slate-600 dark:text-slate-400">
                            {req.lineUserId}
                          </p>
                          {req.userEmail && (
                            <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                              {req.userEmail}
                            </p>
                          )}
                          {req.statusMessage && (
                            <p className="truncate text-xs text-slate-600 italic dark:text-slate-400">
                              &quot;{req.statusMessage}&quot;
                            </p>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {req.isAdmin && (
                              <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-sky-300 bg-sky-100 px-2.5 text-xs leading-none font-medium text-sky-900 dark:border-sky-700/60 dark:bg-sky-900/35 dark:text-sky-300">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Admin
                              </span>
                            )}
                            <StatusBadge status={req.status} />
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {formatDate(req.createdAt)}
                            </span>
                          </div>
                          {req.rejectReason && (
                            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                              เหตุผล: {req.rejectReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                        <Button
                          size="sm"
                          variant={req.isAdmin ? "outline" : "default"}
                          className={
                            req.isAdmin
                              ? "gap-1.5 border-sky-300 text-sky-800 hover:bg-sky-50 dark:border-sky-700/60 dark:text-sky-300 dark:hover:bg-sky-900/20"
                              : "gap-1.5 bg-sky-600 text-white hover:bg-sky-700"
                          }
                          onClick={() => void handleSetAdmin(req, !req.isAdmin)}
                          disabled={actionLoading === `admin:${req.lineUserId}`}
                        >
                          {req.isAdmin ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <ShieldPlus className="h-4 w-4" />
                          )}
                          {actionLoading === `admin:${req.lineUserId}`
                            ? "กำลังดำเนินการ..."
                            : req.isAdmin
                              ? "ยกเลิก Admin"
                              : "ตั้งเป็น Admin"}
                        </Button>
                        {req.status === "REJECTED" && req.approvalId ? (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => void handleUnlock(req)}
                            disabled={actionLoading === req.id}
                          >
                            <RefreshCw className="h-4 w-4" />
                            {actionLoading === req.id
                              ? "กำลังดำเนินการ..."
                              : "ขอใหม่"}
                          </Button>
                        ) : (
                          <>
                            {req.status === "PENDING" && (
                              <Button
                                size="sm"
                                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={() => void handleApprove(req.id)}
                                disabled={actionLoading === req.id}
                              >
                                <CheckCircle className="h-4 w-4" />
                                {actionLoading === req.id
                                  ? "กำลังดำเนินการ..."
                                  : "อนุมัติ"}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1.5"
                              onClick={() => setRejectTarget(req)}
                              disabled={actionLoading === req.id}
                            >
                              <XCircle className="h-4 w-4" />
                              ปฏิเสธ
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {listData && listData.total > 0 && (
                <div className="border-t border-slate-200 px-4 dark:border-white/10">
                  <Pagination
                    currentPage={page}
                    totalPages={listData.totalPages}
                    onPageChange={(nextPage) => setPage(nextPage)}
                    idPrefix="line-approval-pagination"
                    classNames={{
                      info: "text-slate-600 dark:text-slate-400",
                      button:
                        "border-border bg-card text-foreground hover:bg-muted/50",
                      activeButton:
                        "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:text-slate-950 dark:hover:bg-green-400",
                      mobileCurrent:
                        "bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-slate-100",
                      ellipsis: "text-slate-500 dark:text-slate-400",
                      input:
                        "border-border bg-card text-foreground placeholder:text-muted-foreground",
                      cancelButton:
                        "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10",
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <RejectDialog
          isOpen={rejectTarget !== null}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => void handleRejectConfirm(reason)}
          isLoading={actionLoading !== null}
        />
      </div>
    </>
  );
}

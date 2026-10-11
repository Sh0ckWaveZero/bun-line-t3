"use client";

import { useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth/client";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/common/ToastProvider";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useLineApproval } from "@/lib/auth/hooks/useLineApproval";
import { cn } from "@/lib/utils";
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldPlus,
  Users,
  User,
  type LucideIcon,
} from "lucide-react";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
type DisplayApprovalStatus = ApprovalStatus | "UNREQUESTED";
type ApprovalTab = "all" | DisplayApprovalStatus;

interface ApprovalItem {
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

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  accountsTotal: number;
}

interface ApprovalListResponse {
  data: ApprovalItem[];
  total: number;
}

const LINE_APPROVALS_KEY = ["line-approvals"] as const;
const LINE_APPROVAL_STATS_KEY = ["line-approval-stats"] as const;

/** ดึงรายการบัญชี LINE ทั้งหมดครั้งเดียวแล้วกรอง/แบ่งหน้า client-side (เหมือน cron-jobs) */
const APPROVALS_FETCH_LIMIT = 500;

const APPROVAL_TABS = [
  ["all", "ทั้งหมด"],
  ["PENDING", "รออนุมัติ"],
  ["APPROVED", "อนุมัติแล้ว"],
  ["REJECTED", "ปฏิเสธ"],
  ["UNREQUESTED", "ยังไม่ขอ"],
] as const satisfies readonly [ApprovalTab, string][];

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const STATUS_META: Record<
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

const SEGMENT_BAR_CLASSES: Record<DisplayApprovalStatus, string> = {
  PENDING: "bg-amber-400 dark:bg-amber-400/90",
  APPROVED: "bg-emerald-400 dark:bg-emerald-400/90",
  REJECTED: "bg-rose-400 dark:bg-rose-400/90",
  UNREQUESTED: "bg-slate-300 dark:bg-slate-600",
};

const SKELETON_ROW_COUNT = 5;
/** skeleton อยู่ต่อหลัง reveal เพื่อเล่น fade-out ให้จบ (--reveal-dur 400ms + buffer) */
const SKELETON_REMOVE_DELAY_MS = 450;

const APPROVAL_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const APPROVAL_SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("th-TH", {
  numeric: "auto",
});

class ApprovalFetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetchApprovals(): Promise<ApprovalListResponse> {
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

async function fetchApprovalStats(): Promise<ApprovalStats> {
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

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  return APPROVAL_DATE_FORMATTER.format(new Date(dateStr));
};

/** ประทับเวลาตามสถานะล่าสุด: อนุมัติ/ปฏิเสธใช้เวลาตัดสินใจ (approvedAt), รออนุมัติใช้เวลาที่ขอ */
const getStatusTimestamp = (item: ApprovalItem): string | null => {
  const decidedAt =
    item.status === "APPROVED" || item.status === "REJECTED"
      ? item.approvedAt
      : null;
  const at = decidedAt ?? (item.status === "PENDING" ? item.createdAt : null);
  if (!at) return null;
  const label =
    item.status === "APPROVED"
      ? "อนุมัติ"
      : item.status === "REJECTED"
        ? "ปฏิเสธ"
        : "ขอ";
  return `${label} ${APPROVAL_SHORT_DATE_FORMATTER.format(new Date(at))}`;
};

/** relative เฉพาะ ≤ 7 วัน — เกินกว่านั้น fallback เป็นวันที่เต็มจะซ้ำกับ formatDate จึงคืน null */
const formatRelative = (dateStr: string): string | null => {
  const diffMinutes = Math.round(
    (Date.now() - new Date(dateStr).getTime()) / 60000,
  );
  if (Math.abs(diffMinutes) < 60) {
    return RELATIVE_FORMATTER.format(-diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return RELATIVE_FORMATTER.format(-diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return RELATIVE_FORMATTER.format(-diffDays, "day");
  }
  return null;
};

/** อีเมลปลอมที่ระบบสร้างจาก LINE user ID (รูปแบบ <id>@line.local) ไม่มีประโยชน์โชว์ซ้ำ */
const getRealEmail = (item: ApprovalItem): string | null => {
  const email = item.userEmail;
  if (!email) return null;
  const lineId = item.lineUserId.toLowerCase();
  const normalized = email.toLowerCase();
  if (normalized === lineId || normalized.startsWith(lineId)) return null;
  return email;
};

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <article className="border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(16,24,40,0.04)] dark:border-white/[0.08] dark:bg-[#151719] dark:shadow-none">
      <div className="flex items-start gap-3 p-5 pb-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-slate-200">
          <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {label}
          </h2>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            {detail}
          </p>
        </div>
      </div>
      <div className="px-5 pb-4">
        <p className="text-[27px] leading-tight font-semibold tracking-[-0.04em] text-slate-900 tabular-nums dark:text-white">
          {value}
        </p>
        {children}
      </div>
    </article>
  );
}

function ProportionBar({
  segments,
}: {
  segments: Array<{
    status: DisplayApprovalStatus;
    label: string;
    count: number;
  }>;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);

  return (
    <div className="mt-5">
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
        {segments.map((segment) => (
          <span
            key={segment.status}
            className={SEGMENT_BAR_CLASSES[segment.status]}
            style={{
              width: total === 0 ? 0 : `${(segment.count / total) * 100}%`,
            }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
        {segments.map((segment) => (
          <span key={segment.status} className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full",
                STATUS_META[segment.status].dotClass,
              )}
            />
            {segment.label} {segment.count}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DisplayApprovalStatus }) {
  const meta = STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        meta.badgeClass,
      )}
    >
      <meta.Icon className="size-3.5" aria-hidden="true" />
      {meta.label}
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
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (pictureUrl && !hasImageError) {
    return (
      <img
        src={pictureUrl}
        alt={displayName ?? "ผู้ใช้ LINE"}
        className="size-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/10"
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-200 to-slate-300 text-xs font-semibold text-slate-700 dark:from-slate-700 dark:to-slate-800 dark:text-slate-200 dark:ring-1 dark:ring-white/10"
      aria-label={displayName ?? "ผู้ใช้ LINE"}
    >
      {initials === "?" ? <User className="size-4" /> : initials}
    </div>
  );
}

interface ApprovalActionInput {
  body: Record<string, unknown>;
  lineUserId: string;
  patch: Partial<ApprovalItem>;
  successTitle: string;
}

function ApprovalRow({
  item,
  onOpenActions,
}: {
  item: ApprovalItem;
  onOpenActions: (item: ApprovalItem, trigger: HTMLElement) => void;
}) {
  const statusTimestamp = getStatusTimestamp(item);

  return (
    <tr className="group border-t border-slate-200/80 transition-colors hover:bg-slate-50 dark:border-white/[0.07] dark:hover:bg-white/[0.025]">
      <td className="min-w-[280px] px-3 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <UserAvatar
            pictureUrl={item.pictureUrl}
            displayName={item.displayName}
          />
          <div className="max-w-[240px] min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">
              {item.displayName ?? "ไม่ระบุชื่อ"}
            </p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {item.lineUserId}
            </p>
            {getRealEmail(item) && (
              <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                {getRealEmail(item)}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="min-w-[170px] px-3 py-4">
        <div className="flex flex-col items-start gap-1.5">
          <StatusBadge status={item.status} />
          {statusTimestamp && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {statusTimestamp}
            </span>
          )}
          {item.status === "REJECTED" && item.rejectReason && (
            <span
              className="max-w-[160px] truncate text-[10px] text-rose-700 dark:text-rose-300"
              title={item.rejectReason}
            >
              เหตุผล: {item.rejectReason}
            </span>
          )}
          {item.status !== "REJECTED" && item.statusMessage && (
            <span
              className="max-w-[160px] truncate text-[10px] text-slate-500 italic dark:text-slate-400"
              title={item.statusMessage}
            >
              “{item.statusMessage}”
            </span>
          )}
        </div>
      </td>
      <td className="w-28 px-3 py-4 text-center">
        {item.isAdmin ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-400/20 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Admin
          </span>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ผู้ใช้ทั่วไป
          </span>
        )}
      </td>
      <td className="min-w-[140px] px-3 py-4">
        <p className="text-[13px] text-slate-800 tabular-nums dark:text-slate-100">
          {formatDate(item.createdAt)}
        </p>
        {formatRelative(item.createdAt) && (
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {formatRelative(item.createdAt)}
          </p>
        )}
      </td>
      <td className="w-12 px-2 py-4 text-right">
        <button
          type="button"
          onClick={(event) => onOpenActions(item, event.currentTarget)}
          aria-haspopup="menu"
          aria-label={`จัดการ ${item.displayName ?? item.lineUserId}`}
          className="cursor-pointer rounded-lg p-1.5 text-slate-400 opacity-70 transition-colors group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:hover:bg-white/[0.08] dark:hover:text-slate-200"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

function EmptyApprovalsState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 dark:border-white/[0.1] dark:bg-white/[0.06]">
        <Users className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {hasFilters
          ? "ไม่พบบัญชีที่ตรงกับตัวกรอง"
          : "ยังไม่มีบัญชี LINE ในระบบ"}
      </h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        {hasFilters
          ? "ลองเปลี่ยนคำค้นหาหรือสถานะ แล้วค้นหาอีกครั้ง"
          : "เมื่อผู้ใช้เพิ่มเพื่อนกับ LINE Bot จะแสดงรายการในหน้านี้"}
      </p>
    </div>
  );
}

function ApprovalSkeleton() {
  return (
    <div>
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6 dark:border-white/[0.08]">
        <div className="skel-bar h-4 w-44 rounded-md" />
        <div className="skel-bar mt-2.5 h-3 w-64 rounded-md" />
      </div>
      <div className="flex gap-6 border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-white/[0.08]">
        {Array.from({ length: APPROVAL_TABS.length }, (_, index) => (
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
            <div className="skel-bar h-6 w-24 shrink-0 rounded-md" />
            <div className="skel-bar size-8 shrink-0 rounded-lg" />
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

interface OpenApprovalMenu {
  item: ApprovalItem;
  trigger: HTMLElement;
  rect: DOMRect;
}

const MORPH_TRIGGER_SIZE = 32;

/**
 * เมนูจัดการแบบ plus-menu-morph (transitions.dev) — กล่องเดียว morph จากวงกลมปุ่ม
 * … กลายเป็นแผงเมนู โดย CSS (input.css .t-morph) คุม animation และ React คุม state:
 * เปิด/ปิดผ่าน data-open บน DOM (ตาม orchestration ของ recipe) ส่วนความสูงฝั่งเปิด
 * วัดจากเนื้อหาจริงแล้ว set เป็น inline style เพื่อให้ height tween ได้
 */
function ApprovalActionsMenu({
  menu,
  isBusy,
  onClose,
  onApprove,
  onReject,
  onUnlock,
  onToggleAdmin,
}: {
  menu: OpenApprovalMenu;
  isBusy: boolean;
  onClose: () => void;
  onApprove: (item: ApprovalItem) => void;
  onReject: (item: ApprovalItem, reason: string) => void;
  onUnlock: (item: ApprovalItem) => void;
  onToggleAdmin: (item: ApprovalItem) => void;
}) {
  const [confirmReject, setConfirmReject] = useState(false);
  const [reason, setReason] = useState("");
  // data-open เป็นของ React state — ทน re-render และไม่พึ่งจังหวะ rAF
  const [isOpen, setIsOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const closedRef = useRef(false);
  const { item, trigger, rect } = menu;

  // พื้นที่ข้างล่างไม่พอ (แถวล่าง ๆ ของตาราง) → เปิดขึ้นบนแทน
  const flipUp = rect.bottom + 240 > window.innerHeight;
  const maxHeight = flipUp
    ? rect.top - 8
    : window.innerHeight - rect.bottom - 8;

  // เมานต์แบบปิด (32px) → เฟรมถัดไปค่อยเปิด เพื่อให้ browser เห็นสถานะเริ่มต้นแล้ว transition ยิง
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!closedRef.current) setIsOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // ความสูงฝั่งเปิด: รอ paint ของสถานะ 32px ก่อน แล้ว tween ตามเนื้อหาจริง + โฟกัสรายการแรก
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      const box = boxRef.current;
      if (!box) return;
      box.style.height = `${Math.max(
        MORPH_TRIGGER_SIZE,
        Math.min(
          contentRef.current?.scrollHeight ?? MORPH_TRIGGER_SIZE,
          maxHeight,
        ),
      )}px`;
      contentRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, maxHeight]);

  const finishClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    trigger.focus();
    onClose();
  }, [trigger, onClose]);

  const startClose = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    const box = boxRef.current;
    if (box) {
      box.style.height = `${MORPH_TRIGGER_SIZE}px`;
    }
    setIsOpen(false);
    // fallback กรณี transition ไม่ยิง (เช่น prefers-reduced-motion)
    closeTimerRef.current = window.setTimeout(finishClose, 280);
  }, [finishClose]);

  useEffect(() => {
    if (!isOpen) return;
    const box = boxRef.current;
    if (!box) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Tab") {
        event.preventDefault();
        startClose();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

      const menuItems = Array.from(
        box.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'),
      );
      if (menuItems.length === 0) return;
      event.preventDefault();
      const currentIndex = menuItems.indexOf(
        document.activeElement as HTMLElement,
      );
      const nextIndex =
        event.key === "ArrowDown"
          ? (currentIndex + 1) % menuItems.length
          : (currentIndex - 1 + menuItems.length) % menuItems.length;
      menuItems[nextIndex]?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, startClose]);

  // scroll/resize ทำ rect เก่า → ปิดเมนู (ผูกหลัง open animation จบ กัน scroll
  // ที่เกิดจากการ focus รายการแรกทำให้เมนูปิดทันที)
  useEffect(() => {
    if (!isOpen) return;
    let detachViewportListeners = () => {};
    const timer = window.setTimeout(() => {
      const handleViewportChange = () => startClose();
      window.addEventListener("resize", handleViewportChange);
      window.addEventListener("scroll", handleViewportChange, true);
      detachViewportListeners = () => {
        window.removeEventListener("resize", handleViewportChange);
        window.removeEventListener("scroll", handleViewportChange, true);
      };
    }, 400);
    return () => {
      window.clearTimeout(timer);
      detachViewportListeners();
    };
  }, [isOpen, startClose]);

  const runAction = useCallback(
    (action: () => void) => {
      action();
      startClose();
    },
    [startClose],
  );

  // พับ/ขยายฟอร์มเหตุผล → ความสูงกล่องต้อง tween ตาม
  const handleToggleConfirmReject = useCallback(() => {
    setConfirmReject((current) => !current);
    requestAnimationFrame(() => {
      const box = boxRef.current;
      if (!box || !isOpen) return;
      void box.offsetWidth;
      box.style.height = `${Math.max(
        MORPH_TRIGGER_SIZE,
        Math.min(
          contentRef.current?.scrollHeight ?? MORPH_TRIGGER_SIZE,
          maxHeight,
        ),
      )}px`;
    });
  }, [isOpen, maxHeight]);

  const canUnlock = item.status === "REJECTED" && Boolean(item.approvalId);
  const canReject = item.status !== "APPROVED" && !canUnlock;

  return (
    <div
      className="fixed inset-0 z-50"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) startClose();
      }}
    >
      <div
        ref={boxRef}
        data-open={isOpen ? "true" : "false"}
        data-flip={flipUp ? "true" : "false"}
        className="t-morph"
        style={{
          top: flipUp ? undefined : rect.top,
          bottom: flipUp ? window.innerHeight - rect.bottom : undefined,
          right: window.innerWidth - rect.right,
          maxHeight,
        }}
        onTransitionEnd={(event) => {
          if (
            event.target === boxRef.current &&
            event.propertyName === "width" &&
            closedRef.current
          ) {
            finishClose();
          }
        }}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="t-morph-plus"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>

        <div
          ref={contentRef}
          role="menu"
          aria-label={`จัดการ ${item.displayName ?? item.lineUserId}`}
          className="p-1.5"
        >
          <p className="truncate px-2 pt-1 pb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {item.displayName ?? "ไม่ระบุชื่อ"}
          </p>

          {item.status === "PENDING" && (
            <button
              type="button"
              role="menuitem"
              disabled={isBusy || !item.approvalId}
              onClick={() => runAction(() => onApprove(item))}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-500/10 focus-visible:bg-emerald-500/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300"
            >
              <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
              อนุมัติผู้ใช้
            </button>
          )}

          {canUnlock && (
            <button
              type="button"
              role="menuitem"
              disabled={isBusy}
              onClick={() => runAction(() => onUnlock(item))}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-sky-700 transition-colors hover:bg-sky-500/10 focus-visible:bg-sky-500/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-300"
            >
              <RefreshCw className="size-4 shrink-0" aria-hidden="true" />
              ปลดล็อคให้ขอใหม่
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            disabled={isBusy}
            onClick={() => runAction(() => onToggleAdmin(item))}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-white/[0.08] dark:focus-visible:bg-white/[0.08]"
          >
            {item.isAdmin ? (
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <ShieldPlus className="size-4 shrink-0" aria-hidden="true" />
            )}
            {item.isAdmin ? "ยกเลิกสิทธิ์ Admin" : "ตั้งเป็น Admin"}
          </button>

          {canReject && (
            <>
              <div className="mx-2 my-1 border-t border-slate-200 dark:border-white/[0.08]" />
              {!confirmReject ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={isBusy}
                  onClick={handleToggleConfirmReject}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-rose-700 transition-colors hover:bg-rose-500/10 focus-visible:bg-rose-500/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300"
                >
                  <CircleX className="size-4 shrink-0" aria-hidden="true" />
                  ปฏิเสธคำขอ
                </button>
              ) : (
                <div className="px-1 pb-1">
                  <label
                    htmlFor="menu-rejection-reason"
                    className="block text-[11px] font-medium text-slate-600 dark:text-slate-300"
                  >
                    เหตุผล (ไม่บังคับ)
                    <textarea
                      id="menu-rejection-reason"
                      rows={3}
                      maxLength={500}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="เช่น ไม่ผ่านเกณฑ์การใช้งาน, ข้อมูลไม่ครบ…"
                      className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 transition-colors outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-600"
                    />
                  </label>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      {reason.length}/500
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleToggleConfirmReject}
                        className="h-7 cursor-pointer rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-white/[0.08]"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          onReject(item, reason.trim());
                          startClose();
                        }}
                        className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg bg-rose-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CircleX className="size-3.5" aria-hidden="true" />
                        ยืนยัน
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function LineApprovalPage() {
  const { status: authStatus } = useSession();
  const navigate = useNavigate();
  const { needsApproval } = useLineApproval();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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
    enabled: authStatus === "authenticated",
  });

  const statsQuery = useQuery({
    queryKey: LINE_APPROVAL_STATS_KEY,
    queryFn: fetchApprovalStats,
    enabled: authStatus === "authenticated",
  });

  const approvalActionMutation = useMutation({
    mutationFn: async (input: ApprovalActionInput) => {
      const res = await fetch("/api/line/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.body),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(json?.error ?? "ดำเนินการไม่สำเร็จ");
      }
      return input;
    },
    // Optimistic update: สถานะเปลี่ยนทันทีที่คลิก ไม่ต้องรอ round-trip
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: LINE_APPROVALS_KEY });
      const previous =
        queryClient.getQueryData<ApprovalListResponse>(LINE_APPROVALS_KEY);
      queryClient.setQueryData<ApprovalListResponse>(
        LINE_APPROVALS_KEY,
        (old) =>
          old
            ? {
                ...old,
                data: old.data.map((item) =>
                  item.lineUserId === input.lineUserId
                    ? { ...item, ...input.patch }
                    : item,
                ),
              }
            : old,
      );
      return { previous };
    },
    onSuccess: (_data, input) => {
      showToast({ title: input.successTitle, type: "success" });
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(LINE_APPROVALS_KEY, context.previous);
      }
      showToast({
        title: "ดำเนินการไม่สำเร็จ",
        description:
          error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        type: "error",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: LINE_APPROVALS_KEY });
      void queryClient.invalidateQueries({
        queryKey: LINE_APPROVAL_STATS_KEY,
      });
    },
  });

  // mutate เป็น stable reference (TanStack v5) — destructure ก่อนเพื่อไม่ให้
  // callback identity เปลี่ยนทุก render
  const { mutate: mutateApprovalAction } = approvalActionMutation;

  const items = useMemo(
    () => approvalsQuery.data?.data ?? [],
    [approvalsQuery.data],
  );
  const stats = statsQuery.data ?? null;
  const isFetchingList = approvalsQuery.isFetching;

  const counts = useMemo(
    () => ({
      all: stats?.accountsTotal ?? items.length,
      PENDING: stats?.pending ?? 0,
      APPROVED: stats?.approved ?? 0,
      REJECTED: stats?.rejected ?? 0,
      UNREQUESTED: items.filter((item) => item.status === "UNREQUESTED").length,
    }),
    [stats, items],
  );

  // พิมพ์ค้นหาได้ลื่นขึ้น: ตารางอัปเดตตามหลัง input ที่ priority สูงกว่า
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredItems = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
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
  }, [items, activeTab, deferredSearchQuery]);

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

  const latestPending = useMemo(
    () =>
      [...items]
        .filter((item) => item.status === "PENDING")
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        )[0],
    [items],
  );
  const rejectedWithReason = useMemo(
    () =>
      items.filter((item) => item.status === "REJECTED" && item.rejectReason)
        .length,
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

  const handleApprove = useCallback(
    (item: ApprovalItem) => {
      if (!item.approvalId) return;
      mutateApprovalAction({
        body: { action: "approve", id: item.approvalId },
        lineUserId: item.lineUserId,
        patch: {
          status: "APPROVED",
          approvedAt: new Date().toISOString(),
          rejectReason: null,
        },
        successTitle: `อนุมัติ ${item.displayName ?? "ผู้ใช้"} เรียบร้อยแล้ว`,
      });
    },
    [mutateApprovalAction],
  );

  const handleRejectConfirm = useCallback(
    (item: ApprovalItem, reason: string) => {
      mutateApprovalAction({
        body: {
          action: "reject",
          id: item.approvalId ?? undefined,
          lineUserId: item.approvalId ? undefined : item.lineUserId,
          rejectReason: reason || undefined,
        },
        lineUserId: item.lineUserId,
        patch: { status: "REJECTED", rejectReason: reason || null },
        successTitle: `ปฏิเสธ ${item.displayName ?? "ผู้ใช้"} เรียบร้อยแล้ว`,
      });
    },
    [mutateApprovalAction],
  );

  const handleUnlock = useCallback(
    (item: ApprovalItem) => {
      if (!item.approvalId) return;
      mutateApprovalAction({
        body: { action: "unlock", id: item.approvalId },
        lineUserId: item.lineUserId,
        patch: { status: "PENDING", rejectReason: null },
        successTitle: `ปลดล็อค ${item.displayName ?? "ผู้ใช้"} เรียบร้อยแล้ว — รอคำขอใหม่`,
      });
    },
    [mutateApprovalAction],
  );

  const handleToggleAdmin = useCallback(
    (item: ApprovalItem) => {
      const nextIsAdmin = !item.isAdmin;
      mutateApprovalAction({
        body: {
          action: "set-admin",
          lineUserId: item.lineUserId,
          isAdmin: nextIsAdmin,
        },
        lineUserId: item.lineUserId,
        patch: { isAdmin: nextIsAdmin },
        successTitle: nextIsAdmin
          ? `ตั้ง ${item.displayName ?? "ผู้ใช้"} เป็น Admin เรียบร้อยแล้ว`
          : `ยกเลิกสิทธิ์ Admin ของ ${item.displayName ?? "ผู้ใช้"} แล้ว`,
      });
    },
    [mutateApprovalAction],
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
    return (
      <main className="min-h-[calc(100vh-3.5rem)] bg-[#f5f7f8] px-4 py-7 text-slate-900 dark:bg-[#0d0f11] dark:text-slate-100">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-slate-200/80 bg-white px-8 py-10 text-center shadow-[0_10px_34px_rgba(16,24,40,0.05)] dark:border-white/[0.08] dark:bg-[#151719] dark:shadow-none">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-500/10 text-rose-700 dark:text-rose-300">
            <CircleAlert className="size-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            ไม่มีสิทธิ์เข้าถึง
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {permissionError}
          </p>
          <button
            type="button"
            onClick={() => void navigate({ to: "/dashboard" })}
            className="mt-6 inline-flex h-10 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08]"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <PendingApprovalModal open={needsApproval} />

      <main className="min-h-[calc(100vh-3.5rem)] bg-[#f5f7f8] py-7 text-slate-900 dark:bg-[#0d0f11] dark:text-slate-100">
        <div className="container mx-auto px-4">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[28px] leading-none font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                  LINE Approval
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {counts.PENDING} รออนุมัติ
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                จัดการคำขอใช้งาน LINE Messaging API · {counts.all} บัญชี LINE
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              aria-label="รีเฟรชรายการคำขออนุมัติ"
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-white/[0.1] dark:bg-[#151719] dark:text-slate-200 dark:hover:bg-white/[0.06]"
            >
              <RefreshCw
                className={cn(
                  "size-4 motion-reduce:animate-none",
                  isFetchingList && "animate-spin",
                )}
                aria-hidden="true"
              />
              รีเฟรช
            </button>
          </header>

          {approvalActionMutation.isError && (
            <div
              className="mt-5 flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200"
              role="alert"
            >
              <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              {approvalActionMutation.error.message}
            </div>
          )}

          <section
            className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            aria-label="สรุปสถานะการอนุมัติ"
          >
            <MetricCard
              icon={Clock}
              label="รอการอนุมัติ"
              value={String(counts.PENDING)}
              detail={`จากทั้งหมด ${counts.all} บัญชี LINE`}
            >
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ล่าสุด
                </span>
                <span className="truncate text-[13px]">
                  {latestPending?.displayName ?? "ยังไม่มีคำขอรออนุมัติ"}
                </span>
                <span className="ml-auto shrink-0 text-xs text-slate-500 dark:text-slate-400">
                  {latestPending
                    ? (formatRelative(latestPending.createdAt) ??
                      formatDate(latestPending.createdAt))
                    : "—"}
                </span>
              </div>
              <ProportionBar
                segments={[
                  {
                    status: "PENDING",
                    label: "รออนุมัติ",
                    count: counts.PENDING,
                  },
                ]}
              />
            </MetricCard>

            <MetricCard
              icon={CircleCheck}
              label="อนุมัติแล้ว"
              value={String(counts.APPROVED)}
              detail={
                counts.all > 0
                  ? `${Math.round((counts.APPROVED / counts.all) * 100)}% ของบัญชีทั้งหมด`
                  : "ยังไม่มีบัญชีในระบบ"
              }
            >
              <ProportionBar
                segments={[
                  {
                    status: "APPROVED",
                    label: "อนุมัติแล้ว",
                    count: counts.APPROVED,
                  },
                ]}
              />
            </MetricCard>

            <MetricCard
              icon={CircleX}
              label="ปฏิเสธแล้ว"
              value={String(counts.REJECTED)}
              detail={`${rejectedWithReason} รายการมีเหตุผลบันทึกไว้`}
            >
              <ProportionBar
                segments={[
                  {
                    status: "REJECTED",
                    label: "ปฏิเสธแล้ว",
                    count: counts.REJECTED,
                  },
                ]}
              />
            </MetricCard>

            <MetricCard
              icon={Users}
              label="บัญชีทั้งหมด"
              value={String(counts.all)}
              detail="LINE accounts ที่ผูกกับระบบ"
            >
              <ProportionBar
                segments={[
                  {
                    status: "PENDING",
                    label: "รออนุมัติ",
                    count: counts.PENDING,
                  },
                  {
                    status: "APPROVED",
                    label: "อนุมัติแล้ว",
                    count: counts.APPROVED,
                  },
                  {
                    status: "REJECTED",
                    label: "ปฏิเสธแล้ว",
                    count: counts.REJECTED,
                  },
                  {
                    status: "UNREQUESTED",
                    label: "ยังไม่ขอ",
                    count: counts.UNREQUESTED,
                  },
                ]}
              />
            </MetricCard>
          </section>

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

                <div
                  className="flex gap-6 overflow-x-auto border-b border-slate-200 px-5 sm:px-6 dark:border-white/[0.08]"
                  role="group"
                  aria-label="กรองตามสถานะ"
                >
                  {APPROVAL_TABS.map(([value, label]) => {
                    const isActive = activeTab === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => {
                          setActiveTab(value);
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
                          {counts[value]}
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
                    <label htmlFor="approval-search" className="sr-only">
                      ค้นหาผู้ใช้
                    </label>
                    <input
                      id="approval-search"
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setPage(1);
                      }}
                      placeholder="ค้นหาชื่อ อีเมล หรือ LINE User ID…"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <caption className="sr-only">
                      รายชื่อ LINE users และสถานะการอนุมัติ
                    </caption>
                    <thead className="bg-slate-50/80 dark:bg-white/[0.02]">
                      <tr className="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                        <th scope="col" className="min-w-[280px] px-3 py-3">
                          ผู้ใช้
                        </th>
                        <th scope="col" className="min-w-[170px] px-3 py-3">
                          สถานะ
                        </th>
                        <th scope="col" className="w-28 px-3 py-3 text-center">
                          สิทธิ์
                        </th>
                        <th scope="col" className="min-w-[140px] px-3 py-3">
                          ขอเมื่อ
                        </th>
                        <th scope="col" className="w-12 px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {visibleItems.map((item) => (
                        <ApprovalRow
                          key={item.id}
                          item={item}
                          onOpenActions={(rowItem, trigger) =>
                            setApprovalMenu({
                              item: rowItem,
                              trigger,
                              rect: trigger.getBoundingClientRect(),
                            })
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                  {visibleItems.length === 0 && (
                    <EmptyApprovalsState hasFilters={hasFilters} />
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
                      {filteredItems.length} คน
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
                      {Array.from(
                        { length: pageCount },
                        (_, index) => index + 1,
                      )
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

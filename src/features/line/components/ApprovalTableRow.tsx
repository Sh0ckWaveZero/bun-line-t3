import { useState } from "react";
import { MoreHorizontal, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_META } from "@/features/line/line-utils/approvals";
import type { DisplayApprovalStatus } from "@/features/line/line-utils/approvals";
import type { ApprovalItem } from "@/features/line/line-utils/approvals";
import type { ApprovalItemView } from "@/features/line/line-utils/approval-views";

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

export function ApprovalRow({
  item,
  onOpenActions,
}: {
  item: ApprovalItemView;
  onOpenActions: (item: ApprovalItem, trigger: HTMLElement) => void;
}) {
  const statusTimestamp = item.statusTimestampText;

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
            {item.realEmailText && (
              <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                {item.realEmailText}
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
          {item.createdAtText}
        </p>
        {item.createdAtRelativeText && (
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {item.createdAtRelativeText}
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

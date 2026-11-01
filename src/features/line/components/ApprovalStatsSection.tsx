import {
  CircleCheck,
  CircleX,
  Clock,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SEGMENT_BAR_CLASSES, STATUS_META } from "@/features/line/line-utils/approvals";
import type {
  ApprovalTab,
  DisplayApprovalStatus,
} from "@/features/line/line-utils/approvals";
import type { ApprovalItemView } from "@/features/line/line-utils/approval-views";

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

export function ApprovalStatsSection({
  counts,
  latestPending,
  rejectedWithReason,
}: {
  counts: Record<ApprovalTab, number>;
  latestPending: ApprovalItemView | undefined;
  rejectedWithReason: number;
}) {
  return (
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
              ? (latestPending.createdAtRelativeText ??
                latestPending.createdAtText)
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
  );
}

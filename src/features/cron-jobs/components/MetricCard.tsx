import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  children: ReactNode;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  children,
}: MetricCardProps) {
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
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
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

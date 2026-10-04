import { ChevronDown, Database, Plus } from "lucide-react";
import type { EnvironmentFilter } from "@/features/cron-jobs/types";

interface CronJobsHeaderProps {
  jobsCount: number;
  failingJobs: number;
  timezone?: string;
  environmentFilter: EnvironmentFilter;
  onEnvironmentFilterChange: (value: EnvironmentFilter) => void;
  onCreateJob: () => void;
}

export function CronJobsHeader({
  jobsCount,
  failingJobs,
  timezone,
  environmentFilter,
  onEnvironmentFilterChange,
  onCreateJob,
}: CronJobsHeaderProps) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] leading-none font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
            Cron Jobs
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Database className="size-3.5" aria-hidden="true" />
            {failingJobs > 0 ? `${failingJobs} ล้มเหลว` : "PostgreSQL"}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {jobsCount} งานจาก container cron · เวลา {timezone ?? "Asia/Bangkok"}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative">
          <label htmlFor="environment-filter" className="sr-only">
            เลือกสภาพแวดล้อม
          </label>
          <select
            id="environment-filter"
            value={environmentFilter}
            onChange={(event) =>
              onEnvironmentFilterChange(event.target.value as EnvironmentFilter)
            }
            className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 shadow-sm transition-colors outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:w-48 dark:border-white/[0.1] dark:bg-[#151719] dark:text-slate-200"
          >
            <option value="all">ทุกสภาพแวดล้อม</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
        <button
          type="button"
          onClick={onCreateJob}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Plus className="size-4" aria-hidden="true" />
          งานใหม่
        </button>
      </div>
    </header>
  );
}

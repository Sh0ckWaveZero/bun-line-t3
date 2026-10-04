import { ArrowDownUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CronJob } from "@/features/cron-jobs/types";
import { CronJobRow } from "@/features/cron-jobs/components/CronJobRow";
import { EmptyJobsState } from "@/features/cron-jobs/components/EmptyJobsState";

const TABLE_HEADERS: Array<[label: string, className: string]> = [
  ["งาน", "min-w-[280px]"],
  ["ตารางเวลา", "min-w-[165px]"],
  ["เปิดใช้งาน", "w-24 text-center"],
  ["รอบล่าสุด", "min-w-[150px]"],
  ["20 รอบล่าสุด", "min-w-[150px]"],
  ["รอบถัดไป", "min-w-[130px]"],
  ["เป้าหมาย", "min-w-[195px]"],
  ["เจ้าของ", "min-w-[155px]"],
  ["", "w-12"],
];

interface CronJobTableProps {
  jobs: CronJob[];
  compact: boolean;
  onToggleJob: (job: CronJob) => void;
  onMenuJob: (job: CronJob) => void;
  toggleDisabled: boolean;
  hasFilters: boolean;
  isLoading: boolean;
}

export function CronJobTable({
  jobs,
  compact,
  onToggleJob,
  onMenuJob,
  toggleDisabled,
  hasFilters,
  isLoading,
}: CronJobTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1430px] border-collapse text-left">
        <caption className="sr-only">รายการ Cron Jobs และสถานะการทำงาน</caption>
        <thead className="bg-slate-50/80 dark:bg-white/[0.02]">
          <tr className="text-[11px] font-semibold tracking-wide text-slate-500">
            {TABLE_HEADERS.map(([label, className]) => (
              <th key={label} className={cn("px-3 py-3", className)}>
                <span className="inline-flex items-center gap-1.5">
                  {label}
                  <ArrowDownUp
                    className="size-3 text-slate-400"
                    aria-hidden="true"
                  />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <CronJobRow
              key={job.id}
              job={job}
              compact={compact}
              onToggle={(selected) => void onToggleJob(selected)}
              onMenu={onMenuJob}
              toggleDisabled={toggleDisabled}
            />
          ))}
        </tbody>
      </table>
      {jobs.length === 0 && (
        <EmptyJobsState hasFilters={hasFilters} isLoading={isLoading} />
      )}
    </div>
  );
}

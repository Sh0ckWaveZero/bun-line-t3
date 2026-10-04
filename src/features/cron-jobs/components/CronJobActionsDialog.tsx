import { useState } from "react";
import { Check, CircleX, Pencil, Play, Trash2 } from "lucide-react";
import type { CronJob } from "@/features/cron-jobs/types";
import { CronJobLastRunDetails } from "@/features/cron-jobs/components/CronJobLastRunDetails";
import { DialogShell } from "@/features/cron-jobs/components/DialogShell";

interface CronJobActionsDialogProps {
  job: CronJob | null;
  isBusy: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRun: () => Promise<void>;
  onToggle: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function CronJobActionsDialog({
  job,
  isBusy,
  onClose,
  onEdit,
  onRun,
  onToggle,
  onDelete,
}: CronJobActionsDialogProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!job) return null;

  return (
    <DialogShell
      open
      title={job.name}
      description={`${job.command} · ${job.scheduleLabel}`}
      onClose={onClose}
    >
      <div className="space-y-2">
        <CronJobLastRunDetails lastRun={job.lastRun} />
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void onRun()}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-left text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/15 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-300"
        >
          <Play className="size-4" aria-hidden="true" />
          <span>
            รันทันที
            <span className="mt-0.5 block text-[11px] font-normal opacity-75">
              เรียก endpoint จริงและบันทึก execution history
            </span>
          </span>
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={onEdit}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.1] dark:text-slate-200 dark:hover:bg-white/[0.06]"
        >
          <Pencil className="size-4" aria-hidden="true" />
          แก้ไขรายละเอียดและตารางเวลา
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void onToggle()}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.1] dark:text-slate-200 dark:hover:bg-white/[0.06]"
        >
          {job.enabled ? (
            <CircleX className="size-4" aria-hidden="true" />
          ) : (
            <Check className="size-4" aria-hidden="true" />
          )}
          {job.enabled ? "หยุดชั่วคราว" : "เปิดใช้งาน"}
        </button>

        <div className="border-t border-slate-200 pt-2 dark:border-white/[0.08]">
          {!confirmDelete ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setConfirmDelete(true)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/10 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              ลบ Cron Job
            </button>
          ) : (
            <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3">
              <p className="text-xs leading-5 text-rose-800 dark:text-rose-200">
                ลบงานนี้และ execution history ทั้งหมดหรือไม่?
                การลบย้อนกลับไม่ได้
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-8 cursor-pointer rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-white/60 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-white/[0.08]"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void onDelete()}
                  className="h-8 cursor-pointer rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogShell>
  );
}

import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { TARGET_FILTER_OPTIONS } from "@/features/cron-jobs/constants/targets";
import { jobToForm } from "@/features/cron-jobs/helpers";
import type { CronJobMutationInput } from "@/features/cron-jobs/hooks/useCronJobs";
import type { CronJob } from "@/features/cron-jobs/types";
import { DialogShell } from "@/features/cron-jobs/components/DialogShell";

const DIALOG_INPUT_CLASS =
  "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100";

interface CronJobFormDialogProps {
  open: boolean;
  job: CronJob | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: CronJobMutationInput) => Promise<void>;
}

export function CronJobFormDialog({
  open,
  job,
  isSaving,
  onClose,
  onSubmit,
}: CronJobFormDialogProps) {
  const [form, setForm] = useState<CronJobMutationInput>(() => jobToForm(job));
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = (
    field: keyof CronJobMutationInput,
    value: string | boolean,
  ) => {
    setForm(
      (current) => ({ ...current, [field]: value }) as CronJobMutationInput,
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      await onSubmit(form);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "บันทึก Cron Job ไม่สำเร็จ",
      );
    }
  };

  return (
    <DialogShell
      open={open}
      title={job ? "แก้ไข Cron Job" : "สร้าง Cron Job ใหม่"}
      description="กำหนด endpoint และ cron expression ที่ dispatcher จะอ่านจาก PostgreSQL"
      onClose={onClose}
      wide
    >
      <form
        className="space-y-4"
        aria-describedby={formError ? "cron-form-error" : undefined}
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            ชื่องาน
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={DIALOG_INPUT_CLASS}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Key
            <input
              required
              pattern="[a-z0-9][a-z0-9\-]*"
              value={form.key}
              onChange={(event) => updateField("key", event.target.value)}
              className={`${DIALOG_INPUT_CLASS} font-mono`}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Method
            <select
              value={form.method}
              onChange={(event) =>
                updateField(
                  "method",
                  event.target.value as CronJobMutationInput["method"],
                )
              }
              className={`${DIALOG_INPUT_CLASS} cursor-pointer`}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Endpoint
            <input
              required
              value={form.endpoint}
              onChange={(event) => updateField("endpoint", event.target.value)}
              placeholder="/api/cron/example"
              className={`${DIALOG_INPUT_CLASS} font-mono`}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            ชื่อตารางเวลา
            <input
              required
              value={form.scheduleLabel}
              onChange={(event) =>
                updateField("scheduleLabel", event.target.value)
              }
              placeholder="ทุก 5 นาที"
              className={DIALOG_INPUT_CLASS}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Cron expression
            <input
              required
              value={form.cronExpression}
              onChange={(event) =>
                updateField("cronExpression", event.target.value)
              }
              placeholder="*/5 * * * *"
              className={`${DIALOG_INPUT_CLASS} font-mono`}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Timezone
            <input
              required
              readOnly
              value={form.timezone}
              className={DIALOG_INPUT_CLASS}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Environment
            <select
              value={form.environment}
              onChange={(event) =>
                updateField(
                  "environment",
                  event.target.value as CronJobMutationInput["environment"],
                )
              }
              className={`${DIALOG_INPUT_CLASS} cursor-pointer`}
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </label>
          <label className="flex cursor-pointer items-end gap-2 pb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => updateField("enabled", event.target.checked)}
              className="size-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            เปิดใช้งานทันที
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Target
            <input
              required
              value={form.targetName}
              onChange={(event) =>
                updateField("targetName", event.target.value)
              }
              className={DIALOG_INPUT_CLASS}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            ประเภท target
            <select
              value={form.targetKind}
              onChange={(event) =>
                updateField(
                  "targetKind",
                  event.target.value as CronJobMutationInput["targetKind"],
                )
              }
              className={`${DIALOG_INPUT_CLASS} cursor-pointer`}
            >
              {TARGET_FILTER_OPTIONS.filter(
                (option) => option.value !== "all",
              ).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_100px_120px]">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            เจ้าของ
            <input
              required
              value={form.ownerName}
              onChange={(event) => updateField("ownerName", event.target.value)}
              className={DIALOG_INPUT_CLASS}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Initials
            <input
              required
              maxLength={8}
              value={form.ownerInitials}
              onChange={(event) =>
                updateField("ownerInitials", event.target.value.toUpperCase())
              }
              className={`${DIALOG_INPUT_CLASS} uppercase`}
            />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            สี owner
            <input
              required
              type="color"
              value={form.ownerColor}
              onChange={(event) =>
                updateField("ownerColor", event.target.value)
              }
              className="mt-1.5 h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-white/[0.1] dark:bg-white/[0.04]"
            />
          </label>
        </div>

        {formError && (
          <p
            id="cron-form-error"
            role="alert"
            className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300"
          >
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 cursor-pointer rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-white/[0.08]"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <LoaderCircle className="size-3.5 animate-spin" />}
            บันทึก Cron Job
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

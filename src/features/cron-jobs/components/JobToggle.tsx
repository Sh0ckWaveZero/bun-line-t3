import { cn } from "@/lib/utils";

interface JobToggleProps {
  enabled: boolean;
  disabled?: boolean;
  onChange: () => void;
}

export function JobToggle({ enabled, disabled, onChange }: JobToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "หยุด Cron Job" : "เปิดใช้งาน Cron Job"}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        enabled
          ? "border-emerald-600 bg-emerald-600"
          : "border-slate-300 bg-slate-200 dark:border-white/[0.15] dark:bg-white/[0.1]",
      )}
    >
      <span
        className={cn(
          "size-4 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}

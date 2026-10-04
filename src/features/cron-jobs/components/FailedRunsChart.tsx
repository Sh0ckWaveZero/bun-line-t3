interface FailedRunsChartProps {
  failed: number;
  timedOut: number;
}

export function FailedRunsChart({ failed, timedOut }: FailedRunsChartProps) {
  const total = failed + timedOut;
  const failedWidth = total === 0 ? 0 : (failed / total) * 100;
  const timedOutWidth = total === 0 ? 0 : (timedOut / total) * 100;

  return (
    <div className="mt-5">
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
        <span
          className="bg-rose-400 dark:bg-rose-400/90"
          style={{ width: `${failedWidth}%` }}
        />
        <span
          className="bg-amber-400 dark:bg-amber-400/90"
          style={{ width: `${timedOutWidth}%` }}
        />
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-rose-400" />
          {failed} ล้มเหลว
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-400" />
          {timedOut} หมดเวลา
        </span>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

interface StatusSegmentsProps {
  healthy: number;
  failing: number;
  paused: number;
}

export function StatusSegments({
  healthy,
  failing,
  paused,
}: StatusSegmentsProps) {
  const segments = [
    ...Array.from({ length: healthy }, () => "healthy" as const),
    ...Array.from({ length: failing }, () => "failing" as const),
    ...Array.from({ length: paused }, () => "paused" as const),
  ];

  return (
    <div className="mt-5 flex h-5 items-end gap-1" aria-hidden="true">
      {segments.map((status, index) => (
        <span
          key={`${status}-${index}`}
          className={cn(
            "w-1 rounded-full",
            status === "healthy" &&
              "h-5 bg-emerald-500/80 dark:bg-emerald-400/80",
            status === "failing" && "h-5 bg-rose-500/80 dark:bg-rose-400/80",
            status === "paused" && "h-4 bg-violet-500/80 dark:bg-violet-400/80",
          )}
        />
      ))}
    </div>
  );
}

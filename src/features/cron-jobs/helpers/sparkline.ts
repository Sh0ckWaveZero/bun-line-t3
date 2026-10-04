import type { RunStatus } from "@/features/cron-jobs/types";

const BAR_HEIGHTS = [
  42, 58, 70, 48, 64, 52, 76, 46, 61, 55, 72, 48, 67, 57, 75, 51, 64, 43, 69,
  58,
];

export function getSparkHeight(status: RunStatus, index: number): number {
  const base = BAR_HEIGHTS[index % BAR_HEIGHTS.length] ?? 55;

  if (status === "failed") return Math.max(42, base - 8);
  if (status === "timed-out") return Math.min(96, base + 18);
  return base;
}

export type AutoCheckoutResultStatus = "success" | "failed" | "skipped";

export interface AutoCheckoutResultLike {
  status: AutoCheckoutResultStatus;
  reason?: string;
  warning?: string;
}

export interface CronReasonCount {
  reason: string;
  count: number;
}

export interface AutoCheckoutSummary {
  success: boolean;
  message: string;
  summary: {
    processed: number;
    successful: number;
    failed: number;
    skipped: number;
    warnings: number;
  };
  failureReasons: CronReasonCount[];
  warningReasons: CronReasonCount[];
}

function normalizeReason(reason: string | undefined): string {
  const normalized = reason?.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 300) : "ไม่ทราบสาเหตุ";
}

function countReasons(reasons: readonly (string | undefined)[]) {
  const counts = new Map<string, number>();

  for (const reason of reasons) {
    const normalized = normalizeReason(reason);
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return Array.from(counts, ([reason, count]) => ({ reason, count }));
}

function formatReasons(reasons: readonly CronReasonCount[]): string {
  return reasons
    .map(({ reason, count }) =>
      count > 1 ? `${reason} (${count} คน)` : reason,
    )
    .join("; ")
    .slice(0, 450);
}

export function summarizeAutoCheckoutResults(
  results: readonly AutoCheckoutResultLike[],
): AutoCheckoutSummary {
  const successful = results.filter((result) => result.status === "success");
  const failed = results.filter((result) => result.status === "failed");
  const skipped = results.filter((result) => result.status === "skipped");
  const failureReasons = countReasons(failed.map((result) => result.reason));
  const warningReasons = countReasons(
    results
      .map((result) => result.warning)
      .filter((warning): warning is string => Boolean(warning)),
  );
  const warningCount = results.filter((result) => result.warning).length;

  let message = `ลงชื่อออกงานอัตโนมัติเสร็จสิ้น: ${successful.length} คน`;
  if (failed.length > 0) {
    message = `ลงชื่อออกงานอัตโนมัติล้มเหลว ${failed.length} คน (สำเร็จ ${successful.length} คน): ${formatReasons(failureReasons)}`;
  } else if (warningCount > 0) {
    message = `${message}; ส่งแจ้งเตือนมีปัญหา ${warningCount} คน: ${formatReasons(warningReasons)}`;
  }

  return {
    success: failed.length === 0,
    message,
    summary: {
      processed: results.length,
      successful: successful.length,
      failed: failed.length,
      skipped: skipped.length,
      warnings: warningCount,
    },
    failureReasons,
    warningReasons,
  };
}

export function extractCronResponseMessage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  if ("error" in payload && typeof payload.error === "string") {
    return payload.error;
  }

  return null;
}

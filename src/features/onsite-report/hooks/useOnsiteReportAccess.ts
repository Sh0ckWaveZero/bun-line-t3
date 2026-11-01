import { useQuery } from "@tanstack/react-query";

export const ONSITE_REPORT_ACCESS_QUERY_KEY = [
  "onsite-report-access",
] as const;

const fetchAccess = async (): Promise<boolean> => {
  const response = await fetch("/api/onsite-reports/access");
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? "ไม่สามารถตรวจสิทธิ์ได้");
  }
  const payload = (await response.json()) as { data: { canUse: boolean } };
  return payload.data.canUse;
};

/** ผู้ใช้ปัจจุบันมีสิทธิ์ใช้ Onsite Service Report หรือไม่ (admin ใช้ได้เสมอ) */
export const useOnsiteReportAccess = () =>
  useQuery({
    queryKey: ONSITE_REPORT_ACCESS_QUERY_KEY,
    queryFn: fetchAccess,
  });

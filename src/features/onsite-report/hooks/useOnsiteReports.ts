import { useQuery } from "@tanstack/react-query";
import type { OnsiteReport } from "../types";

const fetchOnsiteReports = async (): Promise<OnsiteReport[]> => {
  const response = await fetch("/api/onsite-reports/");
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? "ไม่สามารถโหลดรายงานได้");
  }
  const payload = (await response.json()) as { data: OnsiteReport[] };
  return payload.data;
};

export const ONSITE_REPORTS_QUERY_KEY = ["onsite-reports"] as const;

/** รายการรายงานทั้งหมดของผู้ใช้ */
export const useOnsiteReports = () =>
  useQuery({
    queryKey: ONSITE_REPORTS_QUERY_KEY,
    queryFn: fetchOnsiteReports,
  });

const fetchOnsiteReport = async (id: string): Promise<OnsiteReport> => {
  const response = await fetch(
    `/api/onsite-reports/${encodeURIComponent(id)}`,
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? "ไม่สามารถโหลดรายงานได้");
  }
  const payload = (await response.json()) as { data: OnsiteReport };
  return payload.data;
};

/** รายงานเดียวสำหรับหน้าแก้ไข */
export const useOnsiteReport = (id: string | undefined) =>
  useQuery({
    queryKey: ["onsite-reports", id],
    queryFn: () => fetchOnsiteReport(id as string),
    enabled: Boolean(id),
  });

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DcaOrderListResult, DcaSummary } from "@/features/dca/types";
import { useAuthSession } from "@/lib/auth/session-context";

export const useDcaHistoryData = (page: number, limit: number) => {
  const lineUserId = useAuthSession()?.user?.lineUserId;

  const ordersQuery = useQuery({
    queryKey: ["dca-orders", lineUserId, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        lineUserId: lineUserId!,
      });
      const res = await fetch(`/api/dca/?${params.toString()}`);
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      return res.json() as Promise<DcaOrderListResult>;
    },
    enabled: Boolean(lineUserId),
    refetchInterval: false,
    refetchOnWindowFocus: true,
  });

  const summaryQuery = useQuery({
    queryKey: ["dca-summary", lineUserId],
    queryFn: async () => {
      const params = new URLSearchParams({ lineUserId: lineUserId! });
      const res = await fetch(`/api/dca/summary?${params.toString()}`);
      if (!res.ok) throw new Error("ไม่สามารถโหลดสรุปได้");
      return res.json() as Promise<DcaSummary>;
    },
    enabled: Boolean(lineUserId),
    refetchInterval: false,
    refetchOnWindowFocus: true,
  });

  const refetchOrders = ordersQuery.refetch;
  const refetchSummary = summaryQuery.refetch;
  const refetchAll = useCallback(() => {
    void refetchOrders();
    void refetchSummary();
  }, [refetchOrders, refetchSummary]);

  return {
    ordersData: ordersQuery.data,
    summaryData: summaryQuery.data,
    isLoading: ordersQuery.isLoading || summaryQuery.isLoading,
    error: ordersQuery.error?.message || summaryQuery.error?.message || null,
    refetchAll,
  };
};

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { DcaOrderListResult, DcaSummary } from "@/features/dca/types";

export const useDcaHistoryData = (page: number, limit: number) => {
  const ordersQuery = useQuery({
    queryKey: ["dca-orders", page, limit],
    queryFn: async () => {
      const res = await fetch(`/api/dca/?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      return res.json() as Promise<DcaOrderListResult>;
    },
    refetchInterval: false,
    refetchOnWindowFocus: true,
  });

  const summaryQuery = useQuery({
    queryKey: ["dca-summary"],
    queryFn: async () => {
      const res = await fetch("/api/dca/summary");
      if (!res.ok) throw new Error("ไม่สามารถโหลดสรุปได้");
      return res.json() as Promise<DcaSummary>;
    },
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

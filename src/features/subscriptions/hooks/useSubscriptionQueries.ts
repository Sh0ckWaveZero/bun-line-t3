"use client";

/**
 * useSubscriptionQueries — queries สำหรับดึงข้อมูล subscriptions และรายละเอียดรายเดือน
 */

import { useQuery } from "@tanstack/react-query";
import type {
  MonthlySummary,
  SubscriptionDetail,
  SubscriptionPayment,
  SubscriptionWithMembers,
} from "@/features/subscriptions/types";

async function fetchSubscriptions(): Promise<SubscriptionWithMembers[]> {
  const res = await fetch("/api/subscriptions");
  if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูล subscriptions ได้");
  const json = (await res.json()) as { data: SubscriptionWithMembers[] };
  return json.data;
}

async function fetchSubscriptionDetail(
  subscriptionId: string,
  billingMonth: string,
): Promise<{
  detail: SubscriptionDetail;
  payments: SubscriptionPayment[];
  summary: MonthlySummary;
}> {
  const [detailRes, paymentsRes] = await Promise.all([
    fetch(`/api/subscriptions/${subscriptionId}?billingMonth=${billingMonth}`),
    fetch(
      `/api/subscriptions/payments?subscriptionId=${subscriptionId}&billingMonth=${billingMonth}&summary=true`,
    ),
  ]);
  if (!detailRes.ok) throw new Error("ไม่สามารถดึงรายละเอียดได้");
  const detailJson = (await detailRes.json()) as { data: SubscriptionDetail };
  const paymentsJson = (await paymentsRes.json()) as {
    data: SubscriptionPayment[];
    summary: MonthlySummary;
  };
  return {
    detail: detailJson.data,
    payments: paymentsJson.data,
    summary: paymentsJson.summary,
  };
}

/** รายการ subscriptions ทั้งหมดของผู้ใช้ */
export function useSubscriptionsList(enabled: boolean) {
  const {
    data: subscriptions = [],
    isLoading: listLoading,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
    enabled,
  });

  return { subscriptions, listLoading, refetchList };
}

/** รายละเอียด subscription + payments + สรุปยอดของเดือนที่เลือก */
export function useSubscriptionDetail(
  selectedId: string | null,
  billingMonth: string,
) {
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["subscription-detail", selectedId, billingMonth],
    queryFn: () => fetchSubscriptionDetail(selectedId!, billingMonth),
    enabled: !!selectedId,
  });

  return { detailData, detailLoading };
}

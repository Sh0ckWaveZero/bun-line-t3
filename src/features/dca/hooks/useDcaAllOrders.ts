import { useQuery } from "@tanstack/react-query";
import type { DcaOrderListResult } from "@/features/dca/types";
import { useAuthSession } from "@/lib/auth/session-context";

/**
 * Fetch ALL DCA orders (not paginated) for chart and stats calculations.
 * Uses dedicated API endpoint that bypasses pagination caps.
 */
export const useDcaAllOrders = () => {
  const lineUserId = useAuthSession()?.user?.lineUserId;

  return useQuery({
    queryKey: ["dca-all-orders", lineUserId],
    queryFn: async () => {
      const params = new URLSearchParams({
        lineUserId: lineUserId!,
      });
      const res = await fetch(`/api/dca/all?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load all orders");
      return res.json() as Promise<DcaOrderListResult>;
    },
    enabled: Boolean(lineUserId),
    refetchInterval: false,
    refetchOnWindowFocus: true,
    staleTime: 60_000,
  });
};

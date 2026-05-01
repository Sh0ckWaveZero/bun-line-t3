import { useQuery } from "@tanstack/react-query"
import { getPastMonths } from "../helpers"
import type { MonthlySummary } from "../types"

export function useMonthlyCharts(currentMonth: string, enabled: boolean) {
  const { data: multiMonthSummaries = [], isLoading } = useQuery({
    queryKey: ["expenses-multi-month", currentMonth],
    queryFn: async () => {
      const months = getPastMonths(6, currentMonth)
      const res = await fetch(`/api/expenses/summary?months=${months.join(",")}`, {
        cache: "no-store",
      })
      if (!res.ok) return []
      const json = (await res.json()) as { data?: MonthlySummary[] }
      return (json.data ?? []).filter((r): r is MonthlySummary => !!r?.transMonth)
    },
    enabled,
    staleTime: 5 * 60_000,
  })

  return { multiMonthSummaries, isLoading }
}

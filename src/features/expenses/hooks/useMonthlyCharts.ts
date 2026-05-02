import { useQuery } from "@tanstack/react-query"
import { getPastMonths } from "../helpers"
import type { MonthlySummary } from "../types"

export function useMonthlyCharts(currentMonth: string, enabled: boolean) {
  const { data: multiMonthSummaries = [], isLoading } = useQuery({
    queryKey: ["expenses-multi-month", currentMonth],
    queryFn: async () => {
      const months = getPastMonths(6, currentMonth)
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 8000)
      const res = await fetch(`/api/expenses/summary?months=${months.join(",")}`, {
        cache: "no-store",
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeoutId))
      if (!res.ok) return []
      const json = (await res.json()) as { data?: MonthlySummary[] }
      return (json.data ?? []).filter((r): r is MonthlySummary => !!r?.transMonth)
    },
    enabled,
    staleTime: 5 * 60_000,
  })

  return { multiMonthSummaries, isLoading }
}

import { useQuery } from "@tanstack/react-query"
import { getPastMonths } from "../helpers"
import type { CategorySummary, MonthlySummary } from "../types"

export function useMonthlyCharts(currentMonth: string, enabled: boolean) {
  const { data: multiMonthSummaries = [], isLoading } = useQuery({
    queryKey: ["expenses-multi-month", currentMonth],
    queryFn: async () => {
      const months = getPastMonths(6, currentMonth)
      const results = await Promise.all(
        months.map(async (month) => {
          const res = await fetch(`/api/expenses/summary?transMonth=${month}`)
          if (!res.ok) return null
          const json = (await res.json()) as {
            data: { summary: MonthlySummary; categories: CategorySummary[] }
          }
          return json.data?.summary ?? null
        }),
      )
      return results.filter((r): r is MonthlySummary => r !== null)
    },
    enabled,
    staleTime: 5 * 60_000,
  })

  return { multiMonthSummaries, isLoading }
}

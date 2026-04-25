import { useCallback, useState } from "react"
import { getCurrentMonth, shiftMonth } from "../helpers"

export function useMonthNavigation() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth)

  const prevMonth = useCallback(() => setCurrentMonth((m) => shiftMonth(m, -1)), [])

  const nextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      const next = shiftMonth(m, 1)
      return next <= getCurrentMonth() ? next : m
    })
  }, [])

  return { currentMonth, prevMonth, nextMonth }
}

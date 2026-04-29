import { useCallback, useEffect, useState } from "react"
import { exportTransactionsToExcel } from "../export"
import type { MonthlySummary, TransactionWithCategory } from "../types"

interface Deps {
  transactions: TransactionWithCategory[]
  summary: MonthlySummary | undefined
  currentMonth: string
}

export function useExpensePageUI({ transactions, summary, currentMonth }: Deps) {
  const [hideAmounts, setHideAmounts] = useState(false)
  const [showCharts, setShowCharts] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Sync initial state from user's web privacy setting
  useEffect(() => {
    let cancelled = false
    async function fetchPrivacy() {
      try {
        const res = await fetch("/api/user/settings")
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.settings?.hideAmountsWeb) {
          setHideAmounts(true)
        }
      } catch {
        // Silently fail — default to showing amounts
      }
    }
    fetchPrivacy()
    return () => { cancelled = true }
  }, [])

  const toggleHideAmounts = useCallback(() => setHideAmounts((v) => !v), [])
  const toggleCharts = useCallback(() => setShowCharts((v) => !v), [])

  const handleExport = useCallback(async () => {
    if (!summary || transactions.length === 0) return
    setExporting(true)
    try {
      await exportTransactionsToExcel(transactions, summary, currentMonth)
    } finally {
      setExporting(false)
    }
  }, [transactions, summary, currentMonth])

  return {
    hideAmounts,
    showCharts,
    exporting,
    toggleHideAmounts,
    toggleCharts,
    handleExport,
  }
}

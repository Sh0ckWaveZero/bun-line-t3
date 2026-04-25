import { useCallback, useState } from "react"
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

import { useCallback, useState } from "react";
import { exportTransactionsToExcel } from "../export";
import type { MonthlySummary, TransactionWithCategory } from "../types";

interface Deps {
  transactions: TransactionWithCategory[];
  summary: MonthlySummary | undefined;
  currentMonth: string;
  initialHideAmounts?: boolean;
}

export function useExpensePageUI({
  transactions,
  summary,
  currentMonth,
  initialHideAmounts = false,
}: Deps) {
  const [hideAmounts, setHideAmounts] = useState(initialHideAmounts);
  const [showCharts, setShowCharts] = useState(false);
  const [exporting, setExporting] = useState(false);

  const toggleHideAmounts = useCallback(() => setHideAmounts((v) => !v), []);
  const toggleCharts = useCallback(() => setShowCharts((v) => !v), []);

  // ไม่ memoize — deps เปลี่ยน identity ทุก render อยู่แล้ว memo จึงไร้ประโยชน์
  const handleExport = async () => {
    if (!summary || transactions.length === 0) return;
    setExporting(true);
    try {
      await exportTransactionsToExcel(transactions, summary, currentMonth);
    } finally {
      setExporting(false);
    }
  };

  return {
    hideAmounts,
    showCharts,
    exporting,
    toggleHideAmounts,
    toggleCharts,
    handleExport,
  };
}

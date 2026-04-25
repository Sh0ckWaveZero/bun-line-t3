import type { MonthlySummary, TransactionWithCategory } from "./types"

function buddhistDate(transDate: string): string {
  const [y, m, d] = transDate.split("-")
  const be = parseInt(y ?? "0", 10) + 543
  return `${d}/${m}/${be}`
}

function buddhistMonth(transMonth: string): string {
  const MONTH_TH = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ]
  const [y, m] = transMonth.split("-")
  const be = parseInt(y ?? "0", 10) + 543
  const monthName = MONTH_TH[parseInt(m ?? "1", 10) - 1] ?? ""
  return `${monthName}${be}`
}

export async function exportTransactionsToExcel(
  transactions: TransactionWithCategory[],
  summary: MonthlySummary,
  transMonth: string,
): Promise<void> {
  const { utils, writeFile } = await import("xlsx")

  // ── Sheet 1: รายการทั้งหมด ──────────────────
  const rows = transactions.map((tx) => ({
    วันที่: buddhistDate(tx.transDate),
    ประเภท: tx.type === "INCOME" ? "รายรับ" : "รายจ่าย",
    หมวดหมู่: `${tx.category.icon ?? ""} ${tx.category.name}`.trim(),
    จำนวนเงิน: tx.type === "INCOME" ? tx.amount : -tx.amount,
    หมายเหตุ: tx.note ?? "",
  }))

  const txSheet = utils.json_to_sheet(rows)
  txSheet["!cols"] = [
    { wch: 14 }, // วันที่
    { wch: 10 }, // ประเภท
    { wch: 20 }, // หมวดหมู่
    { wch: 14 }, // จำนวนเงิน
    { wch: 30 }, // หมายเหตุ
  ]

  // ── Sheet 2: สรุป ───────────────────────────
  const summaryRows = [
    { รายการ: "รายรับรวม", จำนวนเงิน: summary.totalIncome },
    { รายการ: "รายจ่ายรวม", จำนวนเงิน: -summary.totalExpense },
    { รายการ: "คงเหลือ", จำนวนเงิน: summary.balance },
    { รายการ: "จำนวนรายการ", จำนวนเงิน: summary.transactionCount },
  ]

  const summarySheet = utils.json_to_sheet(summaryRows)
  summarySheet["!cols"] = [{ wch: 16 }, { wch: 14 }]

  // ── Workbook ─────────────────────────────────
  const wb = utils.book_new()
  utils.book_append_sheet(wb, txSheet, "รายการ")
  utils.book_append_sheet(wb, summarySheet, "สรุป")

  writeFile(wb, `expenses_${transMonth}_${buddhistMonth(transMonth)}.xlsx`)
}

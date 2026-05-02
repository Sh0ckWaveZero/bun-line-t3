import { formatAmount } from "@/features/expenses/helpers"

interface SummaryCardProps {
  label: string
  amount: number
  icon: React.ReactNode
  iconBg: string
  id: string
  className?: string
  hideAmounts?: boolean
}

export function SummaryCard({
  label,
  amount,
  icon,
  iconBg,
  id,
  className,
  hideAmounts,
}: SummaryCardProps) {
  return (
    <div
      id={`summary-card-${id}`}
      className={`rounded-xl border border-border/30 bg-card px-5 py-4 shadow-sm dark:bg-card/80 ${className ?? ""}`}
    >
      <div id={`summary-card-header-${id}`} className="mb-3 flex items-center justify-between">
        <span
          id={`summary-label-${id}`}
          className="text-muted-foreground text-xs font-medium"
        >
          {label}
        </span>
        <div
          id={`summary-icon-${id}`}
          className={`flex h-7 w-7 items-center justify-center rounded-full ${iconBg}`}
        >
          {icon}
        </div>
      </div>
      <p
        id={`summary-amount-${id}`}
        className="text-foreground text-2xl font-bold tabular-nums tracking-tight"
      >
        {hideAmounts ? "••••••" : formatAmount(amount)}
      </p>
    </div>
  )
}

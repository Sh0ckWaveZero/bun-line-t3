import { Card, CardContent } from "@/components/ui/card"
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
    <Card
      id={`summary-card-${id}`}
      className={`border-border/70 bg-card/85 hover:border-theme-hover dark:bg-card/70 relative overflow-hidden border transition-colors ${className ?? ""}`}
    >
      <div
        id={`summary-card-accent-${id}`}
        className={`absolute inset-x-0 top-0 h-1 ${iconBg}`}
      />
      <CardContent id={`summary-card-content-${id}`} className="p-3 sm:p-4">
        <div id={`summary-card-row-${id}`} className="flex items-center gap-2 sm:gap-3">
          <div
            id={`summary-icon-${id}`}
            className={`border-border/50 rounded-lg border p-2 sm:p-2.5 ${iconBg}`}
          >
            {icon}
          </div>
          <div id={`summary-text-${id}`} className="min-w-0 flex-1">
            <p
              id={`summary-label-${id}`}
              className="text-muted-foreground text-[10px] font-medium sm:text-xs"
            >
              {label}
            </p>
            <p
              id={`summary-amount-${id}`}
              className="text-foreground text-lg font-bold tabular-nums sm:text-xl"
            >
              {hideAmounts ? "••••••" : formatAmount(amount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

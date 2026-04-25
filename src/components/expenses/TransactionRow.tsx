import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TRANSACTION_TYPE_COLORS } from "@/features/expenses/constants"
import { formatAmount, formatDateShortThai } from "@/features/expenses/helpers"
import type { TransactionWithCategory } from "@/features/expenses/types"
import { Edit, Trash2 } from "lucide-react"

interface TransactionRowProps {
  tx: TransactionWithCategory
  onEdit?: (tx: TransactionWithCategory) => void
  onDelete: (id: string) => void
  hideAmounts?: boolean
}

export function TransactionRow({
  tx,
  onEdit,
  onDelete,
  hideAmounts,
}: TransactionRowProps) {
  const isIncome = tx.type === "INCOME"
  const rowTone = isIncome
    ? "border-card-green bg-card-green/70 dark:bg-card-green/40"
    : "border-card-red bg-card-red/70 dark:bg-card-red/40"

  return (
    <Card
      id={`transaction-card-${tx.id}`}
      className="group border-border/60 bg-card/85 hover:border-theme-hover dark:bg-card/70 relative overflow-hidden border transition-colors"
    >
      <CardContent
        id={`transaction-card-content-${tx.id}`}
        className="flex items-center justify-between gap-3 p-2.5 sm:p-3"
      >
        <div
          id={`transaction-main-${tx.id}`}
          className="flex min-w-0 items-center gap-2 sm:gap-3"
        >
          <span
            id={`transaction-emoji-${tx.id}`}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-lg sm:h-10 sm:w-10 sm:text-2xl ${rowTone}`}
          >
            {tx.category.icon ?? (isIncome ? "💰" : "💸")}
          </span>
          <div className="min-w-0 flex-1">
            <p
              id={`transaction-category-${tx.id}`}
              className="text-foreground truncate text-xs font-medium sm:text-sm"
            >
              {tx.category.name}
            </p>
            <p
              id={`transaction-meta-${tx.id}`}
              className="text-muted-foreground/60 mt-0.5 text-[10px] sm:text-xs"
            >
              {formatDateShortThai(tx.transDate)}
              {tx.note && <span> · {tx.note}</span>}
            </p>
          </div>
        </div>
        <div
          id={`transaction-actions-${tx.id}`}
          className="flex shrink-0 items-center gap-1 sm:gap-1.5"
        >
          <span
            id={`transaction-amount-${tx.id}`}
            className="mr-1 text-xs font-bold tabular-nums sm:mr-2 sm:text-sm"
            style={{
              color: isIncome
                ? TRANSACTION_TYPE_COLORS.INCOME
                : TRANSACTION_TYPE_COLORS.EXPENSE,
            }}
          >
            {hideAmounts
              ? "••••••"
              : `${isIncome ? "+" : "-"}${formatAmount(tx.amount)}`}
          </span>
          {onEdit && (
            <Button
              id={`transaction-edit-btn-${tx.id}`}
              variant="ghost"
              size="icon"
              className="text-muted-foreground/30 hover:text-primary hover:bg-primary/10 h-7 w-7 transition-colors sm:h-8 sm:w-8"
              onClick={() => onEdit(tx)}
              aria-label="แก้ไข"
            >
              <Edit size={14} />
            </Button>
          )}
          <Button
            id={`transaction-delete-btn-${tx.id}`}
            variant="ghost"
            size="icon"
            className="text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 h-7 w-7 transition-colors sm:h-8 sm:w-8"
            onClick={() => onDelete(tx.id)}
            aria-label="ลบ"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

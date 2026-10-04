import { SummaryCard } from "@/features/expenses/components/SummaryCard";
import { SummaryCardSkeleton } from "@/features/expenses/components/LoadingSkeletons";
import type { MonthlySummary } from "@/features/expenses/types";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";

interface SummaryCardsGridProps {
  isLoading: boolean;
  summary: MonthlySummary | undefined;
  hideAmounts: boolean;
}

/** การ์ดสรุปรายรับ-รายจ่าย-คงเหลือ (พร้อม skeleton ตอนโหลด) */
export function SummaryCardsGrid({
  isLoading,
  summary,
  hideAmounts,
}: SummaryCardsGridProps) {
  return (
    <div
      id="summary-cards-grid"
      className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {isLoading ? (
        <>
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </>
      ) : (
        <>
          <SummaryCard
            id="income"
            label="รายรับ"
            amount={summary?.totalIncome ?? 0}
            icon={
              <TrendingUp className="text-card-green h-4 w-4 sm:h-5 sm:w-5" />
            }
            iconBg="bg-card-green"
            hideAmounts={hideAmounts}
          />
          <SummaryCard
            id="expense"
            label="รายจ่าย"
            amount={summary?.totalExpense ?? 0}
            icon={
              <TrendingDown className="text-card-red h-4 w-4 sm:h-5 sm:w-5" />
            }
            iconBg="bg-card-red"
            hideAmounts={hideAmounts}
          />
          <SummaryCard
            id="balance"
            label="คงเหลือ"
            className="col-span-2 sm:col-span-1"
            amount={summary?.balance ?? 0}
            icon={
              <Wallet
                className={`h-4 w-4 sm:h-5 sm:w-5 ${summary && summary.balance >= 0 ? "text-card-blue" : "text-destructive"}`}
              />
            }
            iconBg={
              summary && summary.balance >= 0
                ? "bg-card-blue"
                : "bg-destructive/10"
            }
            hideAmounts={hideAmounts}
          />
        </>
      )}
    </div>
  );
}

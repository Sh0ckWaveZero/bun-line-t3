"use client";

import { ThaiHelpCalculatorSkeleton } from "@/features/expenses/components/LoadingSkeletons";
import { ThaiHelpCalculatorHeader } from "@/features/expenses/components/ThaiHelpCalculatorHeader";
import { ThaiHelpDailyProgress } from "@/features/expenses/components/ThaiHelpDailyProgress";
import { ThaiHelpTabNav } from "@/features/expenses/components/ThaiHelpTabNav";
import { ThaiHelpTabPanel } from "@/features/expenses/components/ThaiHelpTabPanel";
import { ThaiHelpSplitTab } from "@/features/expenses/components/ThaiHelpSplitTab";
import { ThaiHelpTopUpTab } from "@/features/expenses/components/ThaiHelpTopUpTab";
import { ThaiHelpStatsTab } from "@/features/expenses/components/ThaiHelpStatsTab";
import { IS_CO_PAYMENT_ACTIVE } from "@/features/expenses/helpers/coPayment";
import { useThaiHelpCalculator } from "@/features/expenses/hooks/useThaiHelpCalculator";
import { TrendingDown } from "lucide-react";

interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  isActive: boolean;
}

interface ThaiHelpCalculatorProps {
  categories: ExpenseCategory[];
  transactions: any[];
  isSaving: boolean;
  isLoading?: boolean;
  onSave: (input: {
    categoryId: string;
    type: "EXPENSE";
    amount: number;
    note: string;
    tags: string;
    transDate: string;
  }) => Promise<void>;
  refetch: () => void;
}

export function ThaiHelpCalculator(props: ThaiHelpCalculatorProps) {
  if (!IS_CO_PAYMENT_ACTIVE) return null;
  return <ThaiHelpCalculatorContent {...props} />;
}

function ThaiHelpCalculatorContent({
  categories,
  transactions,
  isSaving,
  isLoading = false,
  onSave,
  refetch,
}: ThaiHelpCalculatorProps) {
  const calc = useThaiHelpCalculator({
    categories,
    transactions,
    onSave,
    refetch,
  });

  return (
    <div
      id="thai-help-calculator-container"
      className="font-noto-sans-thai border-border/30 bg-card dark:bg-card/85 relative mb-6 overflow-hidden rounded-xl border shadow-sm"
    >
      {isLoading && <ThaiHelpCalculatorSkeleton />}

      {!isLoading && (
        <>
          {/* Main Header Action */}
          <ThaiHelpCalculatorHeader
            isOpen={calc.isOpen}
            onToggle={calc.toggleIsOpen}
            monthlyRemaining={calc.monthlyRemainingCombined}
            dailyRemaining={calc.dailyStats.todayRemaining}
          />

          {calc.isOpen && (
            <div
              id="thai-help-content"
              className="border-border/10 border-t p-5 transition-[opacity,transform] duration-300 ease-out"
            >
              {/* Daily Budget Progress Bar */}
              <ThaiHelpDailyProgress dailyStats={calc.dailyStats} />

              {/* Interactive Navigation Tabs */}
              <ThaiHelpTabNav
                activeTab={calc.activeTab}
                onChange={calc.setActiveTab}
                statsCount={calc.stats.count}
              />

              {/* Tab panels — always mounted, CSS crossfade on switch */}
              <div className="relative">
                {/* Split Bill */}
                <ThaiHelpTabPanel
                  id="thai-help-tab-split"
                  isActive={calc.activeTab === "split"}
                >
                  <ThaiHelpSplitTab
                    totalBill={calc.totalBill}
                    onTotalBillChange={calc.setTotalBill}
                    subsidy60={calc.subsidy60}
                    userPaid40={calc.userPaid40}
                    monthlyQuotaExceeded={calc.monthlyQuotaExceeded}
                    numericBill={calc.numericBill}
                    remainingSubsidy={calc.stats.remainingSubsidy}
                    categories={categories}
                    selectedCategoryId={calc.selectedCategoryId}
                    onSelectCategory={calc.setUserSelectedCategoryId}
                    onSaveExpense={calc.handleSaveExpense}
                    isSaving={isSaving}
                    saveError={calc.saveError}
                  />
                </ThaiHelpTabPanel>

                {/* Top Up */}
                <ThaiHelpTabPanel
                  id="thai-help-tab-topup"
                  isActive={calc.activeTab === "topup"}
                >
                  <ThaiHelpTopUpTab
                    desiredSubsidy={calc.desiredSubsidy}
                    onDesiredSubsidyChange={calc.setDesiredSubsidy}
                    topUpNeeded={calc.topUpNeeded}
                    purchaseValue={calc.purchaseValue}
                    numericSubsidy={calc.numericSubsidy}
                    copied={calc.copied}
                    onCopy={calc.handleCopyTopUp}
                  />
                </ThaiHelpTabPanel>

                {/* Stats */}
                <ThaiHelpTabPanel
                  id="thai-help-tab-stats"
                  isActive={calc.activeTab === "stats"}
                >
                  <ThaiHelpStatsTab stats={calc.stats} />
                </ThaiHelpTabPanel>
              </div>

              {/* Quick Notice */}
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2">
                <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-500" />
                <p className="text-xs leading-none font-medium text-red-700 dark:text-red-400">
                  เงิน 1,000 บาทต่อเดือน ของสิทธิ์รัฐช่วยจ่าย
                  หากใช้ไม่หมดจะไม่ทบไปเดือนถัดไป
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

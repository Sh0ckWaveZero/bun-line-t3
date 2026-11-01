"use client";

import { Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  TRANSACTION_TABS,
  type TransactionTab,
} from "@/features/expenses/constants";
import { SummaryCard } from "@/features/expenses/components/SummaryCard";
import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import { BudgetOverviewCard } from "@/features/expenses/components/BudgetOverviewCard";
import {
  BudgetOverviewSkeleton,
  ChartSkeleton,
  SummaryCardSkeleton,
} from "@/features/expenses/components/LoadingSkeletons";
import { ThaiHelpCalculator } from "@/features/expenses/components/ThaiHelpCalculator";
import type { useExpenseTransactions } from "@/features/expenses/hooks/useExpenseTransactions";
import type { useMonthlyCharts } from "@/features/expenses/hooks/useMonthlyCharts";
import type { useBudgets } from "@/features/expenses/hooks/useBudgets";
import type { MonthlySummary } from "@/features/expenses/types";
import {
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Tag,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

const ExpenseDonutChart = lazy(async () => {
  const module =
    await import("@/features/expenses/components/ExpenseDonutChart");
  return { default: module.ExpenseDonutChart };
});

const MonthlyBarChart = lazy(async () => {
  const module = await import("@/features/expenses/components/MonthlyBarChart");
  return { default: module.MonthlyBarChart };
});

type ExpenseTransactions = ReturnType<typeof useExpenseTransactions>;
type MonthlyCharts = ReturnType<typeof useMonthlyCharts>;
type Budgets = ReturnType<typeof useBudgets>;

interface ExpensesPageHeaderProps {
  hideAmounts: boolean;
  exporting: boolean;
  transactionCount: number;
  isLoading: boolean;
  onToggleAmounts: () => void;
  onExport: () => void;
  onOpenCategoryManager: () => void;
  onRefresh: () => void;
}

export function ExpensesPageHeader({
  hideAmounts,
  exporting,
  transactionCount,
  isLoading,
  onToggleAmounts,
  onExport,
  onOpenCategoryManager,
  onRefresh,
}: ExpensesPageHeaderProps) {
  return (
    <div
      id="expenses-header"
      className="border-border/70 bg-card/80 dark:bg-card/65 mb-6 overflow-hidden rounded-xl border p-4 sm:mb-8 sm:p-5"
    >
      <div
        id="expenses-header-inner"
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div id="expenses-header-title">
          <h1
            id="expenses-title"
            className="text-foreground text-2xl font-bold sm:text-3xl"
          >
            รายรับรายจ่าย
          </h1>
          <p
            id="expenses-subtitle"
            className="text-muted-foreground mt-1 max-w-2xl text-sm"
          >
            บันทึกและติดตามการเงินของคุณ
          </p>
        </div>
        <div
          id="expenses-header-actions"
          className="flex flex-wrap items-center gap-2"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="btn-toggle-amounts"
                variant="outline"
                size="sm"
                onClick={onToggleAmounts}
                aria-label={hideAmounts ? "แสดงจำนวนเงิน" : "ซ่อนจำนวนเงิน"}
                className="hover:bg-muted transition-colors"
              >
                {hideAmounts ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hideAmounts ? "แสดงจำนวนเงิน" : "ซ่อนจำนวนเงิน"}</p>
            </TooltipContent>
          </Tooltip>
          <Button
            id="btn-export"
            variant="outline"
            size="sm"
            disabled={exporting || transactionCount === 0}
            onClick={onExport}
            className="hover:bg-muted gap-2 transition-colors"
          >
            {exporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            id="btn-category-manager"
            variant="outline"
            size="sm"
            onClick={onOpenCategoryManager}
            className="hover:bg-muted gap-2 transition-colors"
          >
            <Tag size={14} />
            <span className="hidden sm:inline">หมวดหมู่</span>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="btn-refresh"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                aria-label="รีเฟรชข้อมูล"
                className="hover:bg-muted transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>รีเฟรชข้อมูล</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

interface ExpenseOverviewSectionProps {
  transactions: ExpenseTransactions["transactions"];
  summary: MonthlySummary | undefined;
  categorySummary: ExpenseTransactions["categorySummary"];
  categories: ExpenseTransactions["categories"];
  txLoading: boolean;
  txSaving: boolean;
  hideAmounts: boolean;
  createTransaction: ExpenseTransactions["createTransaction"];
  refetchTransactions: ExpenseTransactions["refetch"];
  budgets: Budgets["budgets"];
  onManageBudgets: () => void;
  showCharts: boolean;
  onToggleCharts: () => void;
  multiMonthSummaries: MonthlyCharts["multiMonthSummaries"];
}

export function ExpenseOverviewSection({
  transactions,
  summary,
  categorySummary,
  categories,
  txLoading,
  txSaving,
  hideAmounts,
  createTransaction,
  refetchTransactions,
  budgets,
  onManageBudgets,
  showCharts,
  onToggleCharts,
  multiMonthSummaries,
}: ExpenseOverviewSectionProps) {
  return (
    <>
      <div
        id="summary-cards-grid"
        className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {txLoading ? (
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

      <ThaiHelpCalculator
        categories={categories}
        transactions={transactions}
        isSaving={txSaving}
        isLoading={txLoading}
        onSave={createTransaction}
        refetch={refetchTransactions}
      />

      <div id="budget-overview-section" className="mb-6">
        {txLoading ? (
          <BudgetOverviewSkeleton />
        ) : (
          <BudgetOverviewCard
            budgets={budgets}
            hideAmounts={hideAmounts}
            onManageBudgets={onManageBudgets}
          />
        )}
      </div>

      <div id="charts-section" className="mb-4 sm:mb-6">
        <button
          id="btn-toggle-charts"
          type="button"
          onClick={onToggleCharts}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted flex w-full cursor-pointer items-center justify-between rounded-lg px-1 py-2 text-xs font-medium transition-colors"
        >
          <span id="charts-toggle-label">กราฟสรุป</span>
          <ChevronDown
            id="charts-toggle-icon"
            size={14}
            className={`transition-transform duration-200 ${showCharts ? "rotate-180" : ""}`}
          />
        </button>
        {showCharts && (
          <div id="charts-container" className="mt-2 space-y-3">
            <Suspense fallback={<ChartSkeleton height={200} />}>
              <ExpenseDonutChart
                data={categorySummary}
                hideAmounts={hideAmounts}
              />
            </Suspense>
            <Suspense fallback={<ChartSkeleton height={250} />}>
              <MonthlyBarChart
                data={multiMonthSummaries}
                hideAmounts={hideAmounts}
              />
            </Suspense>
          </div>
        )}
      </div>
    </>
  );
}

interface ExpenseTransactionsSectionProps {
  transactions: ExpenseTransactions["transactions"];
  txLoading: boolean;
  activeTab: TransactionTab;
  onTabChange: (tab: TransactionTab) => void;
  hideAmounts: boolean;
  onEditTransaction: (
    transaction: ExpenseTransactions["transactions"][number],
  ) => void;
  onDeleteTransaction: (id: string) => void;
}

export function ExpenseTransactionsSection({
  transactions,
  txLoading,
  activeTab,
  onTabChange,
  hideAmounts,
  onEditTransaction,
  onDeleteTransaction,
}: ExpenseTransactionsSectionProps) {
  const tabIndex = TRANSACTION_TABS.indexOf(activeTab);
  const tabCount = TRANSACTION_TABS.length;

  return (
    <Tabs
      id="transactions-tabs"
      value={activeTab}
      onValueChange={(value) => onTabChange(value as TransactionTab)}
    >
      <div
        id="transactions-tabs-list"
        role="tablist"
        className="bg-muted/50 relative mb-3 flex w-full rounded-xl p-1 sm:mb-4"
      >
        <div
          aria-hidden="true"
          className="bg-background absolute rounded-lg shadow-sm"
          style={{
            top: "4px",
            bottom: "4px",
            left: `calc(${(tabIndex / tabCount) * 100}% + ${4 - (tabIndex * 8) / tabCount}px)`,
            width: `calc(${(1 / tabCount) * 100}% - ${8 / tabCount}px)`,
            transition: "left 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        {TRANSACTION_TABS.map((tab) => (
          <button
            key={tab}
            id={`tab-trigger-${tab}`}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "relative z-10 flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors duration-200 sm:text-sm",
              activeTab === tab
                ? "text-foreground"
                : tab === "EXPENSE"
                  ? "text-card-red/60 hover:text-card-red"
                  : tab === "INCOME"
                    ? "text-card-green/60 hover:text-card-green"
                    : "text-muted-foreground hover:text-foreground/70",
            )}
          >
            {tab === "all"
              ? "ทั้งหมด"
              : tab === "EXPENSE"
                ? "รายจ่าย"
                : "รายรับ"}
          </button>
        ))}
      </div>
      {TRANSACTION_TABS.map((tab) => {
        const list =
          tab === "all"
            ? transactions
            : transactions.filter((transaction) => transaction.type === tab);
        return (
          <TabsContent
            id={`tab-content-${tab}`}
            key={tab}
            value={tab}
            className="data-[state=active]:animate-tab-in space-y-2 pb-24"
          >
            {txLoading && (
              <div
                id="transactions-loading"
                className="text-muted-foreground flex items-center justify-center py-12"
              >
                <Loader2 size={24} className="animate-spin" />
              </div>
            )}
            {!txLoading && list.length === 0 && (
              <Card
                id="transactions-empty-card"
                className="border-border/50 bg-card/60 dark:bg-card/45"
              >
                <CardContent
                  id="transactions-empty-content"
                  className="text-muted-foreground py-12 text-center"
                >
                  <p id="transactions-empty-msg" className="text-sm">
                    ยังไม่มีรายการ
                  </p>
                </CardContent>
              </Card>
            )}
            <div id={`transactions-list-${tab}`} className="space-y-2">
              {list.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  tx={transaction}
                  onEdit={onEditTransaction}
                  onDelete={onDeleteTransaction}
                  hideAmounts={hideAmounts}
                />
              ))}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

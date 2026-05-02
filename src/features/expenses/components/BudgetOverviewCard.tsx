/**
 * BudgetOverviewCard - สรุปสถานะงบประมาณ
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Wallet, AlertTriangle, CheckCircle2, Settings, TrendingUp } from "lucide-react";
import type { BudgetUsage } from "@/features/expenses/services/budget.server";
import { formatAmount } from "@/features/expenses/helpers";

interface BudgetOverviewCardProps {
  budgets: BudgetUsage[];
  hideAmounts?: boolean;
  onManageBudgets?: () => void;
}

export function BudgetOverviewCard({
  budgets,
  hideAmounts = false,
  onManageBudgets,
}: BudgetOverviewCardProps) {
  const safeBudgets = budgets.filter((b) => !b.isOverBudget && !b.isNearLimit).length;
  const nearLimitBudgets = budgets.filter((b) => b.isNearLimit && !b.isOverBudget).length;
  const overBudgets = budgets.filter((b) => b.isOverBudget).length;

  return (
    <Card className="border-border/70 bg-card/85 dark:bg-card/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            งบประมาณ
          </CardTitle>
          {onManageBudgets && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onManageBudgets}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-1.5 rounded-md bg-green-500/10 px-2 py-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">{safeBudgets}</span>
            <span className="text-muted-foreground">ปลอดภัย</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-yellow-500/10 px-2 py-1 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">{nearLimitBudgets}</span>
            <span className="text-muted-foreground">ใกล้เกิน</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-red-600 dark:text-red-400">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">{overBudgets}</span>
            <span className="text-muted-foreground">เกินงบ</span>
          </div>
        </div>

        {/* Budget List */}
        {budgets.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            <p className="mb-3 text-sm">ยังไม่มีงบประมาณ</p>
            {onManageBudgets && (
              <Button variant="outline" size="sm" onClick={onManageBudgets}>
                ตั้งงบใหม่
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {budgets.slice(0, 3).map((budgetUsage) => (
              <BudgetItem
                key={budgetUsage.budget.id}
                budgetUsage={budgetUsage}
                hideAmounts={hideAmounts}
              />
            ))}
            {budgets.length > 3 && (
              <Button
                variant="link"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={onManageBudgets}
              >
                ดูทั้งหมด ({budgets.length} งบ)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BudgetItemProps {
  budgetUsage: BudgetUsage;
  hideAmounts?: boolean;
}

function BudgetItem({ budgetUsage, hideAmounts }: BudgetItemProps) {
  const { budget, spent, percentage, isOverBudget, isNearLimit } = budgetUsage;
  const categoryName = budget.category?.name || "งบรวม";
  const categoryIcon = budget.category?.icon || "💰";

  // Determine status color
  const getStatusColor = () => {
    if (isOverBudget) return "text-red-600 dark:text-red-400";
    if (isNearLimit) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const remaining = Math.max(budget.amount - spent, 0);
  const displayPercentage = Math.min(percentage, 100);

  return (
    <div className="space-y-1.5 rounded-lg border border-border/60 bg-background/50 p-2.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-base">{categoryIcon}</span>
          <span className="font-medium">{categoryName}</span>
        </div>
        <span className={`font-semibold ${getStatusColor()}`}>
          {displayPercentage.toFixed(0)}%
        </span>
      </div>

      <Progress value={displayPercentage} className="h-1.5" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          ใช้ {hideAmounts ? "•••" : formatAmount(spent)} / {hideAmounts ? "•••" : formatAmount(budget.amount)}
        </span>
        <span>
          เหลือ {hideAmounts ? "•••" : formatAmount(remaining)}
        </span>
      </div>
    </div>
  );
}

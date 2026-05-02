import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
    <TooltipProvider>
      <Card id="budget-overview-card" className="border-border/70 bg-card/85 dark:bg-card/70">
      <CardHeader id="budget-header" className="pb-2">
        <div id="budget-header-inner" className="flex items-center justify-between">
          <CardTitle id="budget-title" className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            งบประมาณ
          </CardTitle>
          {onManageBudgets && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button id="btn-budget-settings" variant="ghost" size="icon" className="hover:bg-muted h-8 w-8 transition-colors" onClick={onManageBudgets}>
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>ตั้งค่างบประมาณ</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>
      <CardContent id="budget-content" className="space-y-3">
        <div id="budget-status-grid" className="grid grid-cols-3 gap-2 text-sm">
          <div id="budget-status-safe" className="flex items-center gap-1.5 rounded-md bg-green-500/10 px-2 py-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">{safeBudgets}</span>
            <span className="text-muted-foreground">ปลอดภัย</span>
          </div>
          <div id="budget-status-near" className="flex items-center gap-1.5 rounded-md bg-yellow-500/10 px-2 py-1 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">{nearLimitBudgets}</span>
            <span className="text-muted-foreground">ใกล้เกิน</span>
          </div>
          <div id="budget-status-over" className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-red-600 dark:text-red-400">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">{overBudgets}</span>
            <span className="text-muted-foreground">เกินงบ</span>
          </div>
        </div>

        {budgets.length === 0 ? (
          <div id="budget-empty-state" className="py-4 text-center text-muted-foreground">
            <p id="budget-empty-msg" className="mb-3 text-sm">ยังไม่มีงบประมาณ</p>
            {onManageBudgets && (
              <Button id="btn-new-budget" variant="outline" size="sm" onClick={onManageBudgets}>
                ตั้งงบใหม่
              </Button>
            )}
          </div>
        ) : (
          <div id="budget-items-list" className="space-y-2.5">
            {budgets.slice(0, 3).map((budgetUsage) => (
              <BudgetItem
                key={budgetUsage.budget.id}
                budgetUsage={budgetUsage}
                hideAmounts={hideAmounts}
              />
            ))}
            {budgets.length > 3 && (
              <Button
                id="btn-view-all-budgets"
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
    </TooltipProvider>
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

  const getStatusColor = () => {
    if (isOverBudget) return "text-red-600 dark:text-red-400";
    if (isNearLimit) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const remaining = Math.max(budget.amount - spent, 0);
  const displayPercentage = Math.min(percentage, 100);

  return (
    <div id={`budget-item-${budget.id}`} className="space-y-1.5 rounded-lg border border-border/60 bg-background/50 p-2.5">
      <div id={`budget-item-header-${budget.id}`} className="flex items-center justify-between text-sm">
        <div id={`budget-item-left-${budget.id}`} className="flex items-center gap-2">
          <span id={`budget-item-icon-${budget.id}`} className="text-base">{categoryIcon}</span>
          <span id={`budget-item-name-${budget.id}`} className="font-medium">{categoryName}</span>
        </div>
        <span id={`budget-item-pct-${budget.id}`} className={`font-semibold ${getStatusColor()}`}>
          {displayPercentage.toFixed(0)}%
        </span>
      </div>

      <Progress id={`budget-item-progress-${budget.id}`} value={displayPercentage} className="h-1.5" />

      <div id={`budget-item-details-${budget.id}`} className="flex items-center justify-between text-xs text-muted-foreground">
        <span id={`budget-item-spent-${budget.id}`}>
          ใช้ {hideAmounts ? "•••" : formatAmount(spent)} / {hideAmounts ? "•••" : formatAmount(budget.amount)}
        </span>
        <span id={`budget-item-remaining-${budget.id}`}>
          เหลือ {hideAmounts ? "•••" : formatAmount(remaining)}
        </span>
      </div>
    </div>
  );
}

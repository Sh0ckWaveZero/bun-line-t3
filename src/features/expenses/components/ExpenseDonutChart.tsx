import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/features/expenses/helpers";
import type { CategorySummary } from "@/features/expenses/types";
import { LazyDoughnutChart } from "@/components/charts/LazyCharts";

const DONUT_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

interface ExpenseDonutChartProps {
  data: CategorySummary[];
  hideAmounts?: boolean;
}

export function ExpenseDonutChart({
  data,
  hideAmounts,
}: ExpenseDonutChartProps) {
  const expenses = data.filter((c) => c.type === "EXPENSE").slice(0, 6);
  if (expenses.length === 0) return null;

  const slices = expenses.map((category, index) => ({
    label: `${category.icon ?? "📦"} ${category.categoryName}`,
    value: category.total,
    color: DONUT_COLORS[index % DONUT_COLORS.length]!,
  }));

  return (
    <Card className="border-border/70 bg-card/85 dark:bg-card/70 border">
      <CardHeader className="px-3 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-3">
        <CardTitle className="text-muted-foreground text-xs font-semibold sm:text-sm">
          สัดส่วนรายจ่าย
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="h-[240px] sm:h-[250px]">
          <LazyDoughnutChart
            slices={slices}
            formatValue={(value) => formatAmount(value)}
            tooltipDisabled={hideAmounts}
            ariaLabel="กราฟโดนัทสัดส่วนรายจ่ายตามหมวดหมู่"
          />
        </div>
      </CardContent>
    </Card>
  );
}

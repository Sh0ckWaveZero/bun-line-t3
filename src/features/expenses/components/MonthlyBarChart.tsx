import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/features/expenses/helpers";
import type { MonthlySummary } from "@/features/expenses/types";
import { LazyBarChart } from "@/components/charts/LazyCharts";

const MONTH_SHORT_TH = [
  "ม.ค",
  "ก.พ",
  "มี.ค",
  "เม.ย",
  "พ.ค",
  "มิ.ย",
  "ก.ค",
  "ส.ค",
  "ก.ย",
  "ต.ค",
  "พ.ย",
  "ธ.ค",
];

function shortMonthLabel(transMonth: string): string {
  const month = parseInt(transMonth.split("-")[1] ?? "1", 10);
  return MONTH_SHORT_TH[month - 1] ?? "";
}

function shortAmount(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toFixed(0);
}

interface MonthlyBarChartProps {
  data: MonthlySummary[];
  hideAmounts?: boolean;
}

export function MonthlyBarChart({ data, hideAmounts }: MonthlyBarChartProps) {
  if (data.length === 0) return null;

  const reversed = [...data].reverse();

  return (
    <Card className="border-border/70 bg-card/85 dark:bg-card/70 border">
      <CardHeader className="px-3 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-3">
        <CardTitle className="text-muted-foreground text-xs font-semibold sm:text-sm">
          รายรับ-รายจ่าย 6 เดือน
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="h-[240px] sm:h-[250px]">
          <LazyBarChart
            labels={reversed.map((item) => shortMonthLabel(item.transMonth))}
            series={[
              {
                label: "รายรับ",
                values: reversed.map((item) => item.totalIncome),
                color: "#22c55e",
              },
              {
                label: "รายจ่าย",
                values: reversed.map((item) => item.totalExpense),
                color: "#ef4444",
              },
            ]}
            formatValue={(value) => `${formatAmount(value)} บาท`}
            formatYTick={hideAmounts ? () => "•••" : shortAmount}
            tooltipDisabled={hideAmounts}
            ariaLabel="กราฟแท่งรายรับ-รายจ่ายย้อนหลัง 6 เดือน"
          />
        </div>
      </CardContent>
    </Card>
  );
}

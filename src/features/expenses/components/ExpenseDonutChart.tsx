import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatAmount } from "@/features/expenses/helpers"
import type { CategorySummary } from "@/features/expenses/types"
import { ArcElement, Chart as ChartJS, Legend as ChartLegend, Tooltip as ChartTooltip } from "chart.js"
import { Doughnut } from "react-chartjs-2"

ChartJS.register(ArcElement, ChartTooltip, ChartLegend)

const DONUT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
]
const CHART_LABEL_COLOR = "#6b7280"

interface ExpenseDonutChartProps {
  data: CategorySummary[]
  hideAmounts?: boolean
}

export function ExpenseDonutChart({ data, hideAmounts }: ExpenseDonutChartProps) {
  const expenses = data.filter((c) => c.type === "EXPENSE").slice(0, 6)
  if (expenses.length === 0) return null

  const chartData = {
    labels: expenses.map((c) => `${c.icon ?? "📦"} ${c.categoryName}`),
    datasets: [
      {
        data: expenses.map((c) => c.total),
        backgroundColor: DONUT_COLORS.slice(0, expenses.length),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { bottom: 4 } },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: { size: 10 },
          color: CHART_LABEL_COLOR,
          padding: 8,
          boxWidth: 8,
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: !hideAmounts,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => {
            const item = expenses[ctx.dataIndex as number] as CategorySummary | undefined
            return ` ${formatAmount(ctx.raw as number)} (${item?.percentage.toFixed(1) ?? 0}%)`
          },
        },
      },
    },
  }

  return (
    <Card className="border-border/70 bg-card/85 dark:bg-card/70 border">
      <CardHeader className="px-3 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-3">
        <CardTitle className="text-muted-foreground text-xs font-semibold sm:text-sm">
          สัดส่วนรายจ่าย
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="h-[240px] sm:h-[250px]">
          <Doughnut data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}

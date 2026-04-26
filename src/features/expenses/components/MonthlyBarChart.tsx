import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatAmount } from "@/features/expenses/helpers"
import type { MonthlySummary } from "@/features/expenses/types"
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend as ChartLegend,
  LinearScale,
  Tooltip as ChartTooltip,
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, ChartLegend)

const MONTH_SHORT_TH = [
  "ม.ค", "ก.พ", "มี.ค", "เม.ย", "พ.ค", "มิ.ย",
  "ก.ค", "ส.ค", "ก.ย", "ต.ค", "พ.ย", "ธ.ค",
]
const CHART_LABEL_COLOR = "#6b7280"
const CHART_GRID_COLOR = "rgba(107,114,128,0.15)"

function shortMonthLabel(transMonth: string): string {
  const month = parseInt(transMonth.split("-")[1] ?? "1", 10)
  return MONTH_SHORT_TH[month - 1] ?? ""
}

function shortAmount(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toFixed(0)
}

interface MonthlyBarChartProps {
  data: MonthlySummary[]
  hideAmounts?: boolean
}

export function MonthlyBarChart({ data, hideAmounts }: MonthlyBarChartProps) {
  if (data.length === 0) return null

  const reversed = [...data].reverse()

  const chartData = {
    labels: reversed.map((d) => shortMonthLabel(d.transMonth)),
    datasets: [
      {
        label: "รายรับ",
        data: reversed.map((d) => d.totalIncome),
        backgroundColor: "#22c55e55",
        borderColor: "#22c55e",
        borderWidth: 1.5,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "รายจ่าย",
        data: reversed.map((d) => d.totalExpense),
        backgroundColor: "#ef444455",
        borderColor: "#ef4444",
        borderWidth: 1.5,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { size: 10 },
          color: CHART_LABEL_COLOR,
          padding: 10,
          boxWidth: 8,
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: !hideAmounts,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => ` ${formatAmount(ctx.raw as number)} บาท`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: CHART_LABEL_COLOR, maxRotation: 0 },
        border: { display: false },
      },
      y: {
        grid: { color: CHART_GRID_COLOR },
        ticks: {
          font: { size: 10 },
          color: CHART_LABEL_COLOR,
          maxTicksLimit: 4,
          callback: hideAmounts
            ? () => "•••"
            : (v: unknown) => shortAmount(v as number),
        },
        border: { display: false },
      },
    },
  }

  return (
    <Card className="border-border/70 bg-card/85 dark:bg-card/70 border">
      <CardHeader className="px-3 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-3">
        <CardTitle className="text-muted-foreground text-xs font-semibold sm:text-sm">
          รายรับ-รายจ่าย 6 เดือน
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="h-[240px] sm:h-[250px]">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}

import { lazy, Suspense } from "react";
import { ChartSkeleton } from "@/features/expenses/components/LoadingSkeletons";
import type {
  CategorySummary,
  MonthlySummary,
} from "@/features/expenses/types";
import { ChevronDown } from "lucide-react";

const ExpenseDonutChart = lazy(async () => {
  const module =
    await import("@/features/expenses/components/ExpenseDonutChart");
  return { default: module.ExpenseDonutChart };
});

const MonthlyBarChart = lazy(async () => {
  const module = await import("@/features/expenses/components/MonthlyBarChart");
  return { default: module.MonthlyBarChart };
});

interface ChartsSectionProps {
  showCharts: boolean;
  onToggleCharts: () => void;
  categorySummary: CategorySummary[];
  multiMonthSummaries: MonthlySummary[];
  hideAmounts: boolean;
}

/** ส่วนกราฟสรุป (toggle + donut/bar charts แบบ lazy load) */
export function ChartsSection({
  showCharts,
  onToggleCharts,
  categorySummary,
  multiMonthSummaries,
  hideAmounts,
}: ChartsSectionProps) {
  return (
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
  );
}

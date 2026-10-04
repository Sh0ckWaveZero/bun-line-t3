import { lazy, Suspense } from "react";
import type { ChartProps } from "react-chartjs-2";
import { registerChartJs } from "@/lib/chart-registration";

type DoughnutChartProps = Omit<ChartProps<"doughnut">, "type">;
type BarChartProps = Omit<ChartProps<"bar">, "type">;
type LineChartProps = Omit<ChartProps<"line">, "type">;

const LazyDoughnut = lazy(async () => {
  await registerChartJs();
  const { Doughnut } = await import("react-chartjs-2");
  return { default: Doughnut };
});

const LazyBar = lazy(async () => {
  await registerChartJs();
  const { Bar } = await import("react-chartjs-2");
  return { default: Bar };
});

const LazyLine = lazy(async () => {
  await registerChartJs();
  const { Line } = await import("react-chartjs-2");
  return { default: Line };
});

function ChartFallback() {
  return (
    <div
      className="text-muted-foreground flex min-h-48 items-center justify-center"
      role="status"
    >
      กำลังโหลดกราฟ...
    </div>
  );
}

export function LazyDoughnutChart(props: DoughnutChartProps) {
  return (
    <Suspense fallback={<ChartFallback />}>
      <LazyDoughnut {...props} />
    </Suspense>
  );
}

export function LazyBarChart(props: BarChartProps) {
  return (
    <Suspense fallback={<ChartFallback />}>
      <LazyBar {...props} />
    </Suspense>
  );
}

export function LazyLineChart(props: LineChartProps) {
  return (
    <Suspense fallback={<ChartFallback />}>
      <LazyLine {...props} />
    </Suspense>
  );
}

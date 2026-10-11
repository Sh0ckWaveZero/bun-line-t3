import { lazy, Suspense } from "react";
import type {
  BarChartProps,
  DoughnutChartProps,
  DoughnutSlice,
  LineChartProps,
} from "./tanstack-charts";

export type {
  BarChartProps,
  DoughnutChartProps,
  DoughnutSlice,
  LineChartProps,
};

const LazyLine = lazy(() =>
  import("./tanstack-charts").then((m) => ({ default: m.LineChart })),
);

const LazyBar = lazy(() =>
  import("./tanstack-charts").then((m) => ({ default: m.BarChart })),
);

const LazyDoughnut = lazy(() =>
  import("./tanstack-charts").then((m) => ({ default: m.DoughnutChart })),
);

/* ไม่ใส่ fallback ระหว่างโหลด chunk — skeleton ของหน้ารับงานแทนแล้ว
   กราฟจะโผล่เองเมื่อพร้อม (แผงกราฟมี height ล็อกอยู่แล้ว ไม่มี layout shift) */

export function LazyLineChart(props: LineChartProps) {
  return (
    <Suspense fallback={null}>
      <LazyLine {...props} />
    </Suspense>
  );
}

export function LazyBarChart(props: BarChartProps) {
  return (
    <Suspense fallback={null}>
      <LazyBar {...props} />
    </Suspense>
  );
}

export function LazyDoughnutChart(props: DoughnutChartProps) {
  return (
    <Suspense fallback={null}>
      <LazyDoughnut {...props} />
    </Suspense>
  );
}

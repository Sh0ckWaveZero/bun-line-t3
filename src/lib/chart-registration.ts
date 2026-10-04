let chartRegistration: Promise<void> | undefined;

export function registerChartJs(): Promise<void> {
  chartRegistration ??= import("chart.js").then(({ Chart, ...components }) => {
    Chart.register(
      components.LineElement,
      components.BarElement,
      components.ArcElement,
      components.CategoryScale,
      components.LinearScale,
      components.PointElement,
      components.Tooltip,
      components.Legend,
      components.Filler,
    );
    Chart.defaults.font.family = "Prompt, sans-serif";
    Chart.defaults.font.size = 12;
  });

  return chartRegistration;
}

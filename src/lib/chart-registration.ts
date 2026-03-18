/**
 * Optimized Chart.js registration
 * Tree-shakeable imports for smaller bundle size
 *
 * This file registers only the Chart.js components we actually use,
 * reducing the bundle size by ~150KB compared to importing 'chart.js/auto'
 */
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register only the components used in our charts
ChartJS.register(
  LineElement, // For line charts (HoursWorkedChart, DailyAverageChart)
  BarElement, // For bar charts (if used)
  ArcElement, // For donut charts (AttendanceDonutChart, ComplianceDonutChart)
  CategoryScale, // X-axis category scale
  LinearScale, // Y-axis linear scale
  PointElement, // Points on line charts
  Tooltip, // Interactive tooltips
  Legend, // Chart legends
  Filler, // Fill area under line charts
);

export { ChartJS };

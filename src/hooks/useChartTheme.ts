"use client";

import { useClientOnlyMounted } from "@/hooks/useHydrationSafe";
import { useTheme } from "@/lib/theme/theme-provider";
import type { ChartTheme } from "@tanstack/charts";

/**
 * ธีมสีของกราฟ TanStack Charts ตามโหมด light/dark
 * สีอิง palette slate ของ admin UI (line-permissions pattern)
 */
const LIGHT_CHART_THEME: Partial<ChartTheme> = {
  foreground: "#0f172a",
  muted: "#64748b",
  grid: "rgba(100, 116, 139, 0.16)",
  background: "transparent",
  palette: ["#2563eb", "#0d9488", "#6366f1", "#f59e0b", "#10b981", "#94a3b8"],
};

const DARK_CHART_THEME: Partial<ChartTheme> = {
  foreground: "#e2e8f0",
  muted: "#94a3b8",
  grid: "rgba(148, 163, 184, 0.14)",
  background: "transparent",
  palette: ["#60a5fa", "#2dd4bf", "#818cf8", "#fbbf24", "#34d399", "#94a3b8"],
};

export const useChartTheme = () => {
  const { theme, systemTheme } = useTheme();
  const mounted = useClientOnlyMounted();

  const isDark =
    mounted &&
    (theme === "dark" || (theme === "system" && systemTheme === "dark"));

  return {
    isDark,
    mounted,
    chartTheme: isDark ? DARK_CHART_THEME : LIGHT_CHART_THEME,
  };
};

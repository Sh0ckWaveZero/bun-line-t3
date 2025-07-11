/**
 * Shared color scheme constants for chart generators
 */

// Base color palette
export const CHART_COLORS = {
  // Primary colors
  PRIMARY_GREEN: "#10b981",
  PRIMARY_BLUE: "#3b82f6",
  PRIMARY_YELLOW: "#f59e0b",
  PRIMARY_RED: "#ef4444",
  PRIMARY_PURPLE: "#8b5cf6",
  PRIMARY_CYAN: "#06b6d4",
  PRIMARY_LIME: "#84cc16",
  PRIMARY_ORANGE: "#f97316",
  PRIMARY_PINK: "#ec4899",
  PRIMARY_INDIGO: "#6366f1",

  // Semantic colors
  SUCCESS: "#10b981",
  SUCCESS_DARK: "#059669",
  ERROR: "#ef4444",
  ERROR_DARK: "#dc2626",
  WARNING: "#f59e0b",
  WARNING_DARK: "#d97706",
  INFO: "#3b82f6",
  INFO_DARK: "#2563eb",

  // Background colors
  BACKGROUND_PRIMARY: "#1a1a1a",
  BACKGROUND_SECONDARY: "#1f2937",
  BACKGROUND_TERTIARY: "#374151",

  // Text colors
  TEXT_PRIMARY: "#ffffff",
  TEXT_SECONDARY: "#cccccc",
  TEXT_TERTIARY: "#666666",

  // Border and grid colors
  BORDER_PRIMARY: "#333333",
  BORDER_SECONDARY: "#444444",
  GRID_COLOR: "#333333",

  // Transparent versions
  TRANSPARENT: {
    GREEN_20: "#10b98120",
    GREEN_30: "#10b98130",
    RED_20: "#ef444420",
    RED_30: "#ef444430",
    BLUE_20: "#3b82f620",
    BLUE_30: "#3b82f630",
    YELLOW_20: "#f59e0b20",
    YELLOW_30: "#f59e0b30",
  },
} as const;

// Color arrays for multi-series charts
export const MULTI_SERIES_COLORS = [
  CHART_COLORS.PRIMARY_GREEN,
  CHART_COLORS.PRIMARY_BLUE,
  CHART_COLORS.PRIMARY_YELLOW,
  CHART_COLORS.PRIMARY_RED,
  CHART_COLORS.PRIMARY_PURPLE,
  CHART_COLORS.PRIMARY_CYAN,
  CHART_COLORS.PRIMARY_LIME,
  CHART_COLORS.PRIMARY_ORANGE,
  CHART_COLORS.PRIMARY_PINK,
  CHART_COLORS.PRIMARY_INDIGO,
] as const;

// Portfolio colors for pie/doughnut charts
export const PORTFOLIO_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#6366f1",
] as const;

// Utility functions for color selection
export const getColorByTrend = (value: number): string => {
  return value >= 0 ? CHART_COLORS.SUCCESS : CHART_COLORS.ERROR;
};

export const getColorByTrendWithAlpha = (
  value: number,
  alpha: number = 0.2,
): string => {
  const baseColor = value >= 0 ? CHART_COLORS.SUCCESS : CHART_COLORS.ERROR;
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${baseColor}${alphaHex}`;
};

export const getDarkColorByTrend = (value: number): string => {
  return value >= 0 ? CHART_COLORS.SUCCESS_DARK : CHART_COLORS.ERROR_DARK;
};

export const getMultiSeriesColor = (index: number): string => {
  return (
    MULTI_SERIES_COLORS[index % MULTI_SERIES_COLORS.length] ||
    CHART_COLORS.PRIMARY_BLUE
  );
};

export const getPortfolioColor = (index: number): string => {
  return (
    PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length] ||
    CHART_COLORS.PRIMARY_BLUE
  );
};

// Color schemes for different chart types
export const COLOR_SCHEMES = {
  CRYPTO_TREND: {
    positive: {
      primary: CHART_COLORS.SUCCESS,
      secondary: CHART_COLORS.SUCCESS_DARK,
      background: CHART_COLORS.TRANSPARENT.GREEN_20,
      gradient: `linear-gradient(to bottom, ${CHART_COLORS.SUCCESS}30, ${CHART_COLORS.SUCCESS}05)`,
    },
    negative: {
      primary: CHART_COLORS.ERROR,
      secondary: CHART_COLORS.ERROR_DARK,
      background: CHART_COLORS.TRANSPARENT.RED_20,
      gradient: `linear-gradient(to bottom, ${CHART_COLORS.ERROR}30, ${CHART_COLORS.ERROR}05)`,
    },
  },
  DARK_THEME: {
    background: CHART_COLORS.BACKGROUND_PRIMARY,
    text: CHART_COLORS.TEXT_PRIMARY,
    textSecondary: CHART_COLORS.TEXT_SECONDARY,
    textTertiary: CHART_COLORS.TEXT_TERTIARY,
    border: CHART_COLORS.BORDER_PRIMARY,
    grid: CHART_COLORS.GRID_COLOR,
    tooltip: CHART_COLORS.BACKGROUND_SECONDARY,
  },
} as const;

// Export type for color schemes
export type ColorScheme = typeof COLOR_SCHEMES.DARK_THEME;
export type TrendColorScheme = typeof COLOR_SCHEMES.CRYPTO_TREND.positive;

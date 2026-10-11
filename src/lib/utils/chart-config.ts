import {
  ChartGeneratorConfig,
  ChartMargins,
  ChartDimensions,
  ChartStyle,
  FontConfig,
  SvgGenerationOptions,
} from "./chart-types";
import { CHART_COLORS, COLOR_SCHEMES } from "./chart-colors";

/**
 * Shared chart configuration constants (server-side d3/canvas generator)
 */

// Default chart generator configuration
export const DEFAULT_CHART_CONFIG: ChartGeneratorConfig = {
  width: 800,
  height: 600,
  backgroundColour: CHART_COLORS.BACKGROUND_PRIMARY,
};

// Large chart configuration for detailed charts
export const LARGE_CHART_CONFIG: ChartGeneratorConfig = {
  width: 1040,
  height: 1040,
  backgroundColour: CHART_COLORS.BACKGROUND_PRIMARY,
};

// Standard chart margins
export const CHART_MARGINS: Record<string, ChartMargins> = {
  DEFAULT: {
    top: 80,
    right: 50,
    bottom: 100,
    left: 100,
  },
  COMPACT: {
    top: 40,
    right: 30,
    bottom: 60,
    left: 80,
  },
  SPACIOUS: {
    top: 100,
    right: 80,
    bottom: 120,
    left: 120,
  },
};

// Font configurations for SVG compatibility
export const FONT_CONFIGS: Record<string, FontConfig> = {
  TITLE: {
    family: "'Prompt', 'Noto Sans Thai', Arial, sans-serif",
    size: 18,
    weight: "bold",
  },
  TITLE_LARGE: {
    family: "'Prompt', 'Noto Sans Thai', Arial, sans-serif",
    size: 26,
    weight: 600,
  },
  AXIS: {
    family: "'Prompt', 'Noto Sans Thai', Arial, sans-serif",
    size: 14,
    weight: "bold",
  },
  AXIS_LARGE: {
    family: "'Prompt', 'Noto Sans Thai', Arial, sans-serif",
    size: 15,
    weight: 500,
  },
  LABEL: {
    family: "'Prompt', 'Noto Sans Thai', Arial, sans-serif",
    size: 12,
    weight: "normal",
  },
  LABEL_LARGE: {
    family: "'Prompt', 'Noto Sans Thai', Arial, sans-serif",
    size: 13,
    weight: 400,
  },
  STATS: {
    family: "'Prompt', 'Noto Sans Thai', Arial, sans-serif",
    size: 16,
    weight: 600,
  },
  STATS_LARGE: {
    family: "'Prompt', 'Noto Sans Thai', Arial, sans-serif",
    size: 15,
    weight: 500,
  },
};

// Chart style configurations
export const CHART_STYLES: Record<string, ChartStyle> = {
  DARK: {
    backgroundColor: COLOR_SCHEMES.DARK_THEME.background,
    textColor: COLOR_SCHEMES.DARK_THEME.text,
    gridColor: COLOR_SCHEMES.DARK_THEME.grid,
    borderColor: COLOR_SCHEMES.DARK_THEME.border,
    fonts: {
      title: FONT_CONFIGS.TITLE!,
      axis: FONT_CONFIGS.AXIS!,
      label: FONT_CONFIGS.LABEL!,
      stats: FONT_CONFIGS.STATS!,
    },
  },
  DARK_LARGE: {
    backgroundColor: COLOR_SCHEMES.DARK_THEME.background,
    textColor: COLOR_SCHEMES.DARK_THEME.text,
    gridColor: COLOR_SCHEMES.DARK_THEME.grid,
    borderColor: COLOR_SCHEMES.DARK_THEME.border,
    fonts: {
      title: FONT_CONFIGS.TITLE_LARGE || FONT_CONFIGS.TITLE!,
      axis: FONT_CONFIGS.AXIS_LARGE || FONT_CONFIGS.AXIS!,
      label: FONT_CONFIGS.LABEL_LARGE || FONT_CONFIGS.LABEL!,
      stats: FONT_CONFIGS.STATS_LARGE || FONT_CONFIGS.STATS!,
    },
  },
};

// SVG generation options
export const SVG_GENERATION_OPTIONS: Record<string, SvgGenerationOptions> = {
  STANDARD: {
    width: 800,
    height: 600,
    includeTimestamp: true,
    includeDataSource: true,
    dataSourceText: "Data: Bitkub API",
  },
  LARGE: {
    width: 1040,
    height: 1040,
    includeTimestamp: true,
    includeDataSource: true,
    dataSourceText: "Data: Bitkub API",
  },
  COMPACT: {
    width: 460,
    height: 460,
    includeTimestamp: false,
    includeDataSource: false,
  },
};

// Helper function to create chart dimensions
export const createChartDimensions = (
  width: number,
  height: number,
  marginKey: keyof typeof CHART_MARGINS = "DEFAULT",
): ChartDimensions => {
  const margin = CHART_MARGINS[marginKey] || CHART_MARGINS.DEFAULT!;
  return {
    width,
    height,
    margin,
    chartWidth: width - margin.left - margin.right,
    chartHeight: height - margin.top - margin.bottom,
  };
};

// Export utility functions
export const getChartTitle = (
  cryptoName: string,
  exchange: string,
  chartType: string = "Price Chart",
): string => {
  return `${cryptoName} ${chartType} - ${exchange}`;
};

export const formatPriceLabel = (price: number): string => {
  return `฿${price.toLocaleString("th-TH")}`;
};

export const formatPercentageLabel = (percentage: number): string => {
  return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;
};

export const getTimestamp = (): string => {
  return new Date().toLocaleString("th-TH");
};

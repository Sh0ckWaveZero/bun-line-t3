import { ChartConfiguration } from "chart.js";
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
 * Shared chart configuration constants
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

// Font configurations
export const FONT_CONFIGS: Record<string, FontConfig> = {
  TITLE: {
    family: "Arial, sans-serif",
    size: 18,
    weight: "bold",
  },
  TITLE_LARGE: {
    family:
      "Prompt, Noto Sans Thai, Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
    size: 26,
    weight: 600,
  },
  AXIS: {
    family: "Arial, sans-serif",
    size: 14,
    weight: "bold",
  },
  AXIS_LARGE: {
    family:
      "Prompt, Noto Sans Thai, Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
    size: 15,
    weight: 500,
  },
  LABEL: {
    family: "Arial, sans-serif",
    size: 12,
    weight: "normal",
  },
  LABEL_LARGE: {
    family:
      "Prompt, Noto Sans Thai, Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
    size: 13,
    weight: 400,
  },
  STATS: {
    family: "Arial, sans-serif",
    size: 16,
    weight: 600,
  },
  STATS_LARGE: {
    family:
      "Prompt, Noto Sans Thai, Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
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

// Chart.js base configuration for crypto line charts
export const CRYPTO_LINE_CHART_CONFIG: Partial<ChartConfiguration<"line">> = {
  type: "line",
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Time",
          color: CHART_COLORS.TEXT_PRIMARY,
        },
        ticks: {
          color: CHART_COLORS.TEXT_SECONDARY,
          maxTicksLimit: 8,
        },
        grid: {
          color: CHART_COLORS.GRID_COLOR,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Price (THB)",
          color: CHART_COLORS.TEXT_PRIMARY,
        },
        ticks: {
          color: CHART_COLORS.TEXT_SECONDARY,
          callback: function (value) {
            return `฿${Number(value).toLocaleString("th-TH")}`;
          },
        },
        grid: {
          color: CHART_COLORS.GRID_COLOR,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: CHART_COLORS.TEXT_PRIMARY,
        },
      },
      tooltip: {
        backgroundColor: CHART_COLORS.BACKGROUND_SECONDARY,
        titleColor: CHART_COLORS.TEXT_PRIMARY,
        bodyColor: CHART_COLORS.TEXT_PRIMARY,
        borderWidth: 1,
      },
    },
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
  },
};

// Chart.js base configuration for crypto bar charts
export const CRYPTO_BAR_CHART_CONFIG: Partial<ChartConfiguration<"bar">> = {
  type: "bar",
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: CHART_COLORS.TEXT_SECONDARY,
        },
        grid: {
          color: CHART_COLORS.GRID_COLOR,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: CHART_COLORS.TEXT_SECONDARY,
          callback: function (value) {
            return `฿${Number(value).toLocaleString("th-TH")}`;
          },
        },
        grid: {
          color: CHART_COLORS.GRID_COLOR,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: CHART_COLORS.BACKGROUND_SECONDARY,
        titleColor: CHART_COLORS.TEXT_PRIMARY,
        bodyColor: CHART_COLORS.TEXT_PRIMARY,
      },
    },
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
  },
};

// Chart.js base configuration for portfolio doughnut charts
export const PORTFOLIO_DOUGHNUT_CHART_CONFIG: Partial<
  ChartConfiguration<"doughnut">
> = {
  type: "doughnut",
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "right",
        labels: {
          color: CHART_COLORS.TEXT_PRIMARY,
        },
      },
      tooltip: {
        backgroundColor: CHART_COLORS.BACKGROUND_SECONDARY,
        titleColor: CHART_COLORS.TEXT_PRIMARY,
        bodyColor: CHART_COLORS.TEXT_PRIMARY,
      },
    },
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
  },
};

// Common Chart.js plugins registration
export const CHART_JS_PLUGINS = [
  "CategoryScale",
  "LinearScale",
  "PointElement",
  "LineElement",
  "BarElement",
  "ArcElement",
  "Title",
  "Tooltip",
  "Legend",
] as const;

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

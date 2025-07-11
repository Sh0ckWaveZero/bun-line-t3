/**
 * Chart utilities - consolidated exports for easy imports
 */

// Export all chart generators
export { ChartGenerator, chartGenerator } from "./chart-generator";
export {
  HistoricalChartGenerator,
  historicalChartGenerator,
} from "./chart-generator-historical";
export {
  SimpleChartGenerator,
  simpleChartGenerator,
} from "./chart-generator-simple";

// Export shared utilities
export { SvgConverter, svgConverter } from "./svg-converter";

// Export types
export type {
  ChartGeneratorConfig,
  CryptoChartData,
  HistoricalDataPoint,
  NormalizedHistoricalDataPoint,
  PortfolioHolding,
  ChartMargins,
  ChartDimensions,
  ChartStyle,
  FontConfig,
  SvgGenerationOptions,
  PngConversionOptions,
  ChartGenerationResult,
  ErrorChartConfig,
} from "./chart-types";

// Export color utilities
export {
  CHART_COLORS,
  MULTI_SERIES_COLORS,
  PORTFOLIO_COLORS,
  COLOR_SCHEMES,
  getColorByTrend,
  getColorByTrendWithAlpha,
  getDarkColorByTrend,
  getMultiSeriesColor,
  getPortfolioColor,
} from "./chart-colors";

// Export configuration utilities
export {
  DEFAULT_CHART_CONFIG,
  LARGE_CHART_CONFIG,
  CHART_MARGINS,
  FONT_CONFIGS,
  CHART_STYLES,
  SVG_GENERATION_OPTIONS,
  CRYPTO_LINE_CHART_CONFIG,
  CRYPTO_BAR_CHART_CONFIG,
  PORTFOLIO_DOUGHNUT_CHART_CONFIG,
  createChartDimensions,
  getChartTitle,
  formatPriceLabel,
  formatPercentageLabel,
  getTimestamp,
} from "./chart-config";

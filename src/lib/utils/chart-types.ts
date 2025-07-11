import { CryptoInfo } from "@/features/crypto/types/crypto.interface";

/**
 * Shared TypeScript interfaces for chart generators
 */

// Base chart configuration
export interface ChartGeneratorConfig {
  width: number;
  height: number;
  backgroundColour: string;
}

// Chart data interfaces
export interface CryptoChartData {
  labels: string[];
  prices: number[];
  crypto: CryptoInfo;
}

export interface HistoricalDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NormalizedHistoricalDataPoint extends HistoricalDataPoint {
  normalizedPrice: number;
}

export interface PortfolioHolding {
  symbol: string;
  value: number;
  color?: string;
}

// Chart style interfaces
export interface ChartMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  margin: ChartMargins;
  chartWidth: number;
  chartHeight: number;
}

// Font configuration
export interface FontConfig {
  family: string;
  size: number;
  weight: string | number;
}

// Chart style configuration
export interface ChartStyle {
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  borderColor: string;
  fonts: {
    title: FontConfig;
    axis: FontConfig;
    label: FontConfig;
    stats: FontConfig;
  };
}

// SVG generation options
export interface SvgGenerationOptions {
  width: number;
  height: number;
  includeTimestamp?: boolean;
  includeDataSource?: boolean;
  dataSourceText?: string;
}

// PNG conversion options
export interface PngConversionOptions {
  quality?: number;
  compressionLevel?: number;
  density?: number;
  progressive?: boolean;
  palette?: boolean;
  resize?: {
    width: number;
    height: number;
    fit?: "contain" | "cover" | "fill" | "inside" | "outside";
  };
  background?: {
    r: number;
    g: number;
    b: number;
    alpha: number;
  };
}

// Chart generation result
export interface ChartGenerationResult {
  data: Buffer;
  format: "png" | "svg";
  dimensions: {
    width: number;
    height: number;
  };
}

// Error chart configuration
export interface ErrorChartConfig {
  title: string;
  message: string;
  subtitle?: string;
  width?: number;
  height?: number;
}

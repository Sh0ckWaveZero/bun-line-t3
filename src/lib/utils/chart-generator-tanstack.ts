import {
  areaY,
  createChartScene,
  defineChart,
  lineY,
  renderChartSvg,
  ruleY,
  text,
} from "@tanstack/charts";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import sharp from "sharp";
import { bitkubHistoryService } from "@/features/crypto/services/bitkub-history.server";
import { CHART_COLORS, getColorByTrend } from "./chart-colors";

const CHART_WIDTH = 1040;
const CHART_HEIGHT = 1040;

interface HistoricalDataPoint {
  time: string;
  close: number;
}

interface IndexedPricePoint extends HistoricalDataPoint {
  index: number;
}

interface NormalizedPricePoint {
  index: number;
  time: string;
  normalizedPrice: number;
}

interface HistoricalSeries {
  symbol: string;
  points: NormalizedPricePoint[];
}

const CHART_THEME = {
  foreground: CHART_COLORS.TEXT_PRIMARY,
  muted: CHART_COLORS.TEXT_SECONDARY,
  grid: "rgba(148, 163, 184, 0.22)",
  background: CHART_COLORS.BACKGROUND_PRIMARY,
  palette: [
    CHART_COLORS.SUCCESS,
    CHART_COLORS.PRIMARY_BLUE,
    CHART_COLORS.PRIMARY_YELLOW,
    CHART_COLORS.ERROR,
    CHART_COLORS.PRIMARY_PURPLE,
  ],
} as const;

const CHART_COLORS_BY_SERIES = [
  CHART_COLORS.SUCCESS,
  CHART_COLORS.PRIMARY_BLUE,
  CHART_COLORS.PRIMARY_YELLOW,
  CHART_COLORS.ERROR,
  CHART_COLORS.PRIMARY_PURPLE,
] as const;

const getCryptoDecimalPlaces = (price: number): number => {
  if (price >= 1000) return 0;
  if (price >= 100) return 1;
  if (price >= 10) return 2;
  if (price >= 1) return 3;
  if (price >= 0.1) return 4;
  if (price >= 0.01) return 5;
  return 6;
};

const formatCryptoPrice = (price: number): string =>
  price.toLocaleString("th-TH", {
    minimumFractionDigits: getCryptoDecimalPlaces(price),
    maximumFractionDigits: getCryptoDecimalPlaces(price),
  });

const formatPercentage = (percentage: number): string =>
  `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;

const formatTime = (value: string): string =>
  new Date(value).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

const renderPng = async (
  definition: Parameters<typeof createChartScene>[0],
  width: number,
  height: number,
  ariaLabel: string,
  ariaDescription?: string,
): Promise<Buffer> => {
  const scene = createChartScene(definition, { width, height });
  const svg = renderChartSvg(scene, {
    ariaLabel,
    ariaDescription,
    idPrefix: "tanstack-chart",
    tabIndex: -1,
  });

  return sharp(Buffer.from(svg))
    .flatten({ background: CHART_COLORS.BACKGROUND_PRIMARY })
    .png()
    .toBuffer();
};

export class TanstackChartGenerator {
  async generateHistoricalChart(
    symbol: string,
    hours = 24,
    title?: string,
    exchange = "bitkub",
  ): Promise<Buffer> {
    let historicalData: HistoricalDataPoint[];
    if (
      exchange.toLowerCase() === "binance" ||
      exchange.toLowerCase() === "bn"
    ) {
      const { binanceHistoryService } =
        await import("@/features/crypto/services/binance-history.server");
      historicalData = await binanceHistoryService.getPopularCryptoHistory(
        symbol,
        hours,
      );
    } else {
      historicalData = await bitkubHistoryService.getPopularCryptoHistory(
        symbol,
        hours,
      );
    }

    if (historicalData.length === 0) {
      return this.generateMessageChart(
        `No historical data available for ${symbol}`,
      );
    }

    const data: IndexedPricePoint[] = historicalData.map((point, index) => ({
      ...point,
      index,
    }));
    const prices = data.map((point) => point.close);
    const minimumPrice = Math.min(...prices);
    const maximumPrice = Math.max(...prices);
    const firstPrice = data[0]?.close ?? 0;
    const lastPrice = data.at(-1)?.close ?? 0;
    const priceChange =
      firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
    const range =
      maximumPrice - minimumPrice || Math.abs(maximumPrice) * 0.01 || 1;
    const padding = range * 0.1;
    const yMin = minimumPrice - padding;
    const yMax = maximumPrice + padding;
    const yRange = yMax - yMin;
    const centerIndex = Math.max(0, (data.length - 1) / 2);
    const currencySymbol =
      exchange.toLowerCase() === "binance" || exchange.toLowerCase() === "bn"
        ? "$"
        : "฿";
    const chartTitle =
      title || `${symbol.toUpperCase()} Historical Price Chart (${hours}h)`;
    const sourceLabel =
      exchange.toLowerCase() === "binance" || exchange.toLowerCase() === "bn"
        ? "Data: Binance API"
        : "Data: Bitkub API";
    const lineColor = getColorByTrend(priceChange);
    const headerY = yMax - yRange * 0.025;
    const subtitleY = yMax - yRange * 0.06;
    const definition = defineChart({
      theme: CHART_THEME,
      margin: { top: 32, right: 60, bottom: 88, left: 110 },
      marks: [
        areaY(data, {
          x: "index",
          y: "close",
          y1: yMin,
          y2: "close",
          fill: lineColor,
          fillOpacity: 0.24,
        }),
        lineY(data, {
          x: "index",
          y: "close",
          stroke: lineColor,
          strokeWidth: 3,
          points: true,
        }),
        text([{ index: centerIndex, y: headerY, label: chartTitle }], {
          x: "index",
          y: "y",
          text: "label",
          fill: CHART_COLORS.TEXT_PRIMARY,
          fontSize: 20,
          fontWeight: 600,
          anchor: "middle",
        }),
        text(
          [
            {
              index: centerIndex,
              y: subtitleY,
              label: `${formatPercentage(priceChange)} (${hours}h) · High: ${currencySymbol}${formatCryptoPrice(maximumPrice)} · Low: ${currencySymbol}${formatCryptoPrice(minimumPrice)} · Current: ${currencySymbol}${formatCryptoPrice(lastPrice)}`,
            },
          ],
          {
            x: "index",
            y: "y",
            text: "label",
            fill: CHART_COLORS.TEXT_SECONDARY,
            fontSize: 12,
            anchor: "middle",
          },
        ),
        text(
          [
            {
              index: 0,
              y: yMin + yRange * 0.005,
              label: sourceLabel,
            },
          ],
          {
            x: "index",
            y: "y",
            text: "label",
            fill: CHART_COLORS.TEXT_TERTIARY,
            fontSize: 11,
            anchor: "start",
          },
        ),
      ],
      scales: {
        x: {
          scale: scaleLinear().domain([0, Math.max(1, data.length - 1)]),
          axis: {
            line: false,
            ticks: {
              count: Math.min(6, data.length),
              line: false,
              format: (index) =>
                formatTime(data[Math.round(index)]?.time ?? ""),
            },
            tickLabels: { fontSize: 12, thin: true },
            label: "Time",
          },
        },
        y: {
          scale: scaleLinear().domain([yMin, yMax]),
          grid: true,
          axis: {
            line: false,
            ticks: {
              count: 5,
              line: false,
              format: (value) => `${currencySymbol}${formatCryptoPrice(value)}`,
            },
            tickLabels: { fontSize: 13 },
            label:
              exchange.toLowerCase() === "binance"
                ? "Price (USD)"
                : "Price (THB)",
          },
        },
      },
      focus: false,
      tooltip: false,
      pointer: false,
      keyboard: false,
    });

    return renderPng(
      definition,
      CHART_WIDTH,
      CHART_HEIGHT,
      chartTitle,
      `${sourceLabel}. ${formatPercentage(priceChange)} over ${hours} hours.`,
    );
  }

  async generateHistoricalComparison(
    symbols: string[],
    hours = 24,
    title?: string,
  ): Promise<Buffer> {
    const results = await Promise.all(
      symbols.map(async (symbol) => ({
        symbol,
        points: await bitkubHistoryService.getPopularCryptoHistory(
          symbol,
          hours,
        ),
      })),
    );
    const series: HistoricalSeries[] = results.flatMap(({ symbol, points }) => {
      const firstPrice = points[0]?.close;
      if (!firstPrice || points.length === 0) return [];
      return [
        {
          symbol,
          points: points.map((point, index) => ({
            index,
            time: point.time,
            normalizedPrice: ((point.close - firstPrice) / firstPrice) * 100,
          })),
        },
      ];
    });

    if (series.length === 0) {
      return this.generateMessageChart(
        "No historical data available for comparison",
      );
    }

    const values = series.flatMap((item) =>
      item.points.map((point) => point.normalizedPrice),
    );
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const range = maximum - minimum || 1;
    const padding = range * 0.1;
    const yMin = Math.min(0, minimum - padding);
    const yMax = Math.max(0, maximum + padding);
    const yRange = yMax - yMin || 1;
    const maxIndex = Math.max(
      1,
      ...series.map((item) => (item.points.at(-1)?.index ?? 0) + 1),
    );
    const chartTitle = title || `Price Comparison (${hours}h) - Normalized %`;
    const headerY = yMax - yRange * 0.035;
    const subtitleY = yMax - yRange * 0.075;
    const legendRows = series.map((item, index) => ({
      index: maxIndex - 0.1,
      y: yMax - yRange * (0.035 + index * 0.035),
      label: item.symbol.toUpperCase(),
      color: CHART_COLORS_BY_SERIES[index % CHART_COLORS_BY_SERIES.length]!,
    }));
    const marks = [
      ...series.map((item, index) =>
        lineY(item.points, {
          x: "index",
          y: "normalizedPrice",
          stroke:
            CHART_COLORS_BY_SERIES[index % CHART_COLORS_BY_SERIES.length]!,
          strokeWidth: 2.5,
          points: true,
        }),
      ),
      ruleY([0], {
        stroke: CHART_COLORS.TEXT_SECONDARY,
        strokeDasharray: "5 5",
        strokeOpacity: 0.7,
      }),
      text([{ index: maxIndex / 2, y: headerY, label: chartTitle }], {
        x: "index",
        y: "y",
        text: "label",
        fill: CHART_COLORS.TEXT_PRIMARY,
        fontSize: 20,
        fontWeight: 600,
        anchor: "middle",
      }),
      text(
        [
          {
            index: maxIndex / 2,
            y: subtitleY,
            label: "Percentage change from first observation",
          },
        ],
        {
          x: "index",
          y: "y",
          text: "label",
          fill: CHART_COLORS.TEXT_SECONDARY,
          fontSize: 12,
          anchor: "middle",
        },
      ),
      text(legendRows, {
        x: "index",
        y: "y",
        text: "label",
        fill: (datum) => datum.color,
        fontSize: 12,
        anchor: "end",
      }),
    ];
    const definition = defineChart({
      theme: CHART_THEME,
      margin: { top: 40, right: 90, bottom: 88, left: 110 },
      marks,
      scales: {
        x: {
          scale: scaleLinear().domain([0, maxIndex]),
          axis: {
            line: false,
            ticks: {
              count: 6,
              line: false,
              format: (index) => {
                const point = series[0]?.points[Math.round(index)];
                return point ? formatTime(point.time) : "";
              },
            },
            tickLabels: { fontSize: 12, thin: true },
            label: `Time (${hours} hours)`,
          },
        },
        y: {
          scale: scaleLinear().domain([yMin, yMax]),
          grid: true,
          axis: {
            line: false,
            ticks: {
              count: 5,
              line: false,
              format: (value) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`,
            },
            tickLabels: { fontSize: 12 },
            label: "Price Change (%)",
          },
        },
      },
      focus: false,
      tooltip: false,
      pointer: false,
      keyboard: false,
    });

    return renderPng(
      definition,
      CHART_WIDTH,
      CHART_HEIGHT,
      chartTitle,
      `Normalized price change over ${hours} hours for ${series.map((item) => item.symbol).join(", ")}.`,
    );
  }

  private async generateMessageChart(message: string): Promise<Buffer> {
    const definition = defineChart({
      theme: CHART_THEME,
      margin: 32,
      marks: [
        text([{ x: 0.5, y: 0.5, label: message }], {
          x: "x",
          y: "y",
          text: "label",
          fill: CHART_COLORS.TEXT_SECONDARY,
          fontSize: 16,
          anchor: "middle",
        }),
      ],
      scales: {
        x: { scale: scaleLinear().domain([0, 1]), axis: false, grid: false },
        y: { scale: scaleLinear().domain([0, 1]), axis: false, grid: false },
      },
      focus: false,
      tooltip: false,
      pointer: false,
      keyboard: false,
    });

    return renderPng(
      definition,
      CHART_WIDTH,
      CHART_HEIGHT,
      "Chart unavailable",
      message,
    );
  }
}

export const tanstackChartGenerator = new TanstackChartGenerator();

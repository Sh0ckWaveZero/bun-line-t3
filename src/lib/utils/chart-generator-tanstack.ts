import {
  createChartScene,
  defineChart,
  lineY,
  link,
  rect,
  renderChartSvg,
  ruleY,
  text,
} from "@tanstack/charts";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import sharp from "sharp";
import {
  CHART_PERIODS,
  type ChartPeriod,
} from "@/features/crypto/constants/chart-periods";
import { bitkubHistoryService } from "@/features/crypto/services/bitkub-history.server";
import { CHART_COLORS } from "./chart-colors";

const CHART_WIDTH = 1200;
const CHART_HEIGHT = 675;
const CHART_FONT_FAMILY = '"Noto Sans Thai", "Noto Sans", sans-serif';

interface HistoricalDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndexedPricePoint extends HistoricalDataPoint {
  index: number;
  bodyLeft: number;
  bodyRight: number;
  bodyHigh: number;
  bodyLow: number;
  volumeBase: number;
  volumeTop: number;
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
  grid: "rgba(148, 163, 184, 0.3)",
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

const formatTime = (value: string, period: ChartPeriod): string => {
  const dateOptions: Intl.DateTimeFormatOptions =
    period === "24h"
      ? {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        }
      : { day: "2-digit", month: "short" };

  return new Date(value).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    ...dateOptions,
  });
};

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

  const svgWithFont = svg.replace(
    '<svg class="ts-chart"',
    `<svg class="ts-chart" font-family='${CHART_FONT_FAMILY}'`,
  );

  return sharp(Buffer.from(svgWithFont))
    .flatten({ background: CHART_COLORS.BACKGROUND_PRIMARY })
    .png()
    .toBuffer();
};

export class TanstackChartGenerator {
  async generateHistoricalChart(
    symbol: string,
    period: ChartPeriod = "24h",
    title?: string,
    exchange = "bitkub",
    providedData?: HistoricalDataPoint[],
  ): Promise<Buffer> {
    const periodConfig = CHART_PERIODS[period];
    let historicalData = providedData;
    if (!historicalData) {
      if (
        exchange.toLowerCase() === "binance" ||
        exchange.toLowerCase() === "bn"
      ) {
        const { binanceHistoryService } =
          await import("@/features/crypto/services/binance-history.server");
        historicalData = await binanceHistoryService.getPopularCryptoHistory(
          symbol,
          periodConfig.hours,
          periodConfig.binanceInterval,
        );
      } else {
        historicalData = await bitkubHistoryService.getPopularCryptoHistory(
          symbol,
          periodConfig.hours,
          periodConfig.bitkubResolution,
        );
      }
    }

    if (historicalData.length === 0) {
      return this.generateMessageChart(
        `No historical data available for ${symbol}`,
      );
    }

    const minimumPrice = Math.min(...historicalData.map((point) => point.low));
    const maximumPrice = Math.max(...historicalData.map((point) => point.high));
    const firstCandle = historicalData[0]!;
    const latestCandle = historicalData.at(-1)!;
    const firstPrice = firstCandle.open;
    const lastPrice = latestCandle.close;
    const priceChange =
      firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
    const range =
      maximumPrice - minimumPrice || Math.abs(maximumPrice) * 0.01 || 1;
    const padding = range * 0.08;
    const volumeBandHeight = range * 0.22;
    const yMin = minimumPrice - padding - volumeBandHeight;
    // Reserve space above the candles for the selected period and its summary.
    const yMax = maximumPrice + padding + range * 0.72;
    const yRange = yMax - yMin;
    const maximumVolume = Math.max(
      ...historicalData.map((point) => point.volume),
    );
    const minimumBodyHeight = range * 0.004;
    const data: IndexedPricePoint[] = historicalData.map((point, index) => {
      const bodyCenter = (point.open + point.close) / 2;
      const bodyHeight = Math.abs(point.close - point.open);
      const adjustedBodyHeight = Math.max(bodyHeight, minimumBodyHeight);

      return {
        ...point,
        index,
        bodyLeft: index - 0.32,
        bodyRight: index + 0.32,
        bodyLow: bodyCenter - adjustedBodyHeight / 2,
        bodyHigh: bodyCenter + adjustedBodyHeight / 2,
        volumeBase: yMin,
        volumeTop:
          yMin +
          (maximumVolume > 0 ? point.volume / maximumVolume : 0) *
            volumeBandHeight,
      };
    });
    const bullishCandles = data.filter((point) => point.close >= point.open);
    const bearishCandles = data.filter((point) => point.close < point.open);
    const centerIndex = Math.max(0, (data.length - 1) / 2);
    const currencySymbol =
      exchange.toLowerCase() === "binance" || exchange.toLowerCase() === "bn"
        ? "$"
        : "฿";
    const sourceName =
      exchange.toLowerCase() === "binance" || exchange.toLowerCase() === "bn"
        ? "Binance"
        : "Bitkub";
    const sourceLabel = `ข้อมูล: ${sourceName} API`;
    const headerY = yMax - yRange * 0.1;
    const subtitleY = yMax - yRange * 0.19;
    const summaryY = yMax - yRange * 0.28;
    const chartTitle =
      title || `${symbol.toUpperCase()} · ${periodConfig.shortLabel}`;
    const subtitle = `${sourceName} · ${periodConfig.label} · ${formatPercentage(priceChange)} · แท่ง ${periodConfig.candleLabel} · วอลุ่ม ${symbol.toUpperCase()}`;
    const summary = `สูงสุด ${currencySymbol}${formatCryptoPrice(maximumPrice)} · ต่ำสุด ${currencySymbol}${formatCryptoPrice(minimumPrice)} · ล่าสุด ${currencySymbol}${formatCryptoPrice(lastPrice)}`;
    const priceTicks = Array.from(
      { length: 5 },
      (_, index) => minimumPrice + ((maximumPrice - minimumPrice) * index) / 4,
    );
    const timeTickCount = Math.min(5, data.length);
    const timeTicks = Array.from({ length: timeTickCount }, (_, index) =>
      Math.round((index / Math.max(1, timeTickCount - 1)) * (data.length - 1)),
    );
    const definition = defineChart({
      theme: CHART_THEME,
      margin: { top: 76, right: 48, bottom: 96, left: 208 },
      marks: [
        rect(bullishCandles, {
          x1: "bodyLeft",
          x2: "bodyRight",
          y1: "volumeBase",
          y2: "volumeTop",
          fill: CHART_COLORS.SUCCESS,
          fillOpacity: 0.38,
        }),
        rect(bearishCandles, {
          x1: "bodyLeft",
          x2: "bodyRight",
          y1: "volumeBase",
          y2: "volumeTop",
          fill: CHART_COLORS.ERROR,
          fillOpacity: 0.38,
        }),
        link(bullishCandles, {
          x1: "index",
          y1: "low",
          x2: "index",
          y2: "high",
          stroke: CHART_COLORS.SUCCESS,
          strokeWidth: 2,
        }),
        link(bearishCandles, {
          x1: "index",
          y1: "low",
          x2: "index",
          y2: "high",
          stroke: CHART_COLORS.ERROR,
          strokeWidth: 2,
        }),
        rect(bullishCandles, {
          x1: "bodyLeft",
          x2: "bodyRight",
          y1: "bodyLow",
          y2: "bodyHigh",
          fill: CHART_COLORS.SUCCESS,
        }),
        rect(bearishCandles, {
          x1: "bodyLeft",
          x2: "bodyRight",
          y1: "bodyLow",
          y2: "bodyHigh",
          fill: CHART_COLORS.ERROR,
        }),
        ruleY([lastPrice], {
          stroke: CHART_COLORS.TEXT_SECONDARY,
          strokeDasharray: "4 5",
          strokeOpacity: 0.5,
        }),
        text([{ index: centerIndex, y: headerY, label: chartTitle }], {
          x: "index",
          y: "y",
          text: "label",
          fill: CHART_COLORS.TEXT_PRIMARY,
          fontSize: 40,
          fontWeight: 700,
          anchor: "middle",
        }),
        text(
          [
            {
              index: centerIndex,
              y: subtitleY,
              label: subtitle,
            },
          ],
          {
            x: "index",
            y: "y",
            text: "label",
            fill: CHART_COLORS.TEXT_SECONDARY,
            fontSize: 22,
            fontWeight: 500,
            anchor: "middle",
          },
        ),
        text([{ index: centerIndex, y: summaryY, label: summary }], {
          x: "index",
          y: "y",
          text: "label",
          fill: CHART_COLORS.TEXT_SECONDARY,
          fontSize: 18,
          fontWeight: 500,
          anchor: "middle",
        }),
      ],
      scales: {
        x: {
          scale: scaleLinear().domain([-0.5, Math.max(0.5, data.length - 0.5)]),
          axis: {
            line: false,
            ticks: {
              values: timeTicks,
              line: false,
              format: (index) =>
                formatTime(data[Math.round(index)]?.time ?? "", period),
            },
            tickLabels: { fontSize: 22, fontWeight: 500, thin: true },
            label: { text: "เวลาไทย", fontSize: 20, fontWeight: 600 },
          },
        },
        y: {
          scale: scaleLinear().domain([yMin, yMax]),
          grid: true,
          axis: {
            line: false,
            ticks: {
              values: priceTicks,
              line: false,
              format: (value) => `${currencySymbol}${formatCryptoPrice(value)}`,
            },
            tickLabels: { fontSize: 22, fontWeight: 500 },
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
      `${sourceLabel}. ${periodConfig.label}. ${formatPercentage(priceChange)}. High ${formatCryptoPrice(maximumPrice)}. Low ${formatCryptoPrice(minimumPrice)}. Latest volume ${latestCandle.volume} ${symbol.toUpperCase()}.`,
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
    const yMax = Math.max(0, maximum + padding) + range * 0.42;
    const yRange = yMax - yMin || 1;
    const maxIndex = Math.max(
      1,
      ...series.map((item) => (item.points.at(-1)?.index ?? 0) + 1),
    );
    const chartTitle = title || `Price Comparison (${hours}h) - Normalized %`;
    const headerY = yMax - yRange * 0.06;
    const subtitleY = yMax - yRange * 0.14;
    const legendRows = series.map((item, index) => ({
      index: maxIndex - 0.1,
      y: yMax - yRange * (0.22 + index * 0.05),
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
          strokeWidth: 4,
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
        fontSize: 40,
        fontWeight: 700,
        anchor: "middle",
      }),
      text(
        [
          {
            index: maxIndex / 2,
            y: subtitleY,
            label: `การเปลี่ยนแปลงจากจุดเริ่มต้น · ${hours} ชม.`,
          },
        ],
        {
          x: "index",
          y: "y",
          text: "label",
          fill: CHART_COLORS.TEXT_SECONDARY,
          fontSize: 24,
          fontWeight: 500,
          anchor: "middle",
        },
      ),
      text(legendRows, {
        x: "index",
        y: "y",
        text: "label",
        fill: (datum) => datum.color,
        fontSize: 22,
        fontWeight: 600,
        anchor: "end",
      }),
    ];
    const definition = defineChart({
      theme: CHART_THEME,
      margin: { top: 76, right: 104, bottom: 96, left: 148 },
      marks,
      scales: {
        x: {
          scale: scaleLinear().domain([0, maxIndex]),
          axis: {
            line: false,
            ticks: {
              count: 5,
              line: false,
              format: (index) => {
                const point = series[0]?.points[Math.round(index)];
                return point ? formatTime(point.time, "24h") : "";
              },
            },
            tickLabels: { fontSize: 22, fontWeight: 500, thin: true },
            label: {
              text: `เวลาไทย (${hours} ชม.)`,
              fontSize: 20,
              fontWeight: 600,
            },
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
            tickLabels: { fontSize: 22, fontWeight: 500 },
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
          fontSize: 28,
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

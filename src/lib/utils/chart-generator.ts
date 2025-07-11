import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { Chart, ChartConfiguration } from "chart.js";
import { CryptoInfo } from "@/features/crypto/types/crypto.interface";

// Register Chart.js components
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Import shared utilities
import {
  ChartGeneratorConfig,
  CryptoChartData,
  PortfolioHolding,
} from "./chart-types";
import {
  CHART_COLORS,
  getColorByTrend,
  getDarkColorByTrend,
  getPortfolioColor,
} from "./chart-colors";
import {
  DEFAULT_CHART_CONFIG,
  CRYPTO_LINE_CHART_CONFIG,
  CRYPTO_BAR_CHART_CONFIG,
  PORTFOLIO_DOUGHNUT_CHART_CONFIG,
  getChartTitle,
  formatPriceLabel,
} from "./chart-config";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export class ChartGenerator {
  private chartJSNodeCanvas: ChartJSNodeCanvas;

  constructor(config: ChartGeneratorConfig = DEFAULT_CHART_CONFIG) {
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: config.width,
      height: config.height,
      backgroundColour: config.backgroundColour,
      plugins: {
        modern: ["chartjs-plugin-datalabels"],
      },
    });
  }

  /**
   * Generate a crypto price chart image
   */
  async generateCryptoChart(data: CryptoChartData): Promise<Buffer> {
    const { labels, prices, crypto } = data;

    // Determine trend color using shared utility
    const priceChange = crypto.changePriceOriginal || 0;
    const trendColor = getColorByTrend(priceChange);

    const chartConfig: ChartConfiguration<"line"> = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${crypto.currencyName || "Crypto"}/THB`,
            data: prices,
            borderColor: trendColor,
            backgroundColor: `${trendColor}20`,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        ...CRYPTO_LINE_CHART_CONFIG.options,
        plugins: {
          ...CRYPTO_LINE_CHART_CONFIG.options?.plugins,
          title: {
            display: true,
            text: getChartTitle(
              crypto.currencyName || "Crypto",
              crypto.exchange || "Unknown",
            ),
            color: CHART_COLORS.TEXT_PRIMARY,
            font: {
              family: "Arial, sans-serif",
              size: 18,
              weight: "bold",
            },
            padding: {
              top: 10,
              bottom: 30,
            },
          },
          tooltip: {
            backgroundColor: CHART_COLORS.BACKGROUND_SECONDARY,
            titleColor: CHART_COLORS.TEXT_PRIMARY,
            bodyColor: CHART_COLORS.TEXT_PRIMARY,
            borderColor: trendColor,
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                return `Price: ${formatPriceLabel(context.parsed.y)}`;
              },
            },
          },
        },
      },
    };

    return await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
  }

  /**
   * Generate a simple price comparison chart
   */
  async generatePriceComparisonChart(
    cryptos: CryptoInfo[],
    title: string = "Crypto Price Comparison",
  ): Promise<Buffer> {
    const chartConfig: ChartConfiguration<"bar"> = {
      type: "bar",
      data: {
        labels: cryptos.map((c) => c.currencyName || "Unknown"),
        datasets: [
          {
            label: "Price (THB)",
            data: cryptos.map((c) => parseFloat(c.lastPrice || "0") || 0),
            backgroundColor: cryptos.map((c) => {
              const change = c.changePriceOriginal || 0;
              return getColorByTrend(change);
            }),
            borderColor: cryptos.map((c) => {
              const change = c.changePriceOriginal || 0;
              return getDarkColorByTrend(change);
            }),
            borderWidth: 2,
          },
        ],
      },
      options: {
        ...CRYPTO_BAR_CHART_CONFIG.options,
        plugins: {
          ...CRYPTO_BAR_CHART_CONFIG.options?.plugins,
          title: {
            display: true,
            text: title,
            color: CHART_COLORS.TEXT_PRIMARY,
            font: {
              family: "Arial, sans-serif",
              size: 18,
              weight: "bold",
            },
            padding: {
              top: 10,
              bottom: 30,
            },
          },
          tooltip: {
            backgroundColor: CHART_COLORS.BACKGROUND_SECONDARY,
            titleColor: CHART_COLORS.TEXT_PRIMARY,
            bodyColor: CHART_COLORS.TEXT_PRIMARY,
            callbacks: {
              label: function (context) {
                const crypto = cryptos[context.dataIndex];
                if (!crypto) return "Unknown";
                const change = crypto.changePriceOriginal || 0;
                const changeText =
                  change >= 0
                    ? `+${change.toFixed(2)}%`
                    : `${change.toFixed(2)}%`;
                return [
                  `Price: ${formatPriceLabel(context.parsed.y)}`,
                  `24h Change: ${changeText}`,
                  `Exchange: ${crypto.exchange}`,
                ];
              },
            },
          },
        },
      },
    };

    return await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
  }

  /**
   * Generate a portfolio pie chart
   */
  async generatePortfolioChart(
    holdings: PortfolioHolding[],
    title: string = "Portfolio Distribution",
  ): Promise<Buffer> {
    const chartConfig: ChartConfiguration<"doughnut"> = {
      type: "doughnut",
      data: {
        labels: holdings.map((h) => h.symbol),
        datasets: [
          {
            data: holdings.map((h) => h.value),
            backgroundColor: holdings.map(
              (h, i) => h.color || getPortfolioColor(i),
            ),
            borderColor: CHART_COLORS.BACKGROUND_PRIMARY,
            borderWidth: 2,
          },
        ],
      },
      options: {
        ...PORTFOLIO_DOUGHNUT_CHART_CONFIG.options,
        plugins: {
          ...PORTFOLIO_DOUGHNUT_CHART_CONFIG.options?.plugins,
          title: {
            display: true,
            text: title,
            color: CHART_COLORS.TEXT_PRIMARY,
            font: {
              family: "Arial, sans-serif",
              size: 18,
              weight: "bold",
            },
            padding: {
              top: 10,
              bottom: 30,
            },
          },
          tooltip: {
            backgroundColor: CHART_COLORS.BACKGROUND_SECONDARY,
            titleColor: CHART_COLORS.TEXT_PRIMARY,
            bodyColor: CHART_COLORS.TEXT_PRIMARY,
            callbacks: {
              label: function (context) {
                const total = holdings.reduce((sum, h) => sum + h.value, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${formatPriceLabel(context.parsed)} (${percentage}%)`;
              },
            },
          },
        },
      },
    };

    return await this.chartJSNodeCanvas.renderToBuffer(chartConfig);
  }
}

// Create a singleton instance
export const chartGenerator = new ChartGenerator(DEFAULT_CHART_CONFIG);

export default chartGenerator;

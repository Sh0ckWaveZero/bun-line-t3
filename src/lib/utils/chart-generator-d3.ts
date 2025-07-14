import * as d3 from "d3";
import { createCanvas, registerFont } from "canvas";
import path from "path";
import fs from "fs";
import { bitkubHistoryService } from "@/features/crypto/services/bitkub-history";
import { CHART_COLORS, getColorByTrend } from "./chart-colors";
import {
  LARGE_CHART_CONFIG,
  createChartDimensions,
  formatPercentageLabel,
  getTimestamp,
} from "./chart-config";

// Font registration for Canvas
let fontsRegistered = false;

async function registerPromptFonts() {
  if (fontsRegistered) return;

  try {
    const fontPath = path.join(process.cwd(), "public", "fonts");

    // Register Prompt fonts for Canvas
    const promptRegular = path.join(fontPath, "Prompt-Regular.ttf");
    const promptMedium = path.join(fontPath, "Prompt-Medium.ttf");
    const promptSemiBold = path.join(fontPath, "Prompt-SemiBold.ttf");

    if (fs.existsSync(promptRegular)) {
      registerFont(promptRegular, { family: "Prompt", weight: "normal" });
    }
    if (fs.existsSync(promptMedium)) {
      registerFont(promptMedium, { family: "Prompt", weight: "500" });
    }
    if (fs.existsSync(promptSemiBold)) {
      registerFont(promptSemiBold, { family: "Prompt", weight: "600" });
    }

    fontsRegistered = true;
    console.log("✅ Prompt fonts registered for D3/Canvas charts");
  } catch (error) {
    console.warn("⚠️ Failed to register Prompt fonts:", error);
    // Continue without custom fonts - Canvas will use system defaults
  }
}

/**
 * Determine appropriate decimal places for crypto prices
 */
function getCryptoDecimalPlaces(price: number): number {
  if (price >= 1000) return 0; // ฿1,000+ -> no decimals
  if (price >= 100) return 1; // ฿100-999 -> 1 decimal
  if (price >= 10) return 2; // ฿10-99 -> 2 decimals
  if (price >= 1) return 3; // ฿1-9 -> 3 decimals
  if (price >= 0.1) return 4; // ฿0.1-0.9 -> 4 decimals
  if (price >= 0.01) return 5; // ฿0.01-0.09 -> 5 decimals
  return 6; // < ฿0.01 -> 6 decimals
}

/**
 * Format crypto price with appropriate decimal places
 */
function formatCryptoPrice(price: number): string {
  const decimals = getCryptoDecimalPlaces(price);
  return price.toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * D3.js-based chart generator that outputs PNG directly using Canvas
 */
export class D3ChartGenerator {
  /**
   * Generate historical price chart with D3.js and Canvas
   */
  async generateHistoricalChart(
    symbol: string,
    hours: number = 24,
    title?: string,
    exchange: string = "bitkub",
  ): Promise<Buffer> {
    await registerPromptFonts();

    // Get historical data based on exchange
    let historicalData;
    if (exchange.toLowerCase() === "binance" || exchange.toLowerCase() === "bn") {
      const { binanceHistoryService } = await import("@/features/crypto/services/binance-history");
      historicalData = await binanceHistoryService.getPopularCryptoHistory(symbol, hours);
    } else {
      historicalData = await bitkubHistoryService.getPopularCryptoHistory(symbol, hours);
    }

    if (historicalData.length === 0) {
      return this.generateErrorChart(
        `No historical data available for ${symbol}`,
      );
    }

    const dimensions = createChartDimensions(
      LARGE_CHART_CONFIG.width,
      LARGE_CHART_CONFIG.height,
      "DEFAULT",
    );
    const { width, height, margin, chartWidth, chartHeight } = dimensions;

    // Create canvas
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    // Set background
    context.fillStyle = CHART_COLORS.BACKGROUND_PRIMARY;
    context.fillRect(0, 0, width, height);

    // Calculate price range
    const prices = historicalData.map((d) => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;
    const adjustedMin = minPrice - padding;
    const adjustedMax = maxPrice + padding;

    // Create D3 scales
    const xScale = d3
      .scaleLinear()
      .domain([0, historicalData.length - 1])
      .range([margin.left, margin.left + chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([adjustedMin, adjustedMax])
      .range([margin.top + chartHeight, margin.top]);

    // Calculate color based on price change
    const firstPrice = historicalData[0]?.close || 0;
    const lastPrice = historicalData[historicalData.length - 1]?.close || 0;
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    const lineColor = getColorByTrend(priceChange);

    // Draw grid lines and Y-axis labels
    context.strokeStyle = CHART_COLORS.BORDER_PRIMARY;
    context.lineWidth = 1;
    context.globalAlpha = 0.3;

    for (let i = 0; i <= 5; i++) {
      const value = adjustedMin + ((adjustedMax - adjustedMin) / 5) * i;
      const y = yScale(value);

      // Draw grid line
      context.beginPath();
      context.moveTo(margin.left, y);
      context.lineTo(margin.left + chartWidth, y);
      context.stroke();
    }

    // Draw X-axis grid lines
    const labelCount = Math.min(6, historicalData.length);
    for (let i = 0; i < labelCount; i++) {
      const index = Math.floor(
        (i / (labelCount - 1)) * (historicalData.length - 1),
      );
      const x = xScale(index);

      context.beginPath();
      context.moveTo(x, margin.top);
      context.lineTo(x, margin.top + chartHeight);
      context.stroke();
    }

    context.globalAlpha = 1;

    // Draw area fill manually
    const gradient = context.createLinearGradient(
      0,
      margin.top,
      0,
      margin.top + chartHeight,
    );
    gradient.addColorStop(0, lineColor + "4D"); // 30% opacity
    gradient.addColorStop(1, lineColor + "0D"); // 5% opacity

    context.fillStyle = gradient;
    context.beginPath();
    historicalData.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point.close);
      if (index === 0) {
        context.moveTo(x, margin.top + chartHeight);
        context.lineTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.lineTo(xScale(historicalData.length - 1), margin.top + chartHeight);
    context.lineTo(xScale(0), margin.top + chartHeight);
    context.closePath();
    context.fill();

    // Draw price line manually
    context.strokeStyle = lineColor;
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    historicalData.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point.close);
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.stroke();

    // Draw data points
    context.fillStyle = lineColor;
    historicalData.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point.close);

      context.beginPath();
      context.arc(x, y, 3, 0, 2 * Math.PI);
      context.fill();

      // Add stroke
      context.strokeStyle = "#1a1a1a";
      context.lineWidth = 2;
      context.stroke();
    });

    // Draw chart border
    context.strokeStyle = CHART_COLORS.BORDER_PRIMARY;
    context.lineWidth = 1;
    context.strokeRect(margin.left, margin.top, chartWidth, chartHeight);

    // Draw text elements
    context.fillStyle = CHART_COLORS.TEXT_PRIMARY;
    context.font = "600 20px Prompt, Arial, sans-serif";
    context.textAlign = "center";

    // Title
    const chartTitle =
      title || `${symbol.toUpperCase()} Historical Price Chart (${hours}h)`;
    context.fillText(chartTitle, width / 2, 30);

    // Price change indicator
    context.fillStyle = lineColor;
    context.font = "500 16px Prompt, Arial, sans-serif";
    context.fillText(
      `${formatPercentageLabel(priceChange)} (${hours}h)`,
      width / 2,
      55,
    );

    // Y-axis labels
    context.fillStyle = CHART_COLORS.TEXT_PRIMARY;
    context.font = "500 14px Prompt, Arial, sans-serif";
    context.textAlign = "right";

    // Determine currency symbol based on exchange
    const currencySymbol = exchange.toLowerCase() === "binance" || exchange.toLowerCase() === "bn" ? "$" : "฿";
    
    for (let i = 0; i <= 5; i++) {
      const value = adjustedMin + ((adjustedMax - adjustedMin) / 5) * i;
      const y = yScale(value);
      context.fillText(`${currencySymbol}${formatCryptoPrice(value)}`, margin.left - 10, y + 5);
    }

    // X-axis labels (time)
    context.textAlign = "center";
    context.font = "400 12px Prompt, Arial, sans-serif";

    for (let i = 0; i < labelCount; i++) {
      const index = Math.floor(
        (i / (labelCount - 1)) * (historicalData.length - 1),
      );
      const point = historicalData[index];
      if (!point) continue;

      const x = xScale(index);
      const time = new Date(point.time);
      const timeLabel = time.toLocaleString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });

      context.fillText(timeLabel, x, margin.top + chartHeight + 25);
    }

    // Stats (High, Low, Current)
    context.textAlign = "right";
    context.font = "600 16px Prompt, Arial, sans-serif";

    context.fillStyle = CHART_COLORS.SUCCESS;
    context.fillText(`High: ${currencySymbol}${formatCryptoPrice(maxPrice)}`, width - 20, 35);

    context.fillStyle = CHART_COLORS.ERROR;
    context.fillText(`Low: ${currencySymbol}${formatCryptoPrice(minPrice)}`, width - 20, 55);

    context.fillStyle = CHART_COLORS.TEXT_PRIMARY;
    context.fillText(
      `Current: ${currencySymbol}${formatCryptoPrice(lastPrice)}`,
      width - 20,
      75,
    );

    // Axis labels
    context.fillStyle = CHART_COLORS.TEXT_PRIMARY;
    context.font = "400 14px Prompt, Arial, sans-serif";
    context.textAlign = "center";

    // Y-axis label (rotated)
    context.save();
    context.translate(30, margin.top + chartHeight / 2);
    context.rotate(-Math.PI / 2);
    const priceLabel = exchange.toLowerCase() === "binance" || exchange.toLowerCase() === "bn" ? "Price (USD)" : "Price (THB)";
    context.fillText(priceLabel, 0, 0);
    context.restore();

    // X-axis label
    context.fillText("Time", margin.left + chartWidth / 2, height - 20);

    // Timestamp and data source
    context.font = "400 10px Prompt, Arial, sans-serif";
    context.fillStyle = CHART_COLORS.TEXT_TERTIARY;

    context.textAlign = "right";
    context.fillText(`Generated: ${getTimestamp()}`, width - 10, height - 10);

    context.textAlign = "left";
    const dataSource = exchange.toLowerCase() === "binance" || exchange.toLowerCase() === "bn" ? "Data: Binance API" : "Data: Bitkub API";
    context.fillText(dataSource, 10, height - 10);

    return canvas.toBuffer("image/png");
  }

  /**
   * Generate comparison chart with D3.js and Canvas
   */
  async generateHistoricalComparison(
    symbols: string[],
    hours: number = 24,
    title?: string,
  ): Promise<Buffer> {
    await registerPromptFonts();

    const dataPromises = symbols.map((symbol) =>
      bitkubHistoryService.getPopularCryptoHistory(symbol, hours),
    );

    const allData = await Promise.all(dataPromises);
    const validData = allData.filter((data) => data.length > 0);

    if (validData.length === 0) {
      return this.generateErrorChart(
        "No historical data available for comparison",
      );
    }

    const dimensions = createChartDimensions(
      LARGE_CHART_CONFIG.width,
      LARGE_CHART_CONFIG.height,
      "DEFAULT",
    );
    const { width, height, margin, chartWidth, chartHeight } = dimensions;

    // Create canvas
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    // Set background
    context.fillStyle = CHART_COLORS.BACKGROUND_PRIMARY;
    context.fillRect(0, 0, width, height);

    // Calculate normalized price ranges (percentage change from first point)
    const normalizedData = validData.map((data) => {
      if (data.length === 0 || !data[0]) return [];
      const firstPrice = data[0].close;
      return data.map((point) => ({
        ...point,
        normalizedPrice: ((point.close - firstPrice) / firstPrice) * 100,
      }));
    });

    const allNormalizedPrices = normalizedData
      .flat()
      .map((d) => d.normalizedPrice);
    const minNormalized = Math.min(...allNormalizedPrices);
    const maxNormalized = Math.max(...allNormalizedPrices);
    const normalizedRange = maxNormalized - minNormalized;
    const padding = normalizedRange * 0.1;
    const adjustedMin = minNormalized - padding;
    const adjustedMax = maxNormalized + padding;

    // Create D3 scales
    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(...normalizedData.map((d) => d.length)) - 1])
      .range([margin.left, margin.left + chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([adjustedMin, adjustedMax])
      .range([margin.top + chartHeight, margin.top]);

    // Colors for different symbols
    const colors = [
      CHART_COLORS.SUCCESS,
      CHART_COLORS.PRIMARY_BLUE,
      CHART_COLORS.PRIMARY_YELLOW,
      CHART_COLORS.ERROR,
      CHART_COLORS.PRIMARY_PURPLE,
    ];

    // Draw grid lines
    context.strokeStyle = CHART_COLORS.BORDER_PRIMARY;
    context.lineWidth = 1;
    context.globalAlpha = 0.3;

    for (let i = 0; i <= 5; i++) {
      const value = adjustedMin + ((adjustedMax - adjustedMin) / 5) * i;
      const y = yScale(value);

      context.beginPath();
      context.moveTo(margin.left, y);
      context.lineTo(margin.left + chartWidth, y);
      context.stroke();
    }

    // Draw zero line
    if (adjustedMin <= 0 && adjustedMax >= 0) {
      const zeroY = yScale(0);
      context.strokeStyle = "#666";
      context.lineWidth = 1;
      context.setLineDash([5, 5]);
      context.beginPath();
      context.moveTo(margin.left, zeroY);
      context.lineTo(margin.left + chartWidth, zeroY);
      context.stroke();
      context.setLineDash([]);
    }

    context.globalAlpha = 1;

    // Draw lines for each symbol manually
    normalizedData.forEach((data, symbolIndex) => {
      if (data.length === 0) return;

      const color =
        colors[symbolIndex % colors.length] || CHART_COLORS.PRIMARY_BLUE;

      context.strokeStyle = color;
      context.lineWidth = 2;
      context.beginPath();
      data.forEach((point, index) => {
        const x = xScale(index);
        const y = yScale(point.normalizedPrice);
        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      context.stroke();
    });

    // Draw chart border
    context.strokeStyle = CHART_COLORS.BORDER_PRIMARY;
    context.lineWidth = 1;
    context.strokeRect(margin.left, margin.top, chartWidth, chartHeight);

    // Draw text elements
    context.fillStyle = CHART_COLORS.TEXT_PRIMARY;
    context.font = "600 20px Prompt, Arial, sans-serif";
    context.textAlign = "center";

    // Title
    const chartTitle = title || `Price Comparison (${hours}h) - Normalized %`;
    context.fillText(chartTitle, width / 2, 30);

    // Y-axis labels (percentage)
    context.fillStyle = CHART_COLORS.TEXT_PRIMARY;
    context.font = "400 10px Prompt, Arial, sans-serif";
    context.textAlign = "right";

    for (let i = 0; i <= 5; i++) {
      const value = adjustedMin + ((adjustedMax - adjustedMin) / 5) * i;
      const y = yScale(value);
      const label = `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
      context.fillText(label, margin.left - 10, y + 5);
    }

    // Legend
    normalizedData.forEach((data, symbolIndex) => {
      if (data.length === 0) return;

      const color =
        colors[symbolIndex % colors.length] || CHART_COLORS.PRIMARY_BLUE;
      const legendY = margin.top + 20 + symbolIndex * 20;

      context.fillStyle = color;
      context.font = "400 12px Prompt, Arial, sans-serif";
      context.textAlign = "left";
      context.fillText(
        symbols[symbolIndex]?.toUpperCase() || "Unknown",
        margin.left + chartWidth + 10,
        legendY,
      );
    });

    // Axis labels
    context.fillStyle = CHART_COLORS.TEXT_PRIMARY;
    context.font = "400 14px Prompt, Arial, sans-serif";
    context.textAlign = "center";

    // Y-axis label
    context.save();
    context.translate(30, margin.top + chartHeight / 2);
    context.rotate(-Math.PI / 2);
    context.fillText("Price Change (%)", 0, 0);
    context.restore();

    // X-axis label
    context.fillText(
      `Time (${hours} hours)`,
      margin.left + chartWidth / 2,
      height - 20,
    );

    // Timestamp
    context.font = "400 10px Prompt, Arial, sans-serif";
    context.fillStyle = CHART_COLORS.TEXT_TERTIARY;
    context.textAlign = "right";
    context.fillText(`Generated: ${getTimestamp()}`, width - 10, height - 10);

    return canvas.toBuffer("image/png");
  }

  /**
   * Generate error chart when data is not available
   */
  private async generateErrorChart(message: string): Promise<Buffer> {
    await registerPromptFonts();

    const { width, height } = LARGE_CHART_CONFIG;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    // Background
    context.fillStyle = CHART_COLORS.BACKGROUND_PRIMARY;
    context.fillRect(0, 0, width, height);

    // Error message
    context.fillStyle = CHART_COLORS.ERROR;
    context.font = "bold 18px Prompt, Arial, sans-serif";
    context.textAlign = "center";
    context.fillText("⚠️ Chart Error", width / 2, height / 2 - 40);

    context.fillStyle = CHART_COLORS.TEXT_SECONDARY;
    context.font = "400 14px Prompt, Arial, sans-serif";
    context.fillText(message, width / 2, height / 2);

    context.fillStyle = CHART_COLORS.TEXT_TERTIARY;
    context.font = "400 12px Prompt, Arial, sans-serif";
    context.fillText(
      "Please try again later or check symbol availability",
      width / 2,
      height / 2 + 30,
    );

    return canvas.toBuffer("image/png");
  }
}

export const d3ChartGenerator = new D3ChartGenerator();

import { bitkubHistoryService } from "@/features/crypto/services/bitkub-history";
// import { CryptoInfo } from '@/features/crypto/types/crypto.interface';

// Import shared utilities
import { CHART_COLORS, getColorByTrend } from "./chart-colors";
import {
  LARGE_CHART_CONFIG,
  createChartDimensions,
  formatPercentageLabel,
  getTimestamp,
} from "./chart-config";
import { svgConverter } from "./svg-converter";
import { generateWebSafeFontCSS } from "./font-embedding";

/**
 * Enhanced chart generator with real historical data from Bitkub
 */
export class HistoricalChartGenerator {
  /**
   * Generate historical price chart with real data
   */
  async generateHistoricalChart(
    symbol: string,
    hours: number = 24,
    title?: string,
  ): Promise<string> {
    const historicalData = await bitkubHistoryService.getPopularCryptoHistory(
      symbol,
      hours,
    );

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

    // Calculate price range
    const prices = historicalData.map((d) => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1; // 10% padding
    const adjustedMin = minPrice - padding;
    const adjustedMax = maxPrice + padding;
    const adjustedRange = adjustedMax - adjustedMin;

    // Generate line path
    const pathData = historicalData
      .map((point, index) => {
        const x =
          margin.left + (index / (historicalData.length - 1)) * chartWidth;
        const y =
          margin.top +
          chartHeight -
          ((point.close - adjustedMin) / adjustedRange) * chartHeight;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    // Generate area path (for fill)
    const areaPath =
      pathData +
      ` L ${margin.left + chartWidth} ${margin.top + chartHeight}` +
      ` L ${margin.left} ${margin.top + chartHeight} Z`;

    // Calculate color based on price change
    const firstPrice = historicalData[0]?.close || 0;
    const lastPrice = historicalData[historicalData.length - 1]?.close || 0;
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    const lineColor = getColorByTrend(priceChange);

    // Generate Y-axis labels
    const yLabels = [];
    for (let i = 0; i <= 5; i++) {
      const value = adjustedMin + (adjustedRange / 5) * i;
      const y = margin.top + chartHeight - (i / 5) * chartHeight;
      yLabels.push(`
        <text x="${margin.left - 10}" y="${y + 5}" 
              text-anchor="end" fill="${CHART_COLORS.TEXT_PRIMARY}" font-size="14" font-weight="500" class="label">
          ฿${value.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
        </text>
        <line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" 
              stroke="${CHART_COLORS.BORDER_PRIMARY}" stroke-width="1" opacity="0.3"/>
      `);
    }

    // Generate X-axis labels (time)
    const xLabels = [];
    const labelCount = Math.min(6, historicalData.length);
    for (let i = 0; i < labelCount; i++) {
      const index = Math.floor(
        (i / (labelCount - 1)) * (historicalData.length - 1),
      );
      const point = historicalData[index];
      if (!point) continue;

      const x =
        margin.left + (index / (historicalData.length - 1)) * chartWidth;
      const time = new Date(point.time);
      const timeLabel = time.toLocaleString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });

      xLabels.push(`
        <text x="${x}" y="${margin.top + chartHeight + 25}" 
              text-anchor="middle" fill="${CHART_COLORS.TEXT_PRIMARY}" font-size="12" font-weight="400" class="label">
          ${timeLabel}
        </text>
        <line x1="${x}" y1="${margin.top}" x2="${x}" y2="${margin.top + chartHeight}" 
              stroke="${CHART_COLORS.BORDER_PRIMARY}" stroke-width="1" opacity="0.3"/>
      `);
    }

    // Generate data points
    const dataPoints = historicalData.map((point, index) => {
      const x =
        margin.left + (index / (historicalData.length - 1)) * chartWidth;
      const y =
        margin.top +
        chartHeight -
        ((point.close - adjustedMin) / adjustedRange) * chartHeight;

      return `
        <circle cx="${x}" cy="${y}" r="3" fill="${lineColor}" stroke="#1a1a1a" stroke-width="2" opacity="0.8">
          <title>Time: ${new Date(point.time).toLocaleString("th-TH")}
Price: ฿${point.close.toLocaleString("th-TH")}
High: ฿${point.high.toLocaleString("th-TH")}
Low: ฿${point.low.toLocaleString("th-TH")}
Volume: ${point.volume.toLocaleString("th-TH")}</title>
        </circle>
      `;
    });

    const chartTitle =
      title || `${symbol.toUpperCase()} Historical Price Chart (${hours}h)`;

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${lineColor};stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:${lineColor};stop-opacity:0.05" />
          </linearGradient>
          ${generateWebSafeFontCSS()}
        </defs>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="${CHART_COLORS.BACKGROUND_PRIMARY}"/>
        
        <!-- Title -->
        <text x="${width / 2}" y="30" text-anchor="middle" fill="${CHART_COLORS.TEXT_PRIMARY}" class="title">
          ${chartTitle}
        </text>
        
        <!-- Price change indicator -->
        <text x="${width / 2}" y="55" text-anchor="middle" fill="${lineColor}" class="stats">
          ${formatPercentageLabel(priceChange)} (${hours}h)
        </text>
        
        <!-- Chart area background -->
        <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
              fill="none" stroke="${CHART_COLORS.BORDER_PRIMARY}" stroke-width="1"/>
        
        <!-- Grid lines and labels -->
        ${yLabels.join("")}
        ${xLabels.join("")}
        
        <!-- Price area fill -->
        <path d="${areaPath}" fill="url(#priceGradient)" stroke="none"/>
        
        <!-- Price line -->
        <path d="${pathData}" fill="none" stroke="${lineColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Data points -->
        ${dataPoints.join("")}
        
        <!-- Axis labels -->
        <text x="30" y="${margin.top + chartHeight / 2}" text-anchor="middle" 
              fill="${CHART_COLORS.TEXT_PRIMARY}" font-size="12" transform="rotate(-90 30 ${margin.top + chartHeight / 2})">
          Price (THB)
        </text>
        
        <text x="${margin.left + chartWidth / 2}" y="${height - 20}" text-anchor="middle" 
              fill="${CHART_COLORS.TEXT_PRIMARY}" font-size="12">
          Time
        </text>
        
        <!-- Stats -->
        <text x="${width - 20}" y="35" text-anchor="end" fill="${CHART_COLORS.SUCCESS}" font-size="16" font-weight="600" class="stats">
          High: ฿${maxPrice.toLocaleString("th-TH")}
        </text>
        <text x="${width - 20}" y="55" text-anchor="end" fill="${CHART_COLORS.ERROR}" font-size="16" font-weight="600" class="stats">
          Low: ฿${minPrice.toLocaleString("th-TH")}
        </text>
        <text x="${width - 20}" y="75" text-anchor="end" fill="${CHART_COLORS.TEXT_PRIMARY}" font-size="16" font-weight="600" class="stats">
          Current: ฿${lastPrice.toLocaleString("th-TH")}
        </text>
        
        <!-- Timestamp -->
        <text x="${width - 10}" y="${height - 10}" text-anchor="end" 
              fill="${CHART_COLORS.TEXT_TERTIARY}" font-size="10">
          Generated: ${getTimestamp()}
        </text>
        
        <!-- Data source -->
        <text x="10" y="${height - 10}" text-anchor="start" 
              fill="${CHART_COLORS.TEXT_TERTIARY}" font-size="10">
          Data: Bitkub API
        </text>
      </svg>
    `;
  }

  /**
   * Generate comparison chart with historical data from multiple sources
   */
  async generateHistoricalComparison(
    symbols: string[],
    hours: number = 24,
    title?: string,
  ): Promise<string> {
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

    // Calculate normalized price ranges (percentage change from first point)
    const normalizedData = validData.map((data, _index) => {
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
    const adjustedRange = adjustedMax - adjustedMin;

    // Colors for different symbols
    const colors = [
      CHART_COLORS.SUCCESS,
      CHART_COLORS.PRIMARY_BLUE,
      CHART_COLORS.PRIMARY_YELLOW,
      CHART_COLORS.ERROR,
      CHART_COLORS.PRIMARY_PURPLE,
    ];

    // Generate lines for each symbol
    const lines = normalizedData.map((data, symbolIndex) => {
      if (data.length === 0) return "";

      const color = colors[symbolIndex % colors.length];
      const pathData = data
        .map((point, index) => {
          const x = margin.left + (index / (data.length - 1)) * chartWidth;
          const y =
            margin.top +
            chartHeight -
            ((point.normalizedPrice - adjustedMin) / adjustedRange) *
              chartHeight;
          return `${index === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");

      return `
        <path d="${pathData}" fill="none" stroke="${color}" stroke-width="2"/>
        <text x="${margin.left + chartWidth + 10}" y="${margin.top + 20 + symbolIndex * 20}" 
              fill="${color}" font-size="12">
          ${symbols[symbolIndex]?.toUpperCase() || "Unknown"}
        </text>
      `;
    });

    // Generate Y-axis labels (percentage)
    const yLabels = [];
    for (let i = 0; i <= 5; i++) {
      const value = adjustedMin + (adjustedRange / 5) * i;
      const y = margin.top + chartHeight - (i / 5) * chartHeight;
      yLabels.push(`
        <text x="${margin.left - 10}" y="${y + 5}" 
              text-anchor="end" fill="#cccccc" font-size="10">
          ${value >= 0 ? "+" : ""}${value.toFixed(1)}%
        </text>
        <line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" 
              stroke="${CHART_COLORS.BORDER_PRIMARY}" stroke-width="1" opacity="0.3"/>
      `);
    }

    const chartTitle = title || `Price Comparison (${hours}h) - Normalized %`;

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${generateWebSafeFontCSS()}
        </defs>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="${CHART_COLORS.BACKGROUND_PRIMARY}"/>
        
        <!-- Title -->
        <text x="${width / 2}" y="30" text-anchor="middle" fill="${CHART_COLORS.TEXT_PRIMARY}" class="title">
          ${chartTitle}
        </text>
        
        <!-- Chart area background -->
        <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
              fill="none" stroke="${CHART_COLORS.BORDER_PRIMARY}" stroke-width="1"/>
        
        <!-- Grid lines and labels -->
        ${yLabels.join("")}
        
        <!-- Zero line -->
        <line x1="${margin.left}" y1="${margin.top + chartHeight - (-adjustedMin / adjustedRange) * chartHeight}" 
              x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight - (-adjustedMin / adjustedRange) * chartHeight}" 
              stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>
        
        <!-- Price lines -->
        ${lines.join("")}
        
        <!-- Axis labels -->
        <text x="30" y="${margin.top + chartHeight / 2}" text-anchor="middle" 
              fill="${CHART_COLORS.TEXT_PRIMARY}" font-size="12" transform="rotate(-90 30 ${margin.top + chartHeight / 2})">
          Price Change (%)
        </text>
        
        <text x="${margin.left + chartWidth / 2}" y="${height - 20}" text-anchor="middle" 
              fill="${CHART_COLORS.TEXT_PRIMARY}" font-size="12">
          Time (${hours} hours)
        </text>
        
        <!-- Timestamp -->
        <text x="${width - 10}" y="${height - 10}" text-anchor="end" 
              fill="${CHART_COLORS.TEXT_TERTIARY}" font-size="10">
          Generated: ${getTimestamp()}
        </text>
      </svg>
    `;
  }

  /**
   * Generate error chart when data is not available
   */
  private generateErrorChart(message: string): string {
    const { width, height } = LARGE_CHART_CONFIG;
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${CHART_COLORS.BACKGROUND_PRIMARY}"/>
        <text x="${width / 2}" y="${height / 2 - 40}" text-anchor="middle" fill="${CHART_COLORS.ERROR}" font-size="18" font-weight="bold">
          ⚠️ Chart Error
        </text>
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${CHART_COLORS.TEXT_SECONDARY}" font-size="14">
          ${message}
        </text>
        <text x="${width / 2}" y="${height / 2 + 30}" text-anchor="middle" fill="${CHART_COLORS.TEXT_TERTIARY}" font-size="12">
          Please try again later or check symbol availability
        </text>
      </svg>
    `;
  }

  /**
   * Convert SVG to PNG using shared converter
   */
  async convertSvgToPng(svgString: string): Promise<Buffer> {
    const result = await svgConverter.convertForLineMessaging(svgString);
    return result.data;
  }
}

export const historicalChartGenerator = new HistoricalChartGenerator();

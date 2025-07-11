import { CryptoInfo } from "@/features/crypto/types/crypto.interface";

// Import shared utilities
import { CHART_COLORS, getColorByTrend } from "./chart-colors";
import {
  DEFAULT_CHART_CONFIG,
  createChartDimensions,
  formatPriceLabel,
  getTimestamp,
} from "./chart-config";
import { svgConverter } from "./svg-converter";

/**
 * Simple chart generator that works without canvas dependencies
 * Creates SVG charts that can be converted to images
 */
export class SimpleChartGenerator {
  /**
   * Generate a simple SVG bar chart for crypto comparison
   */
  generateSimpleCryptoChart(cryptos: CryptoInfo[], title: string): string {
    const dimensions = createChartDimensions(
      DEFAULT_CHART_CONFIG.width,
      DEFAULT_CHART_CONFIG.height,
      "DEFAULT",
    );
    const { width, height, margin, chartWidth, chartHeight } = dimensions;

    // Calculate max price for scaling
    const maxPrice = Math.max(
      ...cryptos.map((c) => parseFloat(c.lastPrice || "0")),
    );
    const priceScale = chartHeight / maxPrice;

    // Calculate bar width
    const barWidth = chartWidth / cryptos.length;

    // Generate bars
    const bars = cryptos
      .map((crypto, index) => {
        const price = parseFloat(crypto.lastPrice || "0");
        const barHeight = price * priceScale;
        const x = margin.left + index * barWidth + barWidth * 0.1;
        const y = margin.top + chartHeight - barHeight;
        const change = crypto.changePriceOriginal || 0;
        const color = getColorByTrend(change);

        return `
        <rect x="${x}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" 
              fill="${color}" stroke="${CHART_COLORS.BORDER_PRIMARY}" stroke-width="1"/>
        <text x="${x + barWidth * 0.4}" y="${margin.top + chartHeight + 20}" 
              text-anchor="middle" fill="${CHART_COLORS.TEXT_PRIMARY}" font-size="12">
          ${crypto.currencyName || "Unknown"}
        </text>
        <text x="${x + barWidth * 0.4}" y="${margin.top + chartHeight + 40}" 
              text-anchor="middle" fill="${CHART_COLORS.TEXT_SECONDARY}" font-size="10">
          ${crypto.exchange}
        </text>
        <text x="${x + barWidth * 0.4}" y="${y - 5}" 
              text-anchor="middle" fill="${CHART_COLORS.TEXT_PRIMARY}" font-size="10">
          ${formatPriceLabel(price)}
        </text>
      `;
      })
      .join("");

    // Generate Y-axis labels
    const yAxisLabels = [];
    for (let i = 0; i <= 5; i++) {
      const value = (maxPrice / 5) * i;
      const y = margin.top + chartHeight - value * priceScale;
      yAxisLabels.push(`
        <text x="${margin.left - 10}" y="${y + 5}" 
              text-anchor="end" fill="${CHART_COLORS.TEXT_SECONDARY}" font-size="10">
          ${formatPriceLabel(value)}
        </text>
        <line x1="${margin.left}" y1="${y}" x2="${margin.left + chartWidth}" y2="${y}" 
              stroke="${CHART_COLORS.BORDER_PRIMARY}" stroke-width="1" opacity="0.3"/>
      `);
    }

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            <![CDATA[
              .title { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; }
              .axis { font-family: Arial, sans-serif; font-size: 12px; }
            ]]>
          </style>
        </defs>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="${CHART_COLORS.BACKGROUND_PRIMARY}"/>
        
        <!-- Title -->
        <text x="${width / 2}" y="40" text-anchor="middle" fill="${CHART_COLORS.TEXT_PRIMARY}" class="title">
          ${title}
        </text>
        
        <!-- Chart area background -->
        <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
              fill="none" stroke="${CHART_COLORS.BORDER_PRIMARY}" stroke-width="1"/>
        
        <!-- Y-axis labels and grid -->
        ${yAxisLabels.join("")}
        
        <!-- Bars -->
        ${bars}
        
        <!-- Y-axis title -->
        <text x="30" y="${margin.top + chartHeight / 2}" text-anchor="middle" 
              fill="${CHART_COLORS.TEXT_PRIMARY}" font-size="14" transform="rotate(-90 30 ${margin.top + chartHeight / 2})">
          Price (THB)
        </text>
        
        <!-- X-axis title -->
        <text x="${margin.left + chartWidth / 2}" y="${height - 20}" text-anchor="middle" 
              fill="${CHART_COLORS.TEXT_PRIMARY}" font-size="14">
          Cryptocurrencies
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
   * Convert SVG to PNG using shared converter
   */
  async convertSvgToPng(svgString: string): Promise<Buffer> {
    const result = await svgConverter.convertSvgToPng(svgString);
    return result.data;
  }
}

export const simpleChartGenerator = new SimpleChartGenerator();

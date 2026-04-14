/**
 * Bitkub TradingView History API Service
 * Fetches historical price data for crypto charts
 */

export interface BitkubHistoryData {
  c: number[]; // closing prices
  h: number[]; // high prices
  l: number[]; // low prices
  o: number[]; // opening prices
  s: string; // status
  t: number[]; // timestamps
  v: number[]; // trading volumes
}

export interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class BitkubHistoryService {
  private baseUrl = "https://api.bitkub.com";

  /**
   * Fetch historical price data from Bitkub TradingView API
   * @param symbol Trading symbol (e.g. 'BTC_THB')
   * @param resolution Chart resolution ('1', '5', '15', '60', '240', '1D')
   * @param from Starting timestamp
   * @param to Ending timestamp
   */
  async fetchHistoricalData(
    symbol: string,
    resolution: string = "60",
    from?: number,
    to?: number,
  ): Promise<BitkubHistoryData | null> {
    try {
      // Default to last 24 hours if no time range specified
      const now = Math.floor(Date.now() / 1000);
      const fromTime = from || now - 24 * 60 * 60; // 24 hours ago
      const toTime = to || now;

      const params = new URLSearchParams({
        symbol,
        resolution,
        from: fromTime.toString(),
        to: toTime.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/tradingview/history?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Bitkub API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.s !== "ok") {
        if (data.s === "no_data") {
          return { s: "no_data", t: [], o: [], h: [], l: [], c: [], v: [] };
        }
        throw new Error(`Bitkub API returned error status: ${data.s}`);
      }

      return data;
    } catch {
      return null;
    }
  }

  /**
   * Convert raw Bitkub data to formatted chart data points
   */
  formatChartData(data: BitkubHistoryData): ChartDataPoint[] {
    const points: ChartDataPoint[] = [];

    if (!data.t || !data.o || !data.h || !data.l || !data.c || !data.v) {
      return points;
    }

    for (let i = 0; i < data.t.length; i++) {
      const timestamp = data.t[i];
      const openPrice = data.o[i];
      const highPrice = data.h[i];
      const lowPrice = data.l[i];
      const closePrice = data.c[i];
      const volume = data.v[i];

      if (
        timestamp &&
        openPrice !== undefined &&
        highPrice !== undefined &&
        lowPrice !== undefined &&
        closePrice !== undefined &&
        volume !== undefined
      ) {
        points.push({
          time: new Date(timestamp * 1000).toISOString(),
          open: openPrice,
          high: highPrice,
          low: lowPrice,
          close: closePrice,
          volume: volume,
        });
      }
    }

    return points;
  }

  /**
   * Get historical data for popular crypto pairs
   */
  async getPopularCryptoHistory(
    symbol: string,
    hours: number = 24,
  ): Promise<ChartDataPoint[]> {
    const bitkubSymbol = this.convertToThbPair(symbol);

    const now = Math.floor(Date.now() / 1000);
    const from = now - hours * 60 * 60;

    const data = await this.fetchHistoricalData(bitkubSymbol, "60", from, now);

    if (!data || data.s === "no_data") {
      return [];
    }

    const formattedData = this.formatChartData(data);
    return formattedData;
  }

  /**
   * Convert crypto symbol to Bitkub THB pair format
   */
  private convertToThbPair(symbol: string): string {
    const upperSymbol = symbol.toUpperCase();

    // Simple mapping for popular coins
    const symbolMap: { [key: string]: string } = {
      BTC: "BTC_THB",
      ETH: "ETH_THB",
      ADA: "ADA_THB",
      DOT: "DOT_THB",
      LINK: "LINK_THB",
      LTC: "LTC_THB",
      XRP: "XRP_THB",
      DOGE: "DOGE_THB",
      SOL: "SOL_THB",
      MATIC: "MATIC_THB",
      AVAX: "AVAX_THB",
      UNI: "UNI_THB",
      USDT: "USDT_THB",
      USDC: "USDC_THB",
      BNB: "BNB_THB",
      SHIB: "SHIB_THB",
      PEPE: "PEPE_THB",
    };

    return symbolMap[upperSymbol] || `${upperSymbol}_THB`;
  }

  /**
   * Get available resolutions for charts
   */
  getAvailableResolutions(): string[] {
    return ["1", "5", "15", "60", "240", "1D"];
  }

  /**
   * Get human-readable resolution labels
   */
  getResolutionLabel(resolution: string): string {
    const labels: { [key: string]: string } = {
      "1": "1 นาที",
      "5": "5 นาที",
      "15": "15 นาที",
      "60": "1 ชั่วโมง",
      "240": "4 ชั่วโมง",
      "1D": "1 วัน",
    };
    return labels[resolution] || resolution;
  }
}

// Export singleton instance
export const bitkubHistoryService = new BitkubHistoryService();

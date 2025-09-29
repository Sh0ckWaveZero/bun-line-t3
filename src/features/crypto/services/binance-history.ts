/**
 * Binance Kline/Candlestick Historical Data API Service
 * Fetches historical price data for crypto charts
 */

export interface BinanceKlineData {
  symbol: string;
  interval: string;
  data: number[][];
}

export interface BinanceKlineRaw {
  0: number; // Open time
  1: string; // Open price
  2: string; // High price
  3: string; // Low price
  4: string; // Close price
  5: string; // Volume
  6: number; // Close time
  7: string; // Quote asset volume
  8: number; // Number of trades
  9: string; // Taker buy base asset volume
  10: string; // Taker buy quote asset volume
  11: string; // Ignore
}

export interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class BinanceHistoryService {
  private baseUrl = "https://api.binance.com";

  /**
   * Fetch historical kline data from Binance API
   * @param symbol Trading symbol (e.g. 'BTCUSDT')
   * @param interval Chart interval ('1m', '5m', '15m', '1h', '4h', '1d')
   * @param limit Number of data points (max 1000)
   * @param startTime Starting timestamp (optional)
   * @param endTime Ending timestamp (optional)
   */
  async fetchKlineData(
    symbol: string,
    interval: string = "1h",
    limit: number = 24,
    startTime?: number,
    endTime?: number,
  ): Promise<BinanceKlineRaw[] | null> {
    try {
      const params = new URLSearchParams({
        symbol: symbol.toUpperCase(),
        interval,
        limit: Math.min(limit, 1000).toString(),
      });

      if (startTime) {
        params.append("startTime", startTime.toString());
      }
      if (endTime) {
        params.append("endTime", endTime.toString());
      }

      const response = await fetch(
        `${this.baseUrl}/api/v3/klines?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("🚀 ~ BinanceHistoryService ~ data length:", data.length);

      return data;
    } catch (error) {
      console.error("Error fetching Binance kline data:", error);
      return null;
    }
  }

  /**
   * Convert raw Binance kline data to formatted chart data points
   */
  formatChartData(data: BinanceKlineRaw[]): ChartDataPoint[] {
    const points: ChartDataPoint[] = [];

    if (!data || !Array.isArray(data)) {
      return points;
    }

    for (const kline of data) {
      const openTime = kline[0];
      const openPrice = parseFloat(kline[1]);
      const highPrice = parseFloat(kline[2]);
      const lowPrice = parseFloat(kline[3]);
      const closePrice = parseFloat(kline[4]);
      const volume = parseFloat(kline[5]);

      if (
        openTime &&
        !isNaN(openPrice) &&
        !isNaN(highPrice) &&
        !isNaN(lowPrice) &&
        !isNaN(closePrice) &&
        !isNaN(volume)
      ) {
        points.push({
          time: new Date(openTime).toISOString(),
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
    const binanceSymbol = this.convertToUsdtPair(symbol);
    console.log(`🔍 Fetching Binance data for: ${symbol} -> ${binanceSymbol}`);

    // Calculate limit based on hours and interval
    const interval = "1h";
    const limit = Math.min(hours, 720); // Max 720 hours (30 days)

    const data = await this.fetchKlineData(binanceSymbol, interval, limit);

    if (!data) {
      console.log(`❌ No data returned for ${binanceSymbol}`);
      return [];
    }

    if (data.length === 0) {
      console.log(`❌ No data available for ${binanceSymbol}`);
      return [];
    }

    const formattedData = this.formatChartData(data);
    console.log(
      `✅ Binance data formatted for ${binanceSymbol}: ${formattedData.length} points`,
    );

    return formattedData;
  }

  /**
   * Convert crypto symbol to Binance USDT pair format
   */
  private convertToUsdtPair(symbol: string): string {
    const upperSymbol = symbol.toUpperCase();

    // Handle special cases
    const symbolMap: { [key: string]: string } = {
      USDT: "BTCUSDT", // Default to BTC when requesting USDT
      USDC: "USDCUSDT",
      DAI: "DAIUSDT",
      BUSD: "BUSDUSDT",
    };

    return symbolMap[upperSymbol] || `${upperSymbol}USDT`;
  }

  /**
   * Get available intervals for charts
   */
  getAvailableIntervals(): string[] {
    return ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];
  }

  /**
   * Get human-readable interval labels
   */
  getIntervalLabel(interval: string): string {
    const labels: { [key: string]: string } = {
      "1m": "1 นาที",
      "5m": "5 นาที",
      "15m": "15 นาที",
      "30m": "30 นาที",
      "1h": "1 ชั่วโมง",
      "4h": "4 ชั่วโมง",
      "1d": "1 วัน",
      "1w": "1 สัปดาห์",
    };
    return labels[interval] || interval;
  }

  /**
   * Check if symbol is available on Binance
   */
  async isSymbolAvailable(symbol: string): Promise<boolean> {
    try {
      const binanceSymbol = this.convertToUsdtPair(symbol);
      const response = await fetch(
        `${this.baseUrl}/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
      );
      return response.ok;
    } catch (error) {
      console.error("Error checking symbol availability:", error);
      return false;
    }
  }

  /**
   * Get symbol information
   */
  async getSymbolInfo(symbol: string) {
    try {
      const binanceSymbol = this.convertToUsdtPair(symbol);
      const response = await fetch(
        `${this.baseUrl}/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        symbol: data.symbol,
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        weightedAvgPrice: parseFloat(data.weightedAvgPrice),
        prevClosePrice: parseFloat(data.prevClosePrice),
        lastPrice: parseFloat(data.lastPrice),
        bidPrice: parseFloat(data.bidPrice),
        askPrice: parseFloat(data.askPrice),
        openPrice: parseFloat(data.openPrice),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
        openTime: data.openTime,
        closeTime: data.closeTime,
        count: data.count,
      };
    } catch (error) {
      console.error("Error fetching symbol info:", error);
      return null;
    }
  }
}

// Export singleton instance
export const binanceHistoryService = new BinanceHistoryService();

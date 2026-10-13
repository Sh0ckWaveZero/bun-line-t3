import { tanstackChartGenerator } from "@/lib/utils/chart-generator-tanstack";
import { uploadImageToTemporaryHost } from "@/lib/utils/line-messaging";
import type { UploadResult } from "@/lib/types/line-messaging";
import { exchangeService } from "./exchange.server";
import { bitkubHistoryService } from "./bitkub-history.server";
import { binanceHistoryService } from "./binance-history.server";
import { CryptoInfo } from "../types/crypto.interface";
import { CHART_PERIODS, type ChartPeriod } from "../constants/chart-periods";

export type ChartImageUrls = UploadResult;

export interface ChartMarketStats {
  period: ChartPeriod;
  periodLabel: string;
  changePercent: number;
  high: number;
  low: number;
  totalVolume: number;
  latestCandle: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
}

export interface ChartData {
  cryptoData: CryptoInfo;
  imageUrls: ChartImageUrls;
  hasHistoricalData: boolean;
  marketStats: ChartMarketStats;
}

export interface ComparisonChartData {
  validCryptos: CryptoInfo[];
  imageUrls: ChartImageUrls;
}

class ChartService {
  async getCryptoData(
    symbol: string,
    exchange: string,
  ): Promise<CryptoInfo | null> {
    switch (exchange.toLowerCase()) {
      case "bitkub":
      case "bk":
        return await exchangeService.getBitkub(symbol);
      case "binance":
      case "bn":
        return await exchangeService.getBinance(symbol, "USDT");
      case "satang":
      case "st":
        return await exchangeService.getSatangCorp(symbol);
      case "bitazza":
      case "btz":
        return await exchangeService.getBitazza(symbol);
      case "gate":
      case "gateio":
        return await exchangeService.getGeteio(symbol);
      case "mexc":
      case "mx":
        return await exchangeService.getMexc(symbol);
      case "cmc":
      case "coinmarketcap":
        return await exchangeService.getCoinMarketCap(symbol);
      default:
        return await exchangeService.getBitkub(symbol);
    }
  }

  async generateSingleChart(
    symbol: string,
    exchange: string,
    period: ChartPeriod = "24h",
  ): Promise<ChartData> {
    const cryptoData = await this.getCryptoData(symbol, exchange);

    if (!cryptoData) {
      throw new Error(`Failed to fetch ${symbol} data from ${exchange}`);
    }

    // Get historical data based on exchange
    const periodConfig = CHART_PERIODS[period];
    let historicalData;
    if (
      exchange.toLowerCase() === "binance" ||
      exchange.toLowerCase() === "bn"
    ) {
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

    if (historicalData.length === 0) {
      throw new Error(`No historical data available for ${symbol}`);
    }

    const firstCandle = historicalData[0]!;
    const latestCandle = historicalData.at(-1)!;
    const marketStats: ChartMarketStats = {
      period,
      periodLabel: periodConfig.label,
      changePercent:
        firstCandle.open > 0
          ? ((latestCandle.close - firstCandle.open) / firstCandle.open) * 100
          : 0,
      high: Math.max(...historicalData.map((candle) => candle.high)),
      low: Math.min(...historicalData.map((candle) => candle.low)),
      totalVolume: historicalData.reduce(
        (total, candle) => total + candle.volume,
        0,
      ),
      latestCandle: {
        open: latestCandle.open,
        high: latestCandle.high,
        low: latestCandle.low,
        close: latestCandle.close,
        volume: latestCandle.volume,
      },
    };

    // Generate chart
    const isBinance =
      exchange.toLowerCase() === "binance" || exchange.toLowerCase() === "bn";
    const quoteAsset = isBinance ? "USDT" : "THB";
    const chartTitle = `ราคา ${cryptoData.currencyName || symbol.toUpperCase()} · ${symbol.toUpperCase()}/${quoteAsset}`;
    const chartBuffer = await tanstackChartGenerator.generateHistoricalChart(
      symbol,
      period,
      chartTitle,
      exchange,
      historicalData,
    );

    // Upload chart image
    const imageUrls = await uploadImageToTemporaryHost(
      chartBuffer,
      `${symbol}_${exchange}_chart.png`,
    );

    return {
      cryptoData,
      imageUrls,
      hasHistoricalData: true,
      marketStats,
    };
  }

  async generateComparisonChart(symbol: string): Promise<ComparisonChartData> {
    // Fetch data from multiple exchanges
    const cryptoPromises = [
      exchangeService.getBitkub(symbol),
      exchangeService.getBinance(symbol, "USDT"),
      exchangeService.getSatangCorp(symbol),
    ];

    const cryptoResults = await Promise.allSettled(cryptoPromises);

    const validCryptos = cryptoResults
      .filter(
        (result): result is PromiseFulfilledResult<CryptoInfo> =>
          result.status === "fulfilled" && result.value !== null,
      )
      .map((result) => result.value);

    if (validCryptos.length === 0) {
      throw new Error("No valid crypto data found for comparison");
    }

    // Generate comparison chart
    const chartBuffer =
      await tanstackChartGenerator.generateHistoricalComparison(
        [symbol],
        24,
        `${symbol.toUpperCase()} · เปรียบเทียบราคา`,
      );

    // Upload chart image
    const imageUrls = await uploadImageToTemporaryHost(
      chartBuffer,
      `${symbol}_comparison_chart.png`,
    );

    return {
      validCryptos,
      imageUrls,
    };
  }

  async checkHistoricalDataAvailability(
    symbol: string,
    exchange: string = "bitkub",
    period: ChartPeriod = "24h",
  ): Promise<boolean> {
    const periodConfig = CHART_PERIODS[period];
    let historicalData;

    if (
      exchange.toLowerCase() === "binance" ||
      exchange.toLowerCase() === "bn"
    ) {
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

    return historicalData.length > 0;
  }
}

export const chartService = new ChartService();

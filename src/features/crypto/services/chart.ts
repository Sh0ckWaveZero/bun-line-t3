import { d3ChartGenerator } from "@/lib/utils/chart-generator-d3";
import { uploadImageToTemporaryHost } from "@/lib/utils/line-messaging";
import { exchangeService } from "./exchange";
import { bitkubHistoryService } from "./bitkub-history";
import { CryptoInfo } from "../types/crypto.interface";

export interface ChartImageUrls {
  originalUrl: string;
  previewUrl: string;
}

export interface ChartData {
  cryptoData: CryptoInfo;
  imageUrls: ChartImageUrls;
  hasHistoricalData: boolean;
}

export interface ComparisonChartData {
  validCryptos: CryptoInfo[];
  imageUrls: ChartImageUrls;
}

class ChartService {
  async getCryptoData(symbol: string, exchange: string): Promise<CryptoInfo | null> {
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

  async generateSingleChart(symbol: string, exchange: string): Promise<ChartData> {
    const cryptoData = await this.getCryptoData(symbol, exchange);
    
    if (!cryptoData) {
      throw new Error(`Failed to fetch ${symbol} data from ${exchange}`);
    }

    // Check for historical data
    const historicalData = await bitkubHistoryService.getPopularCryptoHistory(symbol, 24);
    
    if (historicalData.length === 0) {
      throw new Error(`No historical data available for ${symbol}`);
    }

    // Generate chart
    const chartBuffer = await d3ChartGenerator.generateHistoricalChart(
      symbol,
      24,
      `${cryptoData.currencyName || symbol.toUpperCase()} Price Chart`,
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
    const chartBuffer = await d3ChartGenerator.generateHistoricalComparison(
      [symbol],
      24,
      `${symbol.toUpperCase()} Price Comparison`,
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

  async checkHistoricalDataAvailability(symbol: string): Promise<boolean> {
    const historicalData = await bitkubHistoryService.getPopularCryptoHistory(symbol, 24);
    return historicalData.length > 0;
  }
}

export const chartService = new ChartService();
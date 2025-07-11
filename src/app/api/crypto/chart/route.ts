import { NextRequest, NextResponse } from "next/server";
// import { chartGenerator } from '@/lib/utils/chart-generator';
import { simpleChartGenerator } from "@/lib/utils/chart-generator-simple";
import { historicalChartGenerator } from "@/lib/utils/chart-generator-historical";
import { exchangeService } from "@/features/crypto/services/exchange";
import { CryptoInfo } from "@/features/crypto/types/crypto.interface";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const exchange = searchParams.get("exchange");
    const type = searchParams.get("type") || "line";

    if (!symbol || !exchange) {
      return NextResponse.json(
        { error: "Missing required parameters: symbol and exchange" },
        { status: 400 },
      );
    }

    // Get crypto data based on exchange
    let cryptoData: CryptoInfo | null = null;

    switch (exchange.toLowerCase()) {
      case "bitkub":
      case "bk":
        cryptoData = await exchangeService.getBitkub(symbol);
        break;
      case "binance":
      case "bn":
        cryptoData = await exchangeService.getBinance(symbol, "USDT");
        break;
      case "satang":
      case "st":
        cryptoData = await exchangeService.getSatangCorp(symbol);
        break;
      case "bitazza":
      case "btz":
        cryptoData = await exchangeService.getBitazza(symbol);
        break;
      case "gate":
      case "gateio":
        cryptoData = await exchangeService.getGeteio(symbol);
        break;
      case "mexc":
      case "mx":
        cryptoData = await exchangeService.getMexc(symbol);
        break;
      case "cmc":
      case "coinmarketcap":
        cryptoData = await exchangeService.getCoinMarketCap(symbol);
        break;
      default:
        cryptoData = await exchangeService.getBitkub(symbol);
    }

    if (!cryptoData) {
      return NextResponse.json(
        { error: "Failed to fetch crypto data" },
        { status: 404 },
      );
    }

    let chartBuffer: Buffer;

    if (type === "comparison") {
      // Generate comparison chart with multiple exchanges
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
        return NextResponse.json(
          { error: "No valid crypto data found" },
          { status: 404 },
        );
      }

      // Use historical comparison chart if available
      const svgChart =
        await historicalChartGenerator.generateHistoricalComparison(
          [symbol],
          24,
          `${symbol.toUpperCase()} Price Comparison`,
        );
      chartBuffer = await historicalChartGenerator.convertSvgToPng(svgChart);
    } else {
      // Generate historical chart with real data
      const hours = searchParams.get("hours")
        ? parseInt(searchParams.get("hours")!)
        : 24;

      const svgChart = await historicalChartGenerator.generateHistoricalChart(
        symbol,
        hours,
        `${cryptoData.currencyName || symbol.toUpperCase()} Price Chart`,
      );
      chartBuffer = await historicalChartGenerator.convertSvgToPng(svgChart);
    }

    // Return image
    return new NextResponse(chartBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60", // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error("Error generating crypto chart:", error);
    return NextResponse.json(
      { error: "Failed to generate chart" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { holdings, title } = body;

    if (!holdings || !Array.isArray(holdings)) {
      return NextResponse.json(
        { error: "Invalid holdings data" },
        { status: 400 },
      );
    }

    // Simple fallback for portfolio chart
    const mockCryptos = holdings.map((h) => ({
      currencyName: h.symbol,
      lastPrice: h.value.toString(),
      exchange: "Portfolio",
      changePriceOriginal: 0,
    }));
    const svgChart = simpleChartGenerator.generateSimpleCryptoChart(
      mockCryptos as any,
      title || "Portfolio Distribution",
    );
    const chartBuffer = await simpleChartGenerator.convertSvgToPng(svgChart);

    return new NextResponse(chartBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error("Error generating portfolio chart:", error);
    return NextResponse.json(
      { error: "Failed to generate chart" },
      { status: 500 },
    );
  }
}

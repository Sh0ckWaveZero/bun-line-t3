import { NextRequest } from "next/server";
import { sendMessage } from "@/lib/utils/line-utils";
import { chartService } from "@/features/crypto/services/chart";
import { ChartTemplates } from "@/features/line/templates/chart-templates";
import { ChartParser, ChartCommandParams } from "@/features/line/parsers/chart-parser";

export async function handleChartCommand(
  req: NextRequest,
  userId: string,
  params: ChartCommandParams,
): Promise<void> {
  try {
    console.log("🎯 handleChartCommand called with params:", params);
    const { symbol, exchange = "bitkub", type = "line" } = params;

    if (type === "comparison") {
      await handleComparisonChart(req, symbol);
    } else {
      await handleSingleChart(req, symbol, exchange);
    }
  } catch (error) {
    console.error("Error handling chart command:", error);
    throw error;
  }
}

async function handleComparisonChart(req: NextRequest, symbol: string): Promise<void> {
  // Send loading message
  const loadingMessage = ChartTemplates.createLoadingMessage(symbol, true);
  await sendMessage(req, [loadingMessage]);

  try {
    const comparisonData = await chartService.generateComparisonChart(symbol);
    const logoUrl = comparisonData.validCryptos[0]?.urlLogo;
    const chartMessage = ChartTemplates.createComparisonChartCarousel(
      symbol,
      comparisonData.imageUrls,
      logoUrl,
    );
    
    await sendMessage(req, [chartMessage]);
  } catch (error) {
    console.error("❌ Failed to generate comparison chart:", error);
    throw error;
  }
}

async function handleSingleChart(req: NextRequest, symbol: string, exchange: string): Promise<void> {
  // Check historical data availability first
  const hasHistoricalData = await chartService.checkHistoricalDataAvailability(symbol);
  
  if (!hasHistoricalData) {
    console.log("❌ No historical data available for:", symbol);
    const noDataMessage = ChartTemplates.createNoDataMessage(symbol);
    await sendMessage(req, [noDataMessage]);
    return;
  }

  try {
    console.log("📈 Generating chart for:", symbol, "from:", exchange);
    const chartData = await chartService.generateSingleChart(symbol, exchange);
    
    const chartMessage = ChartTemplates.createSingleChartCarousel(
      chartData.cryptoData,
      symbol,
      chartData.imageUrls,
    );
    
    await sendMessage(req, [chartMessage]);
    console.log("✅ Chart carousel sent successfully");
  } catch (imageError) {
    console.error("❌ Failed to send chart carousel:", imageError);
    
    // Try to get crypto data for fallback message
    try {
      const cryptoData = await chartService.getCryptoData(symbol, exchange);
      if (cryptoData) {
        const fallbackMessage = ChartTemplates.createErrorFallbackMessage(symbol, cryptoData);
        await sendMessage(req, [fallbackMessage]);
      }
    } catch (fallbackError) {
      console.error("❌ Failed to send fallback message:", fallbackError);
      throw imageError;
    }
  }
}

export function parseChartCommand(text: string): ChartCommandParams | null {
  return ChartParser.parseCommand(text);
}
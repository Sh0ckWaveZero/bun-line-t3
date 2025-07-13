import { NextRequest } from "next/server";
import { sendChartImage } from "@/lib/utils/line-messaging";
import { d3ChartGenerator } from "@/lib/utils/chart-generator-d3";
import { exchangeService } from "@/features/crypto/services/exchange";
import { CryptoInfo } from "@/features/crypto/types/crypto.interface";

interface ChartCommandParams {
  symbol: string;
  exchange: string;
  type: "line" | "comparison";
}

export async function handleChartCommand(
  req: NextRequest,
  userId: string,
  params: ChartCommandParams,
): Promise<void> {
  try {
    console.log("🎯 handleChartCommand called with params:", params);
    const { symbol, exchange = "bitkub", type = "line" } = params;

    if (type === "comparison") {
      // Generate comparison chart across multiple exchanges
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

      // Send loading message first
      const { sendMessage } = await import("@/lib/utils/line-utils");
      await sendMessage(req, [
        {
          type: "text",
          text: `📊 กำลังสร้างกราฟเปรียบเทียบ ${symbol.toUpperCase()} กรุณารอสักครู่...`,
        },
      ]);

      // Use D3 historical comparison chart
      const chartBuffer = await d3ChartGenerator.generateHistoricalComparison(
        [symbol], // For now, just compare one symbol over time
        24,
        `${symbol.toUpperCase()} Price Comparison`,
      );

      await sendChartImage(
        userId,
        chartBuffer,
        `${symbol}_comparison_chart.png`,
      );
    } else {
      // Generate single crypto chart
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
        throw new Error(`Failed to fetch ${symbol} data from ${exchange}`);
      }

      // Send loading message first
      const { sendMessage } = await import("@/lib/utils/line-utils");
      await sendMessage(req, [
        {
          type: "text",
          text: `📊 กำลังสร้างกราฟ ${symbol.toUpperCase()} กรุณารอสักครู่...`,
        },
      ]);

      // Check if historical data is available
      console.log("🔍 Checking historical data availability for:", symbol);
      const { bitkubHistoryService } = await import(
        "@/features/crypto/services/bitkub-history"
      );
      const historicalData = await bitkubHistoryService.getPopularCryptoHistory(
        symbol,
        24,
      );

      if (historicalData.length === 0) {
        console.log("❌ No historical data available for:", symbol);
        const { sendMessage } = await import("@/lib/utils/line-utils");
        await sendMessage(req, [
          {
            type: "text",
            text: `❌ ไม่พบข้อมูลกราฟสำหรับ ${symbol.toUpperCase()}\n\n💡 เหรียญที่มีข้อมูล: BTC, ETH, ADA, XRP, DOT, SOL, AVAX, LINK\n\nลองใช้: /chart btc หรือ /chart eth`,
          },
        ]);
        return;
      }

      console.log(
        "✅ Historical data found:",
        historicalData.length,
        "records",
      );

      // Generate historical chart with D3.js
      console.log("📈 Generating D3 chart for:", symbol);
      const chartBuffer = await d3ChartGenerator.generateHistoricalChart(
        symbol,
        24, // 24 hours of data
        `${cryptoData.currencyName || symbol.toUpperCase()} Price Chart`,
      );
      console.log("📈 PNG buffer generated, length:", chartBuffer.length);

      console.log("📤 Sending chart image to user:", userId);
      try {
        await sendChartImage(
          userId,
          chartBuffer,
          `${symbol}_${exchange}_chart.png`,
        );
        console.log("✅ Chart image sent successfully");
      } catch (imageError) {
        console.error("❌ Failed to send chart image:", imageError);
        // Fallback: send text message with error info
        const { sendMessage } = await import("@/lib/utils/line-utils");
        await sendMessage(req, [
          {
            type: "text",
            text: `⚠️ กราฟ ${symbol.toUpperCase()} ถูกสร้างแล้ว แต่ไม่สามารถส่งรูปภาพได้\n\n📊 ข้อมูลล่าสุด:\n• ชื่อ: ${cryptoData.currencyName}\n• ราคา: ฿${parseFloat(cryptoData.lastPrice || "0").toLocaleString("th-TH")}\n• เปลี่ยนแปลง: ${cryptoData.changePriceOriginal || 0 >= 0 ? "+" : ""}${cryptoData.changePriceOriginal || 0}%\n\n🔄 ลองใหม่: /chart ${symbol.toLowerCase()}`,
          },
        ]);
      }
    }
  } catch (error) {
    console.error("Error handling chart command:", error);
    throw error;
  }
}

/**
 * Parse chart command from text
 * Examples:
 * - "/chart btc" -> { symbol: "btc", exchange: "bitkub", type: "line" }
 * - "/chart btc binance" -> { symbol: "btc", exchange: "binance", type: "line" }
 * - "/chart btc compare" -> { symbol: "btc", type: "comparison" }
 */
export function parseChartCommand(text: string): ChartCommandParams | null {
  const parts = text
    .toLowerCase()
    .split(" ")
    .filter((part) => part.length > 0);
  console.log("🚀 ~ parseChartCommand ~ parts:", parts);

  if (parts.length < 2 || (parts[0] !== "chart" && parts[0] !== "/chart")) {
    return null;
  }

  const symbol = parts[1];
  if (!symbol) return null;

  let exchange: string = "bitkub";
  let type: "line" | "comparison" = "line";

  // Check for exchange or type in remaining parts
  for (let i = 2; i < parts.length; i++) {
    const part = parts[i];

    if (!part) continue;

    // Check for comparison type
    if (part === "compare" || part === "comparison") {
      type = "comparison";
    }
    // Check for exchange names
    else if (["bitkub", "bk", "binance", "bn", "satang", "st"].includes(part)) {
      exchange =
        part === "bk"
          ? "bitkub"
          : part === "bn"
            ? "binance"
            : part === "st"
              ? "satang"
              : part;
    }
  }

  return { symbol, exchange, type };
}

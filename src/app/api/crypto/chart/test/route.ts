import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") || "BTC";
    const exchange = searchParams.get("exchange") || "bitkub";

    // Mock crypto data for testing
    const mockCryptoData = {
      exchange: exchange,
      exchangeLogoUrl: "https://example.com/logo.png",
      textColor: "#ffffff",
      currencyName: symbol.toUpperCase(),
      lastPrice: "1500000.00",
      highPrice: "1600000.00",
      lowPrice: "1400000.00",
      changePrice: "+50000.00",
      changePriceOriginal: 3.45,
      urlLogo: "https://example.com/btc.png",
      volume_24h: "100000000",
      volume_change_24h: "2.5",
      market_cap: "30000000000",
      last_updated: new Date().toISOString(),
      priceChangeColor: "#10b981",
      cmc_rank: "1",
    };

    return NextResponse.json({
      message: "Chart generation test endpoint",
      data: mockCryptoData,
      chartUrl: `/api/crypto/chart?symbol=${symbol}&exchange=${exchange}`,
      note: "This is a test endpoint. The actual chart generation requires canvas library setup.",
    });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    return NextResponse.json(
      { error: "Test endpoint failed" },
      { status: 500 },
    );
  }
}

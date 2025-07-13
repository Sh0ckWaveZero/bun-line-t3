export interface ChartCommandParams {
  symbol: string;
  exchange: string;
  type: "line" | "comparison";
}

export class ChartParser {
  /**
   * Parse chart command from text
   * Examples:
   * - "/chart btc" -> { symbol: "btc", exchange: "bitkub", type: "line" }
   * - "/chart btc binance" -> { symbol: "btc", exchange: "binance", type: "line" }
   * - "/chart btc compare" -> { symbol: "btc", type: "comparison" }
   */
  static parseCommand(text: string): ChartCommandParams | null {
    const parts = text
      .toLowerCase()
      .split(" ")
      .filter((part) => part.length > 0);

    console.log("🚀 ChartParser ~ parseCommand ~ parts:", parts);
    console.log("🚀 ChartParser ~ parseCommand ~ original text:", text);

    // Check for both "chart" and "/chart" since handleText removes the "/"
    if (parts.length < 2 || !["chart", "/chart"].includes(parts[0] || "")) {
      console.log("❌ ChartParser parseCommand failed - invalid command or insufficient parts");
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
      else if (this.isValidExchange(part)) {
        exchange = this.normalizeExchangeName(part);
      }
    }

    const result = { symbol, exchange, type };
    console.log("✅ ChartParser parseCommand success:", result);
    return result;
  }

  private static isValidExchange(exchange: string): boolean {
    const validExchanges = [
      "bitkub", "bk", 
      "binance", "bn", 
      "satang", "st",
      "bitazza", "btz",
      "gate", "gateio",
      "mexc", "mx",
      "cmc", "coinmarketcap"
    ];
    return validExchanges.includes(exchange);
  }

  private static normalizeExchangeName(exchange: string): string {
    const exchangeMap: Record<string, string> = {
      "bk": "bitkub",
      "bn": "binance",
      "st": "satang",
      "btz": "bitazza",
      "gateio": "gate",
      "mx": "mexc",
      "coinmarketcap": "cmc"
    };

    return exchangeMap[exchange] || exchange;
  }
}
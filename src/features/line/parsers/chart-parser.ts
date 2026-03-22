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
   * - "/chart bn btc" -> { symbol: "btc", exchange: "binance", type: "line" }
   * - "/chart btc binance" -> { symbol: "btc", exchange: "binance", type: "line" }
   * - "/chart btc compare" -> { symbol: "btc", type: "comparison" }
   * - "/c bn btc" -> { symbol: "btc", exchange: "binance", type: "line" }
   */
  static parseCommand(text: string): ChartCommandParams | null {
    const parts = text
      .toLowerCase()
      .split(" ")
      .filter((part) => part.length > 0);

    // Check for chart command aliases
    const chartAliases = ["chart", "/chart", "c", "/c"];
    if (parts.length < 2 || !chartAliases.includes(parts[0] || "")) {
      return null;
    }

    let symbol: string;
    let exchange: string = "bitkub";
    let type: "line" | "comparison" = "line";

    // Check if second parameter is an exchange (new format: /chart [exchange] [symbol])
    if (
      parts.length >= 3 &&
      parts[1] &&
      parts[2] &&
      this.isValidExchange(parts[1])
    ) {
      exchange = this.normalizeExchangeName(parts[1]);
      symbol = parts[2];

      // Check for additional parameters (comparison, etc.)
      for (let i = 3; i < parts.length; i++) {
        const part = parts[i];
        if (part === "compare" || part === "comparison") {
          type = "comparison";
        }
      }
    } else {
      // Original format: /chart [symbol] [exchange]
      symbol = parts[1] || "";
      if (!symbol) return null;

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
    }

    return { symbol, exchange, type };
  }

  private static isValidExchange(exchange: string): boolean {
    const validExchanges = [
      "bitkub",
      "bk",
      "binance",
      "bn",
      "satang",
      "st",
      "bitazza",
      "btz",
      "gate",
      "gateio",
      "mexc",
      "mx",
      "cmc",
      "coinmarketcap",
    ];
    return validExchanges.includes(exchange);
  }

  private static normalizeExchangeName(exchange: string): string {
    const exchangeMap: Record<string, string> = {
      bk: "bitkub",
      bn: "binance",
      st: "satang",
      btz: "bitazza",
      gateio: "gate",
      mx: "mexc",
      coinmarketcap: "cmc",
    };

    return exchangeMap[exchange] || exchange;
  }
}

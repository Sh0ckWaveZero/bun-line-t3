import type { CryptoInfo } from "@/features/crypto/types/crypto.interface";
import type {
  ChartImageUrls,
  ChartMarketStats,
} from "@/features/crypto/services/chart.server";
import { CHART_PERIODS } from "@/features/crypto/constants/chart-periods";

export interface LineFlexMessage {
  type: "flex";
  altText: string;
  contents: {
    type: "carousel";
    contents: any[];
  };
}

export interface LineTextMessage {
  type: "text";
  text: string;
}

export class ChartTemplates {
  static createLoadingMessage(
    symbol: string,
    isComparison = false,
  ): LineTextMessage {
    const action = isComparison ? "เปรียบเทียบ" : "กราฟ";
    return {
      type: "text",
      text: `📊 กำลังสร้าง${action} ${symbol.toUpperCase()} กรุณารอสักครู่...`,
    };
  }

  static createNoDataMessage(symbol: string): LineTextMessage {
    return {
      type: "text",
      text: `❌ ไม่พบข้อมูลกราฟสำหรับ ${symbol.toUpperCase()}\n\n💡 เหรียญที่มีข้อมูล: BTC, ETH, ADA, XRP, DOT, SOL, AVAX, LINK\n\nลองใช้: /chart btc หรือ /chart eth`,
    };
  }

  static createChartErrorMessage(
    symbol: string,
    exchange: string,
  ): LineTextMessage {
    return {
      type: "text",
      text: `❌ สร้างกราฟ ${symbol.toUpperCase()} จาก ${exchange.toUpperCase()} ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง`,
    };
  }

  static createSingleChartCarousel(
    cryptoData: CryptoInfo,
    symbol: string,
    imageUrls: ChartImageUrls,
    marketStats: ChartMarketStats,
    exchange: string = "bitkub",
  ): LineFlexMessage {
    const currencySymbol =
      exchange.toLowerCase() === "binance" || exchange.toLowerCase() === "bn"
        ? "$"
        : "฿";
    const formatAmount = (amount: number, maximumFractionDigits = 2) =>
      amount.toLocaleString("th-TH", { maximumFractionDigits });
    const isPositive = marketStats.changePercent >= 0;
    const createStat = (label: string, amount: number) => ({
      type: "box",
      layout: "vertical",
      flex: 1,
      spacing: "xs",
      contents: [
        {
          type: "text",
          text: label,
          size: "sm",
          color: "#c4ccd7",
          wrap: true,
        },
        {
          type: "text",
          text: `${currencySymbol}${formatAmount(amount)}`,
          size: "sm",
          color: "#f3f4f6",
          weight: "bold",
          wrap: false,
        },
      ],
    });
    const chartBubble = {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: imageUrls.previewUrl,
            size: "full",
            aspectMode: "fit",
            aspectRatio: "16:9",
            backgroundColor: "#111827",
            gravity: "center",
            action: {
              type: "uri",
              uri: imageUrls.originalUrl,
            },
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `${cryptoData.currencyName || symbol.toUpperCase()}`,
                size: "xl",
                color: "#ffffff",
                weight: "bold",
                wrap: true,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: `${exchange.toLowerCase() === "binance" || exchange.toLowerCase() === "bn" ? "$" : "฿"}${(
                      cryptoData.lastPriceRaw || 0
                    ).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}`,
                    color: "#f3f4f6",
                    size: "xxl",
                    weight: "bold",
                    wrap: true,
                  },
                ],
                margin: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: `${isPositive ? "ขึ้น" : "ลง"} ${isPositive ? "+" : ""}${marketStats.changePercent.toFixed(2)}%`,
                    size: "sm",
                    color: isPositive ? "#4ade80" : "#fca5a5",
                    weight: "bold",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: `ใน ${marketStats.periodLabel}`,
                    size: "sm",
                    color: "#c4ccd7",
                    margin: "sm",
                    flex: 0,
                  },
                ],
                backgroundColor: isPositive ? "#153b2f" : "#472a31",
                cornerRadius: "8px",
                paddingAll: "8px",
                margin: "md",
              },
              {
                type: "separator",
                color: "#465261",
                margin: "lg",
              },
              {
                type: "text",
                text: `ช่วงราคา · ${marketStats.periodLabel}`,
                size: "sm",
                color: "#e5e7eb",
                weight: "bold",
                margin: "lg",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  createStat("สูงสุด", marketStats.high),
                  createStat("ต่ำสุด", marketStats.low),
                ],
                spacing: "md",
                margin: "sm",
              },
              {
                type: "text",
                text: `แท่งล่าสุด · ${CHART_PERIODS[marketStats.period].candleLabel}`,
                size: "sm",
                color: "#e5e7eb",
                weight: "bold",
                margin: "lg",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  createStat("เปิด", marketStats.latestCandle.open),
                  createStat("สูงสุด", marketStats.latestCandle.high),
                ],
                spacing: "md",
                margin: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  createStat("ต่ำสุด", marketStats.latestCandle.low),
                  createStat("ปิด", marketStats.latestCandle.close),
                ],
                spacing: "md",
                margin: "sm",
              },
              {
                type: "separator",
                color: "#465261",
                margin: "lg",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: `ปริมาณรวม · ${marketStats.periodLabel}`,
                    size: "sm",
                    color: "#c4ccd7",
                    flex: 1,
                    wrap: true,
                  },
                  {
                    type: "text",
                    text: `${formatAmount(marketStats.totalVolume, 4)} ${symbol.toUpperCase()}`,
                    size: "sm",
                    color: "#f3f4f6",
                    weight: "bold",
                    align: "end",
                    flex: 0,
                    wrap: true,
                  },
                ],
                margin: "md",
              },
              {
                type: "text",
                text: "แท่งเขียว: ปิดสูงกว่าเปิด · แดง: ปิดต่ำกว่าเปิด",
                size: "sm",
                color: "#c4ccd7",
                wrap: true,
                margin: "md",
              },
              {
                type: "text",
                text: `ดูช่วงอื่น: /c bk ${symbol.toLowerCase()} 7d`,
                size: "xs",
                color: "#aab4c2",
                wrap: true,
                margin: "sm",
              },
              this.createViewFullChartButton(imageUrls.originalUrl),
            ],
            backgroundColor: "#1f2937",
            paddingAll: "20px",
          },
        ],
        paddingAll: "0px",
        spacing: "none",
      },
    };

    return {
      type: "flex",
      altText: `กราฟ ${symbol.toUpperCase()} · ${marketStats.periodLabel} · สูงสุด ${formatAmount(marketStats.high)} · ต่ำสุด ${formatAmount(marketStats.low)}`,
      contents: {
        type: "carousel",
        contents: [chartBubble],
      },
    };
  }

  static createComparisonChartCarousel(
    symbol: string,
    imageUrls: ChartImageUrls,
    _logoUrl?: string,
  ): LineFlexMessage {
    const comparisonBubbles = [
      {
        type: "bubble",
        size: "giga",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "image",
              url: imageUrls.previewUrl,
              size: "full",
              aspectMode: "fit",
              aspectRatio: "16:9",
              backgroundColor: "#111827",
              gravity: "center",
              action: {
                type: "uri",
                uri: imageUrls.originalUrl,
              },
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: `${symbol.toUpperCase()} เปรียบเทียบ`,
                  size: "xl",
                  color: "#ffffff",
                  weight: "bold",
                },
                this.createViewFullChartButton(imageUrls.originalUrl),
              ],
              backgroundColor: "#1f2937",
              paddingAll: "20px",
            },
          ],
          paddingAll: "0px",
          spacing: "none",
        },
      },
      {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `📊 ข้อมูลการเปรียบเทียบ`,
              weight: "bold",
              size: "lg",
              color: "#333333",
            },
            {
              type: "separator",
              margin: "md",
            },
            {
              type: "box",
              layout: "vertical",
              margin: "md",
              contents: [
                {
                  type: "text",
                  text: `• Bitkub`,
                  size: "sm",
                  color: "#666666",
                },
                {
                  type: "text",
                  text: `• Binance`,
                  size: "sm",
                  color: "#666666",
                  margin: "xs",
                },
                {
                  type: "text",
                  text: `• Satang Corp`,
                  size: "sm",
                  color: "#666666",
                  margin: "xs",
                },
                {
                  type: "text",
                  text: `🕰️ ข้อมูล 24 ชั่วโมง`,
                  size: "xs",
                  color: "#999999",
                  margin: "md",
                },
              ],
            },
          ],
        },
      },
    ];

    return {
      type: "flex",
      altText: `📊 ${symbol.toUpperCase()} Comparison Chart`,
      contents: {
        type: "carousel",
        contents: comparisonBubbles,
      },
    };
  }

  static createErrorFallbackMessage(
    symbol: string,
    cryptoData: CryptoInfo,
    exchange: string = "bitkub",
  ): LineTextMessage {
    const currencySymbol =
      exchange.toLowerCase() === "binance" || exchange.toLowerCase() === "bn"
        ? "$"
        : "฿";
    return {
      type: "text",
      text: `⚠️ กราฟ ${symbol.toUpperCase()} ถูกสร้างแล้ว แต่ไม่สามารถส่งรูปภาพได้\n\n📊 ข้อมูลล่าสุด:\n• ชื่อ: ${cryptoData.currencyName}\n• ราคา: ${currencySymbol}${(cryptoData.lastPriceRaw || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 8 })}\n• เปลี่ยนแปลง: ${(cryptoData.changePriceOriginal || 0) >= 0 ? "+" : ""}${(cryptoData.changePriceOriginal || 0).toFixed(2)}%\n\n🔄 ลองใหม่: /chart ${symbol.toLowerCase()}`,
    };
  }

  private static createViewFullChartButton(originalUrl: string) {
    return {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "filler",
        },
        {
          type: "box",
          layout: "baseline",
          contents: [
            {
              type: "filler",
            },
            {
              type: "text",
              text: "🔍 ดูกราฟขนาดใหญ่",
              color: "#ffffff",
              flex: 0,
              offsetTop: "-2px",
              action: {
                type: "uri",
                uri: originalUrl,
              },
            },
            {
              type: "filler",
            },
          ],
          spacing: "sm",
        },
        {
          type: "filler",
        },
      ],
      borderWidth: "1px",
      cornerRadius: "4px",
      spacing: "sm",
      borderColor: "#ffffff",
      margin: "lg",
      height: "44px",
    };
  }
}

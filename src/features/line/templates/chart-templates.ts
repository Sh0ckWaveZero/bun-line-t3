import { CryptoInfo } from "@/features/crypto/types/crypto.interface";
import { ChartImageUrls } from "@/features/crypto/services/chart";

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
  static createLoadingMessage(symbol: string, isComparison = false): LineTextMessage {
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

  static createSingleChartCarousel(
    cryptoData: CryptoInfo,
    symbol: string,
    imageUrls: ChartImageUrls,
  ): LineFlexMessage {
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
            aspectMode: "cover",
            aspectRatio: "2:3",
            gravity: "top",
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
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: `${cryptoData.currencyName || symbol.toUpperCase()}`,
                    size: "xl",
                    color: "#ffffff",
                    weight: "bold",
                  },
                ],
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  {
                    type: "text",
                    text: `฿${(cryptoData.lastPriceRaw || 0).toLocaleString("th-TH", { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 8 
                    })}`,
                    color: "#ebebeb",
                    size: "lg",
                    weight: "bold",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: `${(cryptoData.changePriceOriginal || 0) >= 0 ? "+" : ""}${(cryptoData.changePriceOriginal || 0).toFixed(2)}%`,
                    color: (cryptoData.changePriceOriginal || 0) >= 0 ? "#00FF88cc" : "#FF4444cc",
                    gravity: "bottom",
                    flex: 0,
                    size: "sm",
                    weight: "bold",
                  },
                ],
                spacing: "lg",
              },
              this.createViewFullChartButton(imageUrls.originalUrl),
            ],
            position: "absolute",
            offsetBottom: "0px",
            offsetStart: "0px",
            offsetEnd: "0px",
            backgroundColor: "#1DB446cc",
            paddingAll: "20px",
            paddingTop: "18px",
          },
          this.createChartIcon(cryptoData.urlLogo),
        ],
        paddingAll: "0px",
      },
    };

    return {
      type: "flex",
      altText: `📊 ${symbol.toUpperCase()} Chart & Data`,
      contents: {
        type: "carousel",
        contents: [chartBubble],
      },
    };
  }

  static createComparisonChartCarousel(
    symbol: string,
    imageUrls: ChartImageUrls,
    logoUrl?: string,
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
              aspectMode: "cover",
              aspectRatio: "2:3",
              gravity: "top",
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
                  ],
                },
                this.createViewFullChartButton(imageUrls.originalUrl),
              ],
              position: "absolute",
              offsetBottom: "0px",
              offsetStart: "0px",
              offsetEnd: "0px",
              backgroundColor: "#1DB446cc",
              paddingAll: "20px",
              paddingTop: "18px",
            },
            this.createChartIcon(logoUrl),
          ],
          paddingAll: "0px",
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
  ): LineTextMessage {
    return {
      type: "text",
      text: `⚠️ กราฟ ${symbol.toUpperCase()} ถูกสร้างแล้ว แต่ไม่สามารถส่งรูปภาพได้\n\n📊 ข้อมูลล่าสุด:\n• ชื่อ: ${cryptoData.currencyName}\n• ราคา: ฿${(cryptoData.lastPriceRaw || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 8 })}\n• เปลี่ยนแปลง: ${(cryptoData.changePriceOriginal || 0) >= 0 ? "+" : ""}${(cryptoData.changePriceOriginal || 0).toFixed(2)}%\n\n🔄 ลองใหม่: /chart ${symbol.toLowerCase()}`,
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
      margin: "xxl",
      height: "40px",
    };
  }

  private static createChartIcon(logoUrl?: string) {
    if (logoUrl) {
      return {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: logoUrl,
            size: "full",
            aspectMode: "cover",
          },
        ],
        position: "absolute",
        cornerRadius: "20px",
        offsetTop: "18px",
        backgroundColor: "#ffffff",
        offsetStart: "18px",
        height: "35px",
        width: "35px",
      };
    }
    
    return {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "📊",
          color: "#ffffff",
          align: "center",
          size: "xs",
          offsetTop: "3px",
        },
      ],
      position: "absolute",
      cornerRadius: "20px",
      offsetTop: "18px",
      backgroundColor: "#1DB446",
      offsetStart: "18px",
      height: "25px",
      width: "35px",
    };
  }
}
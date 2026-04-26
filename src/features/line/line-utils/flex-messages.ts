/**
 * LINE Flex Message Templates for DCA (Dollar Cost Averaging)
 *
 * เอกสารอ้างอิง: https://developers.line.biz/en/reference/messaging-api/#flex-message
 */

interface DcaSummaryData {
  totalSpentTHB: number;
  totalBTC: number;
  totalRounds: number;
  averagePrice: number;
  currentPrice: number | null;
  pnlPercent: number | null;
  pnlValue: number | null;
  lastOrder?: {
    round: number;
    amountTHB: number;
    coinReceived: number;
    coin: string;
    executedAt: Date;
  };
}

const formatTHB = (n: number) =>
  n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
    hour12: false,
  }).format(date);

const getDcaHistoryUrl = (appUrl: string) => {
  if (!appUrl) return null;

  try {
    return new URL("/dca-history", appUrl).toString();
  } catch {
    return null;
  }
};

const createMetricRow = (label: string, value: string) => ({
  type: "box",
  layout: "horizontal",
  contents: [
    {
      type: "text",
      text: label,
      color: "#6B7280",
      size: "sm",
      flex: 2,
    },
    {
      type: "text",
      text: value,
      color: "#111827",
      size: "sm",
      weight: "bold",
      align: "end",
      flex: 3,
      wrap: true,
    },
  ],
  spacing: "sm",
});

/**
 * สร้าง Flex Message สำหรับแสดงสรุป DCA พร้อม PnL
 */
export function createDcaSummaryFlexMessage(
  data: DcaSummaryData,
  appUrl: string,
): {
  type: "flex";
  altText: string;
  contents: any;
} {
  const isProfit = data.pnlPercent !== null && data.pnlPercent >= 0;
  const hasPnL = data.pnlPercent !== null && data.pnlValue !== null;
  const pnlColor = isProfit ? "#059669" : "#DC2626";
  const pnlSign = isProfit ? "+" : "";
  const dcaHistoryUrl = getDcaHistoryUrl(appUrl);

  const bodyContents: any[] = [];

  if (hasPnL) {
    bodyContents.push(
      createMetricRow("PnL", `${pnlSign}${data.pnlPercent!.toFixed(2)}%`),
      createMetricRow("มูลค่า", `${pnlSign}${formatTHB(data.pnlValue!)} บาท`),
    );

    bodyContents[0].contents[1].color = pnlColor;
    bodyContents[1].contents[1].color = pnlColor;
  } else {
    bodyContents.push(createMetricRow("PnL", "ไม่พบข้อมูลราคา"));
  }

  if (data.currentPrice !== null) {
    bodyContents.push(
      { type: "separator", margin: "md" },
      createMetricRow("ราคาปัจจุบัน", `${formatTHB(data.currentPrice)} ฿`),
      createMetricRow("ราคาเฉลี่ย", `${formatTHB(data.averagePrice)} ฿`),
    );
  }

  bodyContents.push(
    { type: "separator", margin: "md" },
    createMetricRow("ลงทุนรวม", `${formatTHB(data.totalSpentTHB)} บาท`),
    createMetricRow("BTC สะสม", `${data.totalBTC.toFixed(8)} BTC`),
    createMetricRow("จำนวนรอบ", `${data.totalRounds} รอบ`),
  );

  const footerContents: any[] = [];

  if (data.lastOrder) {
    footerContents.push(
      { type: "separator", margin: "sm" },
      {
        type: "text",
        text: "รายการล่าสุด",
        color: "#6B7280",
        size: "xs",
        margin: "md",
      },
      createMetricRow("รอบ", `${data.lastOrder.round}`),
      createMetricRow("เงิน", `${formatTHB(data.lastOrder.amountTHB)} บาท`),
      createMetricRow(
        "ได้รับ",
        `${data.lastOrder.coinReceived.toFixed(8)} ${data.lastOrder.coin}`,
      ),
      {
        type: "text",
        text: formatDate(new Date(data.lastOrder.executedAt)),
        color: "#6B7280",
        size: "xs",
        align: "end",
        margin: "xs",
      },
    );
  }

  if (dcaHistoryUrl) {
    footerContents.push({
      type: "button",
      action: {
        type: "uri",
        label: "ดูรายละเอียด",
        uri: dcaHistoryUrl,
      },
      style: "primary",
      color: "#F59E0B",
      margin: "md",
    });
  }

  return {
    type: "flex",
    altText: `สรุป Auto DCA ${
      hasPnL ? `${pnlSign}${data.pnlPercent!.toFixed(2)}%` : ""
    }`.trim(),
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "สรุป Auto DCA",
            weight: "bold",
            color: "#111827",
            size: "xl",
          },
        ],
        paddingAll: "lg",
        paddingBottom: "sm",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents,
        paddingAll: "lg",
        paddingTop: "sm",
        spacing: "md",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents:
          footerContents.length > 0
            ? footerContents
            : [
                {
                  type: "text",
                  text: "พิมพ์ /dca help เพื่อดูคำสั่งทั้งหมด",
                  color: "#6B7280",
                  size: "xs",
                  wrap: true,
                },
              ],
        paddingAll: "lg",
        paddingTop: "sm",
        spacing: "sm",
      },
    },
  };
}

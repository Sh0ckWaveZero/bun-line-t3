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

const DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
  hour12: false,
});

const formatDate = (date: Date) => DATE_FORMATTER.format(date);

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

interface DcaBalanceAlertData {
  thbAvailable: number;
  threshold: number;
}

interface WeighInData {
  profileName: string | null;
  weightKg: number;
  impedance: number | null;
  measuredAt: Date;
  deltaKg: number | null;
  metrics: {
    bmi?: number;
    bodyFat?: number;
    muscleMass?: number;
  } | null;
}

const formatKg = (n: number) =>
  n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getBodyWeightUrl = (appUrl: string) => {
  if (!appUrl) return null;

  try {
    return new URL("/body-weight", appUrl).toString();
  } catch {
    return null;
  }
};

/**
 * ม่วง "T3" ของโลโก้ (hsl(280,100%,70%) = #cc66ff) ผสมดำ 75% ให้ตัวอักษรขาว
 * บนปุ่มผ่าน contrast (5.04:1) — LINE Flex รับเฉพาะ hex
 */
const WEIGH_IN_THEME_COLOR = "#994dbf";

/**
 * สร้าง Flex Message แจ้งผลชั่งน้ำหนักใหม่จากตาชั่ง Mi Body Composition Scale 2
 */
export function createWeighInFlexMessage(
  data: WeighInData,
  appUrl: string,
): {
  type: "flex";
  altText: string;
  contents: any;
} {
  const hasMetrics = data.metrics?.bodyFat != null;
  const delta =
    data.deltaKg === null
      ? null
      : `${data.deltaKg >= 0 ? "+" : "−"}${formatKg(Math.abs(data.deltaKg))} กก.`;

  const bodyContents: any[] = [];
  if (delta !== null) {
    bodyContents.push(createMetricRow("เทียบครั้งก่อน", delta));
  }
  if (hasMetrics) {
    bodyContents.push(
      createMetricRow("ไขมัน", `${data.metrics!.bodyFat!.toFixed(1)}%`),
      createMetricRow(
        "กล้ามเนื้อ",
        `${formatKg(data.metrics!.muscleMass ?? 0)} กก.`,
      ),
      createMetricRow("BMI", `${(data.metrics!.bmi ?? 0).toFixed(1)}`),
    );
  }
  if (data.impedance) {
    bodyContents.push(createMetricRow("ความต้านทาน", `${data.impedance} Ω`));
  }
  if (bodyContents.length > 0) {
    bodyContents.unshift({ type: "separator", margin: "md" });
  }

  const bodyWeightUrl = getBodyWeightUrl(appUrl);
  const title = data.profileName
    ? `⚖️ บันทึกน้ำหนัก · ${data.profileName}`
    : "⚖️ บันทึกน้ำหนัก";

  return {
    type: "flex",
    altText: `${title}: ${formatKg(data.weightKg)} กก.${
      delta !== null ? ` (${delta})` : ""
    }`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            color: "#111827",
            size: "lg",
            wrap: true,
          },
        ],
        paddingAll: "lg",
        paddingBottom: "sm",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `${formatKg(data.weightKg)} กก.`,
            weight: "bold",
            color: "#111827",
            size: "3xl",
          },
          {
            type: "text",
            text: new Intl.DateTimeFormat("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Bangkok",
              hour12: false,
            }).format(data.measuredAt),
            color: "#6B7280",
            size: "xs",
            margin: "sm",
          },
          ...bodyContents,
        ],
        paddingAll: "lg",
        paddingTop: "sm",
        spacing: "md",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: bodyWeightUrl
          ? [
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "ดูประวัติการชั่ง",
                  uri: bodyWeightUrl,
                },
                style: "primary",
                color: WEIGH_IN_THEME_COLOR,
              },
            ]
          : [
              {
                type: "text",
                text: "ขึ้นชั่งแบบเท้าเปล่าเพื่อวัดสัดส่วนร่างกายครบถ้วน 🙏",
                color: "#6B7280",
                size: "xs",
                wrap: true,
              },
            ],
        paddingAll: "lg",
        paddingTop: "sm",
      },
    },
  };
}

/**
 * สร้าง Flex Message แจ้งเตือนเงินทุน DCA เมื่อเงินบาทใน Bitkub ต่ำกว่าเกณฑ์
 */
export function createDcaBalanceAlertFlexMessage(
  data: DcaBalanceAlertData,
  appUrl: string,
): {
  type: "flex";
  altText: string;
  contents: any;
} {
  const bodyContents: any[] = [
    createMetricRow("เกณฑ์ขั้นต่ำ", `${formatTHB(data.threshold)} บาท`),
    createMetricRow("คงเหลือใช้ได้", `${formatTHB(data.thbAvailable)} บาท`),
    { type: "separator", margin: "md" },
    createMetricRow("รอบซื้อถัดไป", "รอเติมเงิน"),
  ];
  // ยอดคงเหลือเป็นสีแดงเพื่อสื่อว่าต่ำกว่าเกณฑ์
  bodyContents[1].contents[1].color = "#DC2626";

  const dcaHistoryUrl = getDcaHistoryUrl(appUrl);

  return {
    type: "flex",
    altText: `แจ้งเตือนเงินทุน DCA: เงินบาทคงเหลือ ${formatTHB(
      data.thbAvailable,
    )} บาท ต่ำกว่าเกณฑ์ ${formatTHB(data.threshold)} บาท`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "💰 แจ้งเตือนเงินทุน DCA",
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
        contents: dcaHistoryUrl
          ? [
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "ดูรายละเอียด",
                  uri: dcaHistoryUrl,
                },
                style: "primary",
                color: "#F59E0B",
              },
            ]
          : [
              {
                type: "text",
                text: "เติมเงินเพื่อรอบซื้อถัดไปได้แล้ว 🙏",
                color: "#6B7280",
                size: "xs",
                wrap: true,
              },
            ],
        paddingAll: "lg",
        paddingTop: "sm",
      },
    },
  };
}

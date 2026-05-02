import { CryptoInfo } from "@/features/crypto/types/crypto.interface";
import randomColor from "./randomColor";
import { utils } from ".";
import { IMAGE_GOLD_URLS, IMAGE_URLS } from "@/lib/constants/common.constant";
import { env } from "process";
import { formatHours, formatPercentage } from "@/lib/utils/number";
import { AttendanceStatusType } from "@prisma/client";
import { timeBasedSelect } from "@/lib/utils/safe-random";

const lottery = (infoItems: any[]) => {
  return infoItems.map((item) => {
    return {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "image",
                url: `${item.image}`,
                size: "full",
                aspectMode: "cover",
                aspectRatio: "4:3",
                gravity: "center",
                flex: 0,
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "ผลการตรวจรางวัล",
                    size: "xs",
                    color: "#ffffff",
                    align: "center",
                    gravity: "center",
                    flex: 0,
                  },
                ],
                backgroundColor: "#cc66ff",
                paddingAll: "2px",
                paddingStart: "4px",
                paddingEnd: "4px",
                position: "absolute",
                offsetStart: "18px",
                offsetTop: "18px",
                cornerRadius: "8px",
                height: "25px",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: `${item.value}`,
                    size: "4xl",
                    color: "#ffffff",
                    align: "center",
                    gravity: "center",
                    flex: 0,
                  },
                ],
                paddingAll: "2px",
                paddingStart: "4px",
                paddingEnd: "4px",
                position: "absolute",
                offsetStart: "60px",
                offsetTop: "90px",
                height: "70px",
                cornerRadius: "8px",
                background: {
                  type: "linearGradient",
                  angle: "0deg",
                  startColor: "#cc66ff",
                  endColor: "#15162c",
                },
              },
            ],
          },
        ],
        paddingAll: "0px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
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
                    contents: [],
                    size: "xl",
                    wrap: true,
                    flex: 0,
                    text: "ประจำงวด",
                    color: "#ffffff",
                    weight: "bold",
                  },
                  {
                    type: "text",
                    text: `${item.lottoAt}`,
                    color: "#ffffffcc",
                    size: "sm",
                  },
                ],
                spacing: "sm",
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
                        contents: [],
                        size: "md",
                        wrap: true,
                        flex: 0,
                        margin: "xs",
                        color: "#ffffffde",
                        text: `${item.name}`,
                        align: "center",
                      },
                    ],
                  },
                ],
                paddingAll: "13px",
                backgroundColor: "#ffffff1A",
                cornerRadius: "2px",
                margin: "xl",
              },
            ],
          },
        ],
        paddingAll: "30px",
        backgroundColor: "#7A8299",
      },
    };
  });
};

const cryptoCurrency = (data: CryptoInfo): any => {
  let bubbleMessageTpl = {};

  const boxOne = data.highPrice
    ? createBubbleBox("ราคาสูงสุด", data.highPrice)
    : createBubbleBox("ปริมาณ 24ชม.", data.volume_24h);

  const boxTwo = data.lowPrice
    ? createBubbleBox("ราคาต่ำสุด", data.lowPrice)
    : createBubbleBox("ลำดับที่", data.cmc_rank || "-");
  const boxThree = createBubbleBox(
    "ราคาเปลี่ยนแปลง",
    data.volume_change_24h,
    data.priceChangeColor,
  );

  const colorHeader = randomColor({
    luminosity: "bright",
    hue: "hsla",
  });

  bubbleMessageTpl = {
    type: "bubble",
    size: "giga",
    header: {
      type: "box",
      layout: "baseline",
      contents: [
        {
          type: "icon",
          url: `${data.urlLogo}`,
          size: "4xl",
        },
      ],
      justifyContent: "center",
      alignItems: "center",
      paddingAll: "lg",
      offsetTop: "lg",
    },
    hero: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `${data.currencyName}`,
          align: "center",
          size: "xxl",
          weight: "bold",
          color: "#FFFFFF",
        },
      ],
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "baseline",
          contents: [
            {
              type: "icon",
              url: `${data.exchangeLogoUrl}`,
              size: "lg",
            },
            {
              type: "text",
              text: `${data.exchange}`,
              weight: "bold",
              size: "lg",
              offsetTop: "-10.5%",
              color: `${data.textColor}`,
            },
          ],
          spacing: "md",
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "ราคาล่าสุด",
              size: "lg",
              color: "#8c8c8c",
              weight: "bold",
              margin: "md",
              flex: 0,
              align: "start",
            },
            {
              type: "text",
              text: `${data.lastPrice}`,
              align: "end",
              weight: "bold",
              size: "md",
            },
          ],
          justifyContent: "space-between",
        },
        boxOne,
        boxTwo,
        boxThree,
      ],
      spacing: "sm",
      paddingAll: "13px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "วันที่",
              size: "xs",
              color: "#aaaaaa",
              margin: "md",
              flex: 0,
              align: "start",
            },
            {
              type: "text",
              align: "end",
              size: "xs",
              text: `${data.last_updated}`,
              color: "#aaaaaa",
            },
          ],
          justifyContent: "space-between",
        },
      ],
    },
    styles: {
      header: {
        backgroundColor: colorHeader,
      },
      hero: {
        backgroundColor: colorHeader,
      },
      footer: {
        separator: true,
      },
    },
  };
  return bubbleMessageTpl;
};

const createBubbleBox = (
  text = "",
  value = "",
  priceChangeColor = "#454545",
): any => {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: `${text}`,
        size: "xs",
        color: "#8c8c8c",
        margin: "md",
        flex: 0,
        align: "start",
      },
      {
        type: "text",
        text: `${value}`,
        align: "end",
        size: "xs",
        color: `${priceChangeColor}`,
      },
    ],
    justifyContent: "space-between",
  };
};

const gold = (data: any): any => {
  let bubbleMessageTpl = {};
  const image1 = utils.randomItems(IMAGE_GOLD_URLS);
  const image2 = utils.randomItems(IMAGE_GOLD_URLS);
  const image3 = utils.randomItems(IMAGE_GOLD_URLS);
  bubbleMessageTpl = {
    type: "bubble",
    size: "giga",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "image",
              url: `${image1}`,
              size: "full",
              aspectMode: "cover",
              aspectRatio: "150:196",
              gravity: "center",
              flex: 1,
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "image",
                  url: `${image2}`,
                  size: "full",
                  aspectMode: "cover",
                  aspectRatio: "150:98",
                  gravity: "center",
                },
                {
                  type: "image",
                  url: `${image3}`,
                  size: "full",
                  aspectMode: "cover",
                  aspectRatio: "150:98",
                  gravity: "center",
                },
              ],
              flex: 1,
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "Gold",
                  size: "xs",
                  color: "#000000",
                  align: "center",
                  gravity: "center",
                },
              ],
              backgroundColor: "#FFD700",
              paddingAll: "2px",
              paddingStart: "4px",
              paddingEnd: "4px",
              flex: 0,
              position: "absolute",
              offsetStart: "18px",
              offsetTop: "18px",
              cornerRadius: "100px",
              width: "48px",
              height: "25px",
            },
          ],
        },
      ],
      paddingAll: "0px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
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
                  contents: [],
                  size: "xl",
                  wrap: true,
                  flex: 0,
                  text: "🏅 ราคาทองวันนี้",
                  color: "#ffffff",
                  weight: "bold",
                },
                {
                  type: "text",
                  text: "ความบริสุทธิ์ 96.5% ",
                  color: "#ffffffcc",
                  size: "sm",
                },
              ],
              spacing: "sm",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "ทองคำแท่ง",
                      size: "md",
                      weight: "bold",
                      offsetBottom: "none",
                    },
                  ],
                  paddingTop: "sm",
                  paddingBottom: "sm",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "รับซื้อ",
                      align: "start",
                    },
                    {
                      type: "text",
                      align: "end",
                      text: `${data.barSell}`,
                      color: `${data.barSellColor}`,
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "ขายออก",
                      align: "start",
                    },
                    {
                      type: "text",
                      align: "end",
                      text: `${data.barBuy}`,
                      color: `${data.barBuyColor}`,
                    },
                  ],
                },
              ],
              paddingAll: "10px",
              backgroundColor: "#FFD700",
              cornerRadius: "5px",
              margin: "xl",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "ทองรูปพรรณ",
                      size: "md",
                      weight: "bold",
                      offsetBottom: "none",
                    },
                  ],
                  paddingTop: "sm",
                  paddingBottom: "sm",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "รับซื้อ",
                      align: "start",
                    },
                    {
                      type: "text",
                      align: "end",
                      text: `${data.jewelrySell}`,
                      color: `${data.jewelrySellColor}`,
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "ขายออก",
                      align: "start",
                    },
                    {
                      type: "text",
                      align: "end",
                      text: `${data.jewelryBuy}`,
                      color: `${data.jewelryBuyColor}`,
                    },
                  ],
                },
              ],
              paddingAll: "10px",
              backgroundColor: "#FFD700",
              cornerRadius: "5px",
              margin: "xl",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "วันนี้",
                      color: `${data.changeColor}`,
                      align: "start",
                    },
                    {
                      type: "text",
                      text: `${data.change}`,
                      weight: "bold",
                      align: "end",
                      color: `${data.changeColor}`,
                    },
                  ],
                  paddingTop: "lg",
                  paddingEnd: "xs",
                },
              ],
              paddingAll: "md",
            },
          ],
        },
      ],
      paddingAll: "30px",
      backgroundColor: "#7A8299",
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: `${data.updateAt}`,
          align: "center",
          size: "xs",
        },
      ],
    },
  };
  return bubbleMessageTpl;
};

const gas = (data: {
  providerName?: string;
  gasPrice?: Array<{ name?: string; value?: string }>;
}) => {
  const provider = data.providerName?.trim() || "ราคาน้ำมัน";
  const prices = Array.isArray(data.gasPrice) ? data.gasPrice : [];

  const rows = prices.length
    ? prices.map((item) => ({
        type: "box",
        layout: "horizontal",
        margin: "sm",
        contents: [
          {
            type: "text",
            text: item.name?.trim() || "-",
            size: "sm",
            color: "#374151",
            wrap: true,
            flex: 3,
          },
          {
            type: "text",
            text: item.value?.trim() || "-",
            size: "sm",
            color: "#059669",
            align: "end",
            flex: 2,
          },
        ],
      }))
    : [
        {
          type: "text",
          text: "ไม่พบข้อมูลราคาน้ำมันจากผู้ให้บริการนี้",
          size: "sm",
          color: "#6b7280",
          wrap: true,
        },
      ];

  return {
    type: "bubble",
    size: "giga",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "⛽ ราคาน้ำมันล่าสุด",
          weight: "bold",
          size: "lg",
          color: "#ffffff",
          align: "center",
        },
        {
          type: "text",
          text: provider,
          size: "sm",
          color: "#dcfce7",
          align: "center",
          margin: "sm",
          wrap: true,
        },
      ],
      backgroundColor: "#0f766e",
      paddingAll: "20px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: rows,
      paddingAll: "20px",
      spacing: "xs",
    },
  };
};

const signIn = () => {
  const image = utils.randomItems(IMAGE_URLS);
  const bubble = [
    {
      type: "bubble",
      hero: {
        type: "image",
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
        url: `${image}`,
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: "TO THE MOON 🚀 🌕",
            wrap: true,
            weight: "bold",
            size: "md",
            color: "#B2A4FF",
          },
          {
            type: "box",
            layout: "baseline",
            contents: [
              {
                type: "text",
                text: "🫢 คุณยังไม่ได้ลงชื่อใช้งานหรือเซสชันหมด ช่วยลงชื่อเข้าใช้งานก่อนนะจ๊ะ",
                wrap: true,
                weight: "bold",
                size: "sm",
                flex: 0,
                margin: "none",
              },
            ],
            margin: "lg",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            action: {
              type: "uri",
              label: "🔑 เข้าสู่ระบบ ",
              uri: `${env.FRONTEND_URL}`,
            },
            color: "#14C38E",
          },
        ],
      },
    },
  ];
  return bubble;
};

const notFound = () => {
  return [
    {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: "https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif",
            size: "full",
            aspectMode: "cover",
            aspectRatio: "4:3",
            gravity: "top",
            animated: true,
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
                    text: "...ข่อยขอบอกอีหยั่งแน่",
                    size: "xl",
                    color: "#383E56",
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
                    text: "ตัวเจ้าเลือกเบิ่งมันบ่มีเด้อ!",
                    color: "#383E56",
                    size: "sm",
                    flex: 0,
                  },
                ],
                spacing: "lg",
              },
            ],
            position: "relative",
            offsetBottom: "0px",
            offsetStart: "0px",
            offsetEnd: "0px",
            backgroundColor: "#FABEA7",
            paddingAll: "30px",
            paddingTop: "18px",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "404",
                color: "#ffffff",
                align: "center",
                size: "xs",
                offsetTop: "3px",
                weight: "bold",
              },
            ],
            position: "absolute",
            cornerRadius: "20px",
            offsetTop: "18px",
            backgroundColor: "#ff334b",
            offsetStart: "18px",
            height: "25px",
            width: "53px",
          },
        ],
        paddingAll: "0px",
      },
    },
  ];
};

const workCheckIn = () => {
  return [
    {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "⏰ ระบบลงชื่อเข้างาน",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: "#7BB3A9",
        paddingAll: "30px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📅 วันนี้คุณพร้อมทำงานแล้วใช่ไหม?",
            weight: "bold",
            size: "lg",
            wrap: true,
            align: "center",
            margin: "md",
          },
          {
            type: "text",
            text: "นโยบายบริษัท: จันทร์-ศุกร์ เข้างาน 08:00-11:00 น.\nทำงาน 9 ชม./วัน (รวมพักกลางวัน 1 ชม.)",
            wrap: true,
            size: "sm",
            color: "#8A8A8A",
            align: "center",
            margin: "lg",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "กดปุ่มด้านล่างเพื่อลงชื่อเข้างาน\nระบบจะคำนวณเวลาเลิกงานให้อัตโนมัติ",
            wrap: true,
            size: "sm",
            color: "#8A8A8A",
            align: "center",
            margin: "lg",
          },
        ],
        paddingAll: "30px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            action: {
              type: "postback",
              label: "🟢 เข้างาน",
              data: "action=checkin",
            },
            color: "#7BB3A9",
            height: "md",
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "📊 ดูสถานะการทำงาน",
              data: "action=status",
            },
            height: "sm",
          },
        ],
        paddingAll: "30px",
      },
    },
  ];
};

import {
  formatThaiDate,
  formatTimeHM,
  calculateWorkDuration,
} from "@/lib/utils/thai-datetime";

const workCheckInSuccess = (checkInTime: Date, expectedCheckOutTime: Date) => {
  // ใช้ utilities สำหรับจัดการกับวันที่และเวลาไทย
  const checkInTimeStr = formatTimeHM(checkInTime);
  const checkOutTimeStr = formatTimeHM(expectedCheckOutTime);

  // สร้างวันที่ในรูปแบบไทย
  const dateStr = formatThaiDate(checkInTime);

  return [
    {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "✅ ลงชื่อเข้างานสำเร็จ",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: "#7BB3A9",
        paddingAll: "30px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `📅 ${dateStr}`,
            weight: "bold",
            size: "md",
            wrap: true,
            align: "center",
            margin: "md",
            color: "#5A5A5A",
          },
          {
            type: "separator",
            margin: "xl",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xl",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🕐 เวลาเข้างาน:",
                    size: "sm",
                    color: "#777777",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: checkInTimeStr,
                    weight: "bold",
                    size: "sm",
                    color: "#7BB3A9",
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🕔 เวลาเลิกงาน (คาด):",
                    size: "sm",
                    color: "#777777",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: checkOutTimeStr,
                    weight: "bold",
                    size: "sm",
                    color: "#FFB366",
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "⏱️ ชั่วโมงทำงาน:",
                    size: "sm",
                    color: "#777777",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: "9 ชั่วโมง",
                    weight: "bold",
                    size: "sm",
                    color: "#6BB6FF",
                    align: "end",
                  },
                ],
              },
            ],
          },
        ],
        paddingAll: "30px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "🔴 ออกงาน",
              data: "action=checkout",
            },
            color: "#E57373",
          },
        ],
        paddingAll: "30px",
      },
    },
  ];
};

const workCheckInEarlySuccess = (
  actualCheckInTime: Date,
  recordedCheckInTime: Date,
  expectedCheckOutTime: Date,
) => {
  // ใช้ utilities สำหรับจัดการกับวันที่และเวลาไทย
  const actualTimeStr = formatTimeHM(actualCheckInTime);
  const recordedTimeStr = formatTimeHM(recordedCheckInTime);
  const checkOutTimeStr = formatTimeHM(expectedCheckOutTime);

  // สร้างวันที่ในรูปแบบไทย
  const dateStr = formatThaiDate(actualCheckInTime);

  return [
    {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "⏰ ลงชื่อเข้างานเร็ว",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: "#FFB366",
        paddingAll: "30px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: dateStr,
            size: "sm",
            color: "#8A8A8A",
            align: "center",
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🚪 มาถึงสำนักงาน:",
                    size: "sm",
                    color: "#777777",
                    flex: 3,
                  },
                  {
                    type: "text",
                    text: `${actualTimeStr} น.`,
                    size: "sm",
                    weight: "bold",
                    color: "#FFB366",
                    flex: 2,
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "⏰ เริ่มนับเวลาทำงาน:",
                    size: "sm",
                    color: "#777777",
                    flex: 3,
                  },
                  {
                    type: "text",
                    text: `${recordedTimeStr} น.`,
                    size: "sm",
                    weight: "bold",
                    color: "#7BB3A9",
                    flex: 2,
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🏁 เลิกงาน:",
                    size: "sm",
                    color: "#777777",
                    flex: 3,
                  },
                  {
                    type: "text",
                    text: `${checkOutTimeStr} น.`,
                    size: "sm",
                    weight: "bold",
                    color: "#6BB6FF",
                    flex: 2,
                    align: "end",
                  },
                ],
              },
            ],
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            backgroundColor: "#F5F5F5",
            cornerRadius: "8px",
            paddingAll: "12px",
            contents: [
              {
                type: "text",
                text: "📋 นโยบายบริษัท",
                size: "sm",
                weight: "bold",
                color: "#5A5A5A",
                align: "center",
              },
              {
                type: "text",
                text: "• การเข้างานก่อน 08:00 น. จะนับเวลาทำงานตั้งแต่ 08:00 น.",
                size: "xs",
                color: "#8A8A8A",
                wrap: true,
                flex: 0,
                margin: "sm",
              },
              {
                type: "text",
                text: "• ทำงาน 9 ชั่วโมง (รวมพักเที่ยง 1 ชั่วโมง)",
                size: "xs",
                color: "#8A8A8A",
                wrap: true,
                flex: 0,
              },
            ],
          },
        ],
        paddingAll: "30px",
      },
    },
  ];
};

/**
 * สร้าง content แสดงเวลาออกงาน หากมีการออกงานแล้ว
 * @param checkOutTime เวลาออกงาน
 * @returns array ของ component ที่แสดงเวลาออกงาน หรือ array ว่างถ้าไม่มีข้อมูล
 */
const createCheckOutTimeContent = (
  checkOutTime?: Date,
  isAutoCheckout: boolean = false,
): any[] => {
  if (!checkOutTime) return [];

  // คำนวณเวลาไทย (UTC+7) จาก UTC หรือใช้ formatTimeHM
  const checkOutTimeStr = formatTimeHM(checkOutTime);
  const timeLabel = isAutoCheckout ? "🕛 ออกงานอัตโนมัติ:" : "🕐 เวลาออกงาน:";
  const timeColor = isAutoCheckout ? "#FF9500" : "#7BB3A9";

  return [
    {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: timeLabel,
          size: "sm",
          color: "#777777",
          flex: 0,
        },
        {
          type: "text",
          text: checkOutTimeStr,
          weight: "bold",
          size: "sm",
          color: timeColor,
          align: "end",
        },
      ],
    },
  ];
};

/**
 * สร้าง bubble template สำหรับแสดงสถานะการทำงาน
 * @param attendance ข้อมูลการเข้างาน
 * @returns bubble template
 */
const workStatus = (attendance: any) => {
  // ใช้ utilities สำหรับจัดการกับวันที่และเวลาไทย
  const checkInTimeStr = formatTimeHM(attendance.checkInTime);

  // คำนวณเวลาออกงานที่คาดหวัง (+9 ชั่วโมง)
  const expectedCheckOutTime = new Date(
    attendance.checkInTime.getTime() + 9 * 60 * 60 * 1000,
  );
  const expectedCheckOutTimeStr = formatTimeHM(expectedCheckOutTime);

  // สร้างวันที่ในรูปแบบไทย
  const dateStr = formatThaiDate(attendance.checkInTime);

  const isCheckedOut =
    attendance.status === AttendanceStatusType.CHECKED_OUT ||
    attendance.status === AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT;
  const isAutoCheckout =
    attendance.status === AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT;

  let statusText: string;
  let statusColor: string;

  if (isAutoCheckout) {
    statusText = "🕛 ออกงานอัตโนมัติ";
    statusColor = "#FF9500"; // สีส้มสำหรับการออกงานอัตโนมัติ
  } else if (isCheckedOut) {
    statusText = "✅ ออกงานแล้ว";
    statusColor = "#7BB3A9";
  } else {
    statusText = "🟢 กำลังทำงาน";
    statusColor = "#FFB366";
  }

  // สร้าง content สำหรับแสดงเวลาออกงาน (ถ้ามี)
  const checkOutTimeContent =
    isCheckedOut && attendance.checkOutTime
      ? createCheckOutTimeContent(attendance.checkOutTime, isAutoCheckout)
      : [];

  return [
    {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📊 สถานะการทำงาน",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: statusColor,
        paddingAll: "30px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: statusText,
            weight: "bold",
            size: "lg",
            align: "center",
            margin: "md",
            color: statusColor,
          },
          {
            type: "text",
            text: `📅 ${dateStr}`,
            size: "sm",
            wrap: true,
            align: "center",
            color: "#8A8A8A",
          },
          {
            type: "separator",
            margin: "xl",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xl",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🕐 เวลาเข้างาน:",
                    size: "sm",
                    color: "#777777",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: checkInTimeStr,
                    weight: "bold",
                    size: "sm",
                    color: "#7BB3A9",
                    align: "end",
                  },
                ],
              },
              ...checkOutTimeContent,
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🕔 เวลาเลิกงาน (คาด):",
                    size: "sm",
                    color: "#777777",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: expectedCheckOutTimeStr,
                    weight: "bold",
                    size: "sm",
                    color: "#FFB366",
                    align: "end",
                  },
                ],
              },
            ],
          },
        ],
        paddingAll: "30px",
      },
      footer: !isCheckedOut
        ? {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                action: {
                  type: "postback",
                  label: "🔴 ออกงาน",
                  data: "action=checkout",
                },
                color: "#E57373",
              },
            ],
            paddingAll: "30px",
          }
        : undefined,
    },
  ];
};

/**
 * สร้าง bubble template สำหรับแสดงว่าได้ลงชื่อเข้างานไปแล้ว
 * @param checkInTime เวลาที่ลงชื่อเข้างาน
 * @returns bubble template
 */
const workAlreadyCheckedIn = (checkInTime: Date) => {
  return workStatus({
    checkInTime,
    status: AttendanceStatusType.CHECKED_IN_ON_TIME,
    checkOutTime: null,
  });
};

/**
 * สร้าง bubble template สำหรับการออกงานสำเร็จ
 * @param checkInTime เวลาที่ลงชื่อเข้างาน
 * @param checkOutTime เวลาที่ลงชื่อออกงาน
 * @returns bubble template
 */
const workCheckOutSuccess = (checkInTime: Date, checkOutTime: Date) => {
  // ใช้ utility functions สำหรับจัดการวันที่และเวลาไทย
  const checkInTimeStr = formatTimeHM(checkInTime);
  const checkOutTimeStr = formatTimeHM(checkOutTime);

  // สร้างวันที่ในรูปแบบไทย
  const dateStr = formatThaiDate(checkInTime);

  // คำนวณชั่วโมงการทำงานจริง
  const { hours: workHours, minutes: workMinutes } = calculateWorkDuration(
    checkInTime,
    checkOutTime,
  );

  return [
    {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "✅ ออกงานสำเร็จ",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: "#7BB3A9",
        paddingAll: "30px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `📅 ${dateStr}`,
            weight: "bold",
            size: "md",
            wrap: true,
            align: "center",
            margin: "md",
            color: "#5A5A5A",
          },
          {
            type: "text",
            text: "ขอบคุณสำหรับการทำงานวันนี้! 🎉",
            size: "sm",
            wrap: true,
            align: "center",
            color: "#8A8A8A",
          },
          {
            type: "separator",
            margin: "xl",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xl",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🕐 เวลาเข้างาน:",
                    size: "sm",
                    color: "#777777",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: checkInTimeStr,
                    weight: "bold",
                    size: "sm",
                    color: "#7BB3A9",
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🕔 เวลาออกงาน:",
                    size: "sm",
                    color: "#777777",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: checkOutTimeStr,
                    weight: "bold",
                    size: "sm",
                    color: "#7BB3A9",
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "⏱️ ชั่วโมงทำงาน:",
                    size: "sm",
                    color: "#777777",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: `${workHours} ชม. ${workMinutes} นาที`,
                    weight: "bold",
                    size: "sm",
                    color: "#6BB6FF",
                    align: "end",
                  },
                ],
              },
            ],
          },
        ],
        paddingAll: "30px",
      },
    },
  ];
};

/**
 * สร้าง bubble template สำหรับแสดงข้อผิดพลาด
 * @param message ข้อความแสดงข้อผิดพลาด
 * @returns bubble template
 */
const workError = (message: string) => {
  return [
    {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "⚠️ เกิดข้อผิดพลาด",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: "#E57373",
        paddingAll: "30px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: message,
            wrap: true,
            size: "md",
            align: "center",
            margin: "md",
            color: "#E57373",
          },
        ],
        paddingAll: "30px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "ลองใหม่",
              data: "action=checkin_menu",
            },
          },
        ],
        paddingAll: "30px",
      },
    },
  ];
};

/**
 * สร้าง bubble template สำหรับแสดงข้อผิดพลาดเกี่ยวกับการลา
 * @param message ข้อความแสดงข้อผิดพลาด
 * @returns bubble template
 */
const leaveError = (message: string) => {
  return [
    {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "⚠️ เกิดข้อผิดพลาดการลา",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: "#E57373",
        paddingAll: "30px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: message,
            wrap: true,
            size: "md",
            align: "center",
            margin: "md",
            color: "#E57373",
          },
        ],
        paddingAll: "30px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            action: {
              type: "uri",
              label: "เปิดหน้าลางาน",
              uri: `${env.APP_URL}/leave`,
            },
            color: "#5B7FD3",
          },
        ],
        paddingAll: "30px",
      },
    },
  ];
};

/**
 * สร้าง bubble template สำหรับเมนูรายงานรายเดือน
 * @returns bubble template
 */
const monthlyReportMenu = () => {
  return {
    type: "bubble",
    size: "giga",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "📊 รายงานการเข้างานรายเดือน",
          weight: "bold",
          size: "xl",
          color: "#ffffff",
        },
      ],
      backgroundColor: "#8B7FE5",
      paddingAll: "30px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "เลือกเดือนที่ต้องการดูรายงาน",
          size: "md",
          color: "#374151",
          margin: "md",
        },
        {
          type: "separator",
          margin: "xl",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              action: {
                type: "postback",
                label: "เดือนปัจจุบัน",
                data: "action=monthly_report&month=current",
              },
              style: "primary",
              color: "#8B7FE5",
              margin: "md",
            },
            {
              type: "button",
              action: {
                type: "postback",
                label: "เดือนที่แล้ว",
                data: "action=monthly_report&month=previous",
              },
              style: "secondary",
              margin: "md",
            },
            {
              type: "button",
              action: {
                type: "uri",
                label: "รายงานแบบละเอียดพร้อมกราฟ",
                uri: `${env.APP_URL}/attendance-report`,
              },
              style: "link",
              margin: "md",
              color: "#5FB691",
            },
          ],
          margin: "xl",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "สามารถดูรายงานย้อนหลังได้ที่เว็บไซต์",
          size: "xs",
          color: "#9ca3af",
          align: "center",
        },
      ],
      margin: "sm",
    },
  };
};

/**
 * สร้างส่วนหัวของ bubble เดือน
 * @param monthName ชื่อเดือนในรูปแบบไทย
 * @returns object header
 */
const createMonthlyReportHeader = (monthName: string) => {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: `📊 รายงานประจำเดือน${monthName}`,
        weight: "bold",
        size: "lg",
        color: "#ffffff",
        wrap: true,
      },
    ],
    backgroundColor: "#5FB691",
    paddingAll: "20px",
  };
};

/**
 * สร้าง bubble แสดงรายงานการเข้างานรายเดือน
 * @param report ข้อมูลรายงานประจำเดือน
 * @returns bubble template
 */
const monthlyReportSummary = (report: any) => {
  // 🛡️ Safe month formatting - ใช้ static mapping แทน toLocaleDateString
  const monthNames: Record<string, string> = {
    "01": "มกราคม",
    "02": "กุมภาพันธ์",
    "03": "มีนาคม",
    "04": "เมษายน",
    "05": "พฤษภาคม",
    "06": "มิถุนายน",
    "07": "กรกฎาคม",
    "08": "สิงหาคม",
    "09": "กันยายน",
    "10": "ตุลาคม",
    "11": "พฤศจิกายน",
    "12": "ธันวาคม",
  };

  const [year, month] = report.month.split("-");
  const monthName = `${monthNames[month]} ${year}`;

  return {
    type: "bubble",
    size: "giga",
    header: createMonthlyReportHeader(monthName),
    /**
     * สร้าง info box สำหรับแสดงข้อมูลสถิติต่างๆ
     * @param label ชื่อหัวข้อ
     * @param value ค่าที่จะแสดง
     * @param color สีของค่า
     * @returns object สำหรับแสดงข้อมูล
     */
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "วันที่ทำงาน",
                  size: "sm",
                  color: "#6b7280",
                },
                {
                  type: "text",
                  text: `${report.totalDaysWorked} วัน`,
                  weight: "bold",
                  size: "xl",
                  color: "#5FB691",
                },
              ],
              flex: 1,
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "ชั่วโมงรวม",
                  size: "sm",
                  color: "#6b7280",
                },
                {
                  type: "text",
                  text: formatHours(report.totalHoursWorked),
                  weight: "bold",
                  size: "xl",
                  color: "#5FB691",
                },
              ],
              flex: 1,
            },
          ],
          margin: "lg",
        },
        {
          type: "separator",
          margin: "xl",
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "เปอร์เซ็นต์การเข้างาน",
                  size: "sm",
                  color: "#6b7280",
                },
                {
                  type: "text",
                  text: formatPercentage(report.attendanceRate),
                  weight: "bold",
                  size: "xl",
                  color: "#dc2626",
                },
              ],
              flex: 1,
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "ชั่วโมงเฉลี่ย/วัน",
                  size: "sm",
                  color: "#6b7280",
                },
                {
                  type: "text",
                  text: formatHours(report.averageHoursPerDay),
                  weight: "bold",
                  size: "xl",
                  color: "#dc2626",
                },
              ],
              flex: 1,
            },
          ],
          margin: "xl",
        },
        {
          type: "separator",
          margin: "xl",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "อัตราการทำงานครบเวลา",
              size: "sm",
              color: "#6b7280",
              align: "center",
            },
            {
              type: "text",
              text: `${formatPercentage(report.complianceRate)} (${report.completeDays} วัน ครบ 9 ชม.)`,
              weight: "bold",
              size: "md",
              color: "#0891b2",
              align: "center",
            },
          ],
          margin: "lg",
        },
      ],
    },
    /**
     * สร้าง footer สำหรับ bubble ที่มีปุ่มลิงก์ไปยังหน้ารายละเอียด
     */
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "ดูรายละเอียดทั้งหมด",
            uri: `${env.APP_URL}/attendance-report?month=${report.month}`,
          },
          style: "primary",
          color: "#5FB691",
        },
      ],
    },
  };
};

const workplacePolicyInfo = () => {
  return {
    type: "bubble",
    size: "giga",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "📋 นโยบายการทำงานบริษัท",
          weight: "bold",
          size: "xl",
          color: "#ffffff",
          align: "center",
        },
      ],
      backgroundColor: "#5B7FD3",
      paddingAll: "30px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "1. การเข้าสำนักงาน",
              weight: "bold",
              size: "md",
              color: "#5B7FD3",
              margin: "md",
            },
            {
              type: "text",
              text: "• จันทร์ ถึง ศุกร์ (5 วันต่อสัปดาห์)\n• ทุกกลุ่มงานและทุกระดับงาน",
              wrap: true,
              flex: 0,
              size: "sm",
              color: "#374151",
              margin: "sm",
            },
          ],
        },
        {
          type: "separator",
          margin: "lg",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "2. เวลาทำงาน",
              weight: "bold",
              size: "md",
              color: "#5B7FD3",
              margin: "md",
            },
            {
              type: "text",
              text: "• รวม 9 ชั่วโมงต่อวัน (รวมพักกลางวัน 1 ชม.)\n• เวลาปฏิบัติงานจริง 8 ชั่วโมงต่อวัน\n• เวลาเข้างานยืดหยุ่น: 08:00 - 11:00 น.",
              wrap: true,
              flex: 0,
              size: "sm",
              color: "#374151",
              margin: "sm",
            },
          ],
        },
        {
          type: "separator",
          margin: "lg",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "3. การบันทึกเวลา",
              weight: "bold",
              size: "md",
              color: "#5B7FD3",
              margin: "md",
            },
            {
              type: "text",
              text: "• บันทึกเข้า-ออกงานที่เครื่องบันทึกเวลา\n• หน้าประตูทางเข้า-ออก (ประตูใหญ่)\n• ระบบนับ 9 ชั่วโมงรวมพัก 1 ชั่วโมง",
              wrap: true,
              flex: 0,
              size: "sm",
              color: "#374151",
              margin: "sm",
            },
          ],
        },
      ],
      paddingAll: "30px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          action: {
            type: "postback",
            label: "📝 ลงชื่อเข้างาน",
            data: "action=checkin_menu",
          },
          color: "#5B7FD3",
        },
      ],
      paddingAll: "30px",
    },
  };
};

const workPublicHoliday = (holidayMessage: string) => {
  return [
    {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🗓️ วันหยุดประจำปี",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
          {
            type: "text",
            text: "Public Holiday",
            size: "sm",
            color: "#ffffff",
            align: "center",
            margin: "xs",
          },
        ],
        backgroundColor: "#ff9800",
        paddingAll: "30px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: holidayMessage,
            wrap: true,
            size: "md",
            align: "center",
            margin: "md",
            color: "#ff9800",
            weight: "bold",
          },
          {
            type: "separator",
            margin: "xl",
          },
          {
            type: "text",
            text: "📅 วันทำงาน: จันทร์ - ศุกร์",
            size: "sm",
            color: "#8A8A8A",
            align: "center",
            margin: "lg",
          },
          {
            type: "text",
            text: "⏰ เวลาทำงาน: 08:00 - 17:00 น.",
            size: "sm",
            color: "#8A8A8A",
            align: "center",
          },
        ],
        paddingAll: "30px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "📋 ดูนโยบายการทำงาน",
              data: "action=work_policy",
            },
            color: "#ff9800",
          },
        ],
        paddingAll: "30px",
      },
    },
  ];
};

const workCheckInLateSuccess = (
  checkInTime: Date,
  expectedCheckOutTime: Date,
) => {
  // ใช้ utilities สำหรับจัดการกับวันที่และเวลาไทย
  const checkInTimeStr = formatTimeHM(checkInTime);
  const expectedCheckOutStr = formatTimeHM(expectedCheckOutTime);

  // สร้างวันที่ในรูปแบบไทย
  const dateStr = formatThaiDate(checkInTime);

  // Random header messages สำหรับ bubble แรก
  const randomHeaders = [
    "⚠️ ลงชื่อเข้างานสาย",
    "😅 มาสายแล้วค่ะ!",
    "⏰ ตื่นมาช้าใช่ไหม?",
    "🌞 บ่ายโมงก็มาได้!",
    "🚨 สายจัง!!",
    "😴 นอนหลับสบายมาก?",
    "🐢 มาช้าแต่มา!",
    "⭐ ยินดีต้อนรับสายๆ",
    "🎭 มาแล้วจ้า!",
    "🔥 สายเป็นไฟ!",
  ] as const;

  // Random body messages สำหรับ bubble แรก - ข้อความสนุกๆ หลากหลาย
  const randomBodyMessages = [
    `⏰ ฮั่นแน่!! มาสายอีกแล้ววววว\nนอนล่ะสิ นอนจนหมีพาไป!! 🐻\nแต่อึนๆ ไม่เป็นไร บันทึกให้แล้ว`,
    `🌞 เห้ยยยยย!! มาละมาละๆ\nดีกว่าขี้เกียจตื่น! สายมากกกกก\nแต่ไม่โดนหักเงินนะจ๊ะ ครั้งนี้ไว้ก่อน!`,
    `⭐ โอ้โห!! มาแบบสายแซ่บเว่อร์!!\nเลทบัท เก๊ทททททท! 💫\nมาแล้วก็ถือว่ามานะ มาได้ก็ดีแล้ว อิอิ`,
    `😅 โอ้ยยยยย นาฬิกาปลุกพังหรือคนพัง!!\nรถติด? ฝนตก? ตื่นไม่ไหว? อ้างได้! 🚗💨\nระบบอนุโลมให้ก็แล้วกัน!`,
    `🚨 อรุณสวัสดิ์.....บ่าย 3 โมงงงง!\nตื่นหรือยังงงง! มาช้าแบบ VIP! ✨\nแต่มาแล้ว! ยังดีที่ไม่เบี้ยว!`,
    `😎 แหมมมม คนดีเค้ารอได้ค่าาา!\nมาแบบสายสุดติ่ง 🌟\nแต่ไม่ว่ากันนะ!! เค้ารักเธออออ`,
    `🐢 มาแบบ สาย สาย ซุปเปอร์สายยย!\nบอสใจดีเว่อร์!! 💖\nวันหลังตื่นเร็วๆหน่อยนะจ๊ะ คนขี้สายจุงเบย!!`,
    `🔥 เฮ้ยยย! ไฟไหม้ที่ไหนนน\nมาช้าขนาดนี้!! ตื่นมาคงงงๆ 😵‍💫\nแต่ไม่สายเกินรักเรานะ!`,
    `🐣 ไข่ยังไม่ฟักเลยมาป่านนี้!!\nแต่เราให้อภัย 💕\nเพราะอย่างน้อยก็มา!`,
    `🌙 มาแล้วก็ดีแล้ว! 😅\nช้าไปหน่อยแต่ไม่เป็นไร 🌸\nระบบเข้าใจคน~`,
    `🎉 ก็มาได้นี่! เลทแต่เก๊ททท!\nยังไงก็ดีกว่าไม่มา! 🎊\nยินดีต้อนรับค่ะ!`,
    `⭐ ยินดีต้อนรับสายๆ!\nมาช้าแต่มาครบ! ✨\nสำคัญคือความตั้งใจ!`,
    `💪 สู้ๆ วันนี้นะ!\nแม้จะมาช้า แต่ยังมีเวลาทำงาน! 🚀\nไฟท์ติ้งค่ะ!`,
    `✨ เริ่มต้นวันใหม่แล้ว\nช้าไปหน่อย แต่ยังทันทำงาน! 🌈\nขอให้มีความสุขกับการทำงาน`,
    `😊 มาแล้วจ้า! อิอิ\nยิ้มๆ ไว้นะ แม้จะมาช้า! 😄\nวันนี้จะเป็นวันที่ดี!`,
    `🚀 พร้อมทำงานแล้ว!\nมาช้า แต่มาพร้อม! 💯\nขอให้ประสบความสำเร็จ!`,
  ] as const;

  // 🛡️ เลือกข้อความแบบ time-based แทน Math.random() เพื่อป้องกัน hydration mismatch
  const randomHeader = timeBasedSelect(randomHeaders, 30); // เปลี่ยนทุก 30 นาที
  const randomBodyMessage = timeBasedSelect(randomBodyMessages, 45); // เปลี่ยนทุก 45 นาที

  return [
    {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: randomHeader,
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: "#FFB84D",
        paddingAll: "30px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: randomBodyMessage,
            weight: "bold",
            size: "lg",
            wrap: true,
            align: "center",
            margin: "md",
            color: "#5A5A5A",
          },
          {
            type: "text",
            text: `📅 ${dateStr}`,
            weight: "bold",
            size: "md",
            wrap: true,
            align: "center",
            margin: "sm",
            color: "#999999",
          },
        ],
        paddingAll: "30px",
      },
    },
    {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🕐 รายละเอียดเวลาทำงาน",
            weight: "bold",
            size: "lg",
            color: "#ffffff",
            align: "center",
          },
        ],
        backgroundColor: "#4CAF50",
        paddingAll: "30px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🕐",
                    size: "md",
                    color: "#FFB84D",
                    weight: "bold",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: "เวลาเข้างาน",
                    size: "md",
                    color: "#333333",
                    weight: "bold",
                    margin: "sm",
                  },
                  {
                    type: "text",
                    text: `${checkInTimeStr} น.`,
                    size: "md",
                    color: "#FFB84D",
                    weight: "bold",
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🕔",
                    size: "md",
                    color: "#4CAF50",
                    weight: "bold",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: "เวลาเลิกงาน",
                    size: "md",
                    color: "#333333",
                    weight: "bold",
                    margin: "sm",
                  },
                  {
                    type: "text",
                    text: `${expectedCheckOutStr} น.`,
                    size: "md",
                    color: "#4CAF50",
                    weight: "bold",
                    align: "end",
                  },
                ],
              },
            ],
          },
          {
            type: "separator",
            margin: "xl",
          },
          {
            type: "text",
            text: "💼 ทำงานหนักๆ ชดเชยความสายนะครับ!",
            size: "sm",
            color: "#999999",
            align: "center",
            margin: "xl",
            wrap: true,
          },
        ],
        paddingAll: "30px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "🔴 ออกงาน",
              data: "action=checkout",
            },
            color: "#E57373",
          },
        ],
        paddingAll: "30px",
      },
    },
  ];
};

/**
 * สร้าง bubble template สำหรับแสดงเลขบัตรประชาชนที่สุ่มได้ (แบบสวยงาม)
 * @param idNumber เลขบัตรประชาชน
 * @param isRandom เป็นการสุ่มหรือไม่
 * @returns bubble template
 */
const thaiIdCard = (idNumber: string, isRandom: boolean = false) => {
  const headerText = isRandom
    ? "🎲 เลขบัตรประชาชนที่สุ่มได้"
    : "📋 เลขบัตรประชาชน";
  const headerBg = isRandom
    ? {
        type: "linearGradient",
        angle: "0deg",
        startColor: "#6366f1",
        endColor: "#8b5cf6",
      }
    : {
        type: "linearGradient",
        angle: "0deg",
        startColor: "#10b981",
        endColor: "#059669",
      };

  return {
    type: "bubble",
    size: "giga",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: headerText,
          weight: "bold",
          size: "xl",
          color: "#ffffff",
          align: "center",
        },
      ],
      background: headerBg,
      paddingAll: "30px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: `${idNumber}`,
              size: "3xl",
              color: "#111827",
              weight: "bold",
              align: "center",
              wrap: true,
              flex: 0,
            },
          ],
          justifyContent: "center",
          margin: "xxl",
        },
        {
          type: "separator",
          margin: "xl",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "📋 แตะที่เลขบัตรเพื่อคัดลอก",
              size: "sm",
              color: "#6b7280",
              align: "center",
              margin: "sm",
            },
            {
              type: "text",
              text: "✅ เลขนี้ถูกต้องตาม Check Digit Algorithm",
              size: "xs",
              color: "#10b981",
              align: "center",
              margin: "sm",
            },
          ],
          margin: "md",
        },
      ],
      paddingAll: "30px",
      backgroundColor: "#f8fafc",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "⚠️ ใช้เพื่อการทดสอบเท่านั้น ห้ามนำไปใช้ผิดกฎหมาย",
              size: "xs",
              color: "#9ca3af",
              wrap: true,
              align: "start",
              flex: 0,
              margin: "sm",
            },
          ],
        },
      ],
      paddingAll: "16px",
      backgroundColor: "#fef3c7",
    },
  };
};

/**
 * สร้าง bubble template สำหรับแสดงเลขบัตรประชาชนหลายเลข (แบบสวยงาม)
 * @param ids รายการเลขบัตรประชาชน
 * @returns bubble template
 */
const thaiIdMultipleCards = (ids: string[]) => {
  const idCards = ids.map((id, index) => ({
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: `${index + 1}.`,
        size: "sm",
        color: "#6366f1",
        weight: "bold",
        margin: "xs",
      },
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: `${id}`,
            size: "xl",
            color: "#111827",
            weight: "bold",
            align: "center",
            wrap: true,
            flex: 0,
          },
        ],
        justifyContent: "center",
        margin: "md",
      },
    ],
    backgroundColor: "#f8fafc",
    cornerRadius: "6px",
    paddingAll: "12px",
    margin: "sm",
    borderWidth: "1px",
    borderColor: "#e5e7eb",
  }));

  return {
    type: "bubble",
    size: "giga",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `🎲 เลขบัตรประชาชนที่สุ่มได้`,
          weight: "bold",
          size: "xl",
          color: "#ffffff",
          align: "center",
        },
        {
          type: "text",
          text: `(${ids.length} เลข)`,
          size: "sm",
          color: "#ffffff",
          align: "center",
        },
      ],
      background: {
        type: "linearGradient",
        angle: "0deg",
        startColor: "#6366f1",
        endColor: "#8b5cf6",
      },
      paddingAll: "30px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: idCards,
          backgroundColor: "#ffffff",
          cornerRadius: "12px",
          paddingAll: "16px",
          margin: "md",
          borderWidth: "1px",
          borderColor: "#e5e7eb",
        },
        {
          type: "separator",
          margin: "xl",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "📋 แตะที่เลขบัตรเพื่อคัดลอก",
              size: "sm",
              color: "#6b7280",
              align: "center",
              margin: "sm",
            },
            {
              type: "text",
              text: "✅ ทุกเลขถูกต้องตาม Check Digit Algorithm",
              size: "xs",
              color: "#10b981",
              align: "center",
              margin: "sm",
            },
          ],
          margin: "md",
        },
      ],
      paddingAll: "30px",
      backgroundColor: "#f8fafc",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "⚠️",
              size: "sm",
              color: "#f59e0b",
            },
            {
              type: "text",
              text: "ใช้เพื่อการทดสอบเท่านั้น ห้ามนำไปใช้ผิดกฎหมาย",
              size: "xs",
              color: "#9ca3af",
              wrap: true,
              align: "start",
              flex: 0,
              margin: "sm",
            },
          ],
        },
      ],
      paddingAll: "16px",
      backgroundColor: "#fef3c7",
    },
  };
};

/**
 * สร้าง bubble template สำหรับแสดงผลการตรวจสอบเลขบัตรประชาชน (แบบสวยงาม)
 * @param idNumber เลขบัตรประชาชน
 * @param isValid ผลการตรวจสอบ
 * @returns bubble template
 */
const thaiIdValidationResult = (idNumber: string, isValid: boolean) => {
  const statusText = isValid ? "✅ ถูกต้อง" : "❌ ไม่ถูกต้อง";
  const statusColor = isValid ? "#10b981" : "#ef4444";
  const headerBg = isValid
    ? {
        type: "linearGradient",
        angle: "0deg",
        startColor: "#10b981",
        endColor: "#059669",
      }
    : {
        type: "linearGradient",
        angle: "0deg",
        startColor: "#ef4444",
        endColor: "#dc2626",
      };
  const bgColor = isValid ? "#f0fdf4" : "#fef2f2";

  return {
    type: "bubble",
    size: "giga",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "🔍 ผลการตรวจสอบเลขบัตรประชาชน",
          weight: "bold",
          size: "xl",
          color: "#ffffff",
          align: "center",
        },
      ],
      background: headerBg,
      paddingAll: "30px",
    },
    hero: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "📊",
          size: "3xl",
          align: "center",
          color: "#ffffff",
        },
      ],
      alignItems: "center",
      justifyContent: "center",
      paddingAll: "lg",
      background: headerBg,
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: `${idNumber}`,
                  size: "3xl",
                  color: "#111827",
                  weight: "bold",
                  align: "center",
                  wrap: true,
                  flex: 0,
                },
              ],
              justifyContent: "center",
              margin: "xxl",
              width: "100%",
            },
          ],
          backgroundColor: bgColor,
          cornerRadius: "8px",
          paddingAll: "16px",
          margin: "md",
        },
        {
          type: "separator",
          margin: "xl",
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: statusText,
              weight: "bold",
              size: "lg",
              color: statusColor,
              align: "center",
              margin: "md",
            },
            {
              type: "text",
              text: `📊 สถานะ: ${isValid ? "ผ่านการตรวจสอบ" : "ไม่ผ่านการตรวจสอบ"} ตาม Check Digit Algorithm`,
              size: "sm",
              color: "#6b7280",
              align: "center",
              margin: "sm",
            },
            ...(isValid
              ? []
              : [
                  {
                    type: "separator",
                    margin: "md",
                  },
                  {
                    type: "text",
                    text: "💡 เลขบัตรประชาชนไทยต้องมี 13 หลัก และผ่านการตรวจสอบ Check Digit",
                    size: "xs",
                    color: "#9ca3af",
                    wrap: true,
                    flex: 0,
                    align: "center",
                    margin: "sm",
                  },
                ]),
          ],
          margin: "lg",
        },
        {
          type: "separator",
          margin: "lg",
        },
        {
          type: "text",
          text: "📋 แตะที่เลขบัตรเพื่อคัดลอก",
          size: "sm",
          color: "#6b7280",
          align: "center",
          margin: "md",
        },
      ],
      paddingAll: "30px",
      backgroundColor: "#f8fafc",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "⚠️ เลขบัตรนี้ถูกใช้เพื่อการทดสอบเท่านั้น",
              size: "xs",
              color: "#9ca3af",
              wrap: true,
              align: "start",
              flex: 0,
              margin: "sm",
            },
          ],
        },
      ],
      paddingAll: "16px",
      backgroundColor: "#fef3c7",
    },
  };
};

/**
 * สร้าง bubble template สำหรับแสดงคำแนะนำการใช้งาน Thai ID Generator
 * @returns bubble template
 */
const thaiIdValidateInput = () => {
  return {
    type: "bubble",
    size: "giga",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "🔍 ตรวจสอบเลขบัตรประชาชน",
          weight: "bold",
          size: "xl",
          color: "#ffffff",
          align: "center",
        },
        {
          type: "text",
          text: "Thai ID Validator",
          size: "sm",
          color: "#ffffff",
          align: "center",
        },
      ],
      backgroundColor: "#f59e0b",
      paddingAll: "30px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก",
              weight: "bold",
              size: "md",
              color: "#374151",
              margin: "md",
            },
            {
              type: "text",
              text: "รองรับทั้งรูปแบบมี dash และไม่มี dash",
              size: "sm",
              color: "#6b7280",
              margin: "xs",
            },
            {
              type: "separator",
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "ตัวอย่าง:",
                  size: "sm",
                  color: "#6b7280",
                  weight: "bold",
                  margin: "sm",
                },
                {
                  type: "text",
                  text: "• 1234567890123",
                  size: "sm",
                  color: "#059669",
                  margin: "xs",
                },
                {
                  type: "text",
                  text: "• 1-2345-67890-12-3",
                  size: "sm",
                  color: "#059669",
                  margin: "xs",
                },
                {
                  type: "text",
                  text: "• 1 2345 67890 12 3",
                  size: "sm",
                  color: "#059669",
                  margin: "xs",
                },
              ],
              backgroundColor: "#f0fdf4",
              cornerRadius: "4px",
              paddingAll: "12px",
              margin: "sm",
            },
            {
              type: "separator",
              margin: "lg",
            },
            {
              type: "button",
              style: "primary",
              action: {
                type: "postback",
                label: "⬅️ กลับไปเมนูหลัก",
                data: "action=thai_id_menu",
              },
              color: "#6b7280",
              margin: "md",
            },
          ],
          backgroundColor: "#ffffff",
          cornerRadius: "8px",
          paddingAll: "16px",
          margin: "md",
        },
      ],
      paddingAll: "30px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "⚠️ หมายเหตุ: ใช้เพื่อการทดสอบเท่านั้น ห้ามนำไปใช้ในการปลอมแปลงเอกสาร",
          size: "xs",
          color: "#9ca3af",
          wrap: true,
          align: "start",
        },
      ],
      paddingAll: "16px",
      justifyContent: "start",
    },
  };
};

const thaiIdMainMenu = () => {
  return {
    type: "bubble",
    size: "giga",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "🎲 สุ่มเลขบัตรประชาชน",
          weight: "bold",
          size: "xl",
          color: "#ffffff",
          align: "center",
        },
        {
          type: "text",
          text: "Thai ID Generator",
          size: "sm",
          color: "#ffffff",
          align: "center",
        },
      ],
      backgroundColor: "#6366f1",
      paddingAll: "30px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "เลือกการดำเนินการที่ต้องการ:",
              weight: "bold",
              size: "md",
              color: "#374151",
              margin: "md",
            },
            {
              type: "separator",
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "🎲 สุ่มเลขบัตร 1 เลข",
                    data: "action=thai_id_generate_1",
                  },
                  color: "#10b981",
                  margin: "sm",
                },
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "🎲 สุ่มเลขบัตร 5 เลข",
                    data: "action=thai_id_generate_5",
                  },
                  color: "#6366f1",
                  margin: "sm",
                },
                {
                  type: "button",
                  style: "secondary",
                  action: {
                    type: "postback",
                    label: "🔍 ตรวจสอบเลขบัตร",
                    data: "action=thai_id_validate",
                  },
                  color: "#f59e0b",
                  margin: "sm",
                },
                {
                  type: "button",
                  style: "secondary",
                  action: {
                    type: "postback",
                    label: "📋 ดูคำสั่งทั้งหมด",
                    data: "action=thai_id_help",
                  },
                  color: "#6b7280",
                  margin: "sm",
                },
              ],
              margin: "md",
            },
          ],
          backgroundColor: "#ffffff",
          cornerRadius: "8px",
          paddingAll: "16px",
          margin: "md",
        },
      ],
      paddingAll: "30px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "⚠️ หมายเหตุ: ใช้เพื่อการทดสอบเท่านั้น ห้ามนำไปใช้ในการปลอมแปลงเอกสาร",
          size: "xs",
          color: "#9ca3af",
          wrap: true,
          align: "start",
        },
      ],
      paddingAll: "16px",
      justifyContent: "start",
    },
  };
};

const thaiIdHelp = () => {
  return {
    type: "bubble",
    size: "giga",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "🆔 ตัวสร้างเลขบัตรประชาชนไทย",
          weight: "bold",
          size: "lg",
          color: "#ffffff",
          align: "center",
        },
        {
          type: "text",
          text: "Thai ID Generator",
          size: "sm",
          color: "#ffffff",
          align: "center",
        },
      ],
      backgroundColor: "#6366f1",
      paddingAll: "30px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "📝 คำสั่งที่ใช้ได้:",
              weight: "bold",
              size: "md",
              color: "#374151",
              margin: "md",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "• สุ่มเลขบัตร - สุ่มเลขบัตรประชาชน 1 เลข",
                  size: "sm",
                  color: "#6b7280",
                  wrap: true,
                  flex: 0,
                  margin: "xs",
                },
                {
                  type: "text",
                  text: "• สุ่มเลขบัตร 5 - สุ่มเลขบัตรประชาชน 5 เลข",
                  size: "sm",
                  color: "#6b7280",
                  wrap: true,
                  flex: 0,
                  margin: "xs",
                },
                {
                  type: "text",
                  text: "• ตรวจสอบบัตร [เลขบัตร] - ตรวจสอบความถูกต้อง",
                  size: "sm",
                  color: "#6b7280",
                  wrap: true,
                  flex: 0,
                  margin: "xs",
                },
              ],
              margin: "sm",
            },
            {
              type: "separator",
              margin: "lg",
            },
            {
              type: "text",
              text: "📋 ตัวอย่างการใช้งาน:",
              weight: "bold",
              size: "md",
              color: "#374151",
              margin: "md",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "• สุ่มบัตรประชาชน",
                  size: "sm",
                  color: "#059669",
                  weight: "bold",
                  margin: "xs",
                },
                {
                  type: "text",
                  text: "• สุ่มเลขบัตร 3",
                  size: "sm",
                  color: "#059669",
                  weight: "bold",
                  margin: "xs",
                },
                {
                  type: "text",
                  text: "• ตรวจสอบบัตร 1-2345-67890-12-1",
                  size: "sm",
                  color: "#059669",
                  weight: "bold",
                  margin: "xs",
                },
              ],
              backgroundColor: "#f0fdf4",
              cornerRadius: "4px",
              paddingAll: "12px",
              margin: "sm",
            },
          ],
          backgroundColor: "#ffffff",
          cornerRadius: "8px",
          paddingAll: "16px",
          margin: "md",
        },
      ],
      paddingAll: "30px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "⚠️ หมายเหตุ: ใช้เพื่อการทดสอบเท่านั้น ห้ามนำไปใช้ในการปลอมแปลงเอกสาร",
          size: "xs",
          color: "#9ca3af",
          wrap: true,
          align: "start",
        },
      ],
      paddingAll: "16px",
      justifyContent: "start",
    },
  };
};

export const bubbleTemplate = {
  lottery,
  cryptoCurrency,
  gold,
  gas,
  signIn,
  notFound,
  workCheckIn,
  workCheckInSuccess,
  workCheckInLateSuccess,
  workCheckInEarlySuccess,
  workStatus,
  workAlreadyCheckedIn,
  workCheckOutSuccess,
  workError,
  monthlyReportMenu,
  monthlyReportSummary,
  workplacePolicyInfo,
  workPublicHoliday,
  leaveError,
  thaiIdCard,
  thaiIdMultipleCards,
  thaiIdValidationResult,
  thaiIdHelp,
  thaiIdMainMenu,
  thaiIdValidateInput,
};

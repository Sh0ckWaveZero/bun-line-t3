import { AqiData } from "../aqi_data";
import type { AqicnResponse } from "../types/aqicn";

const fetchAqicn = (latitude: number, longitude: number): Promise<AqicnResponse> => {
  const token = process.env.AQICN_TOKEN;
  return fetch(
    `https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=${token}`,
  ).then((r) => r.json());
};

const getAirQualityData = async (latitude: number, longitude: number) => {
  const data = await fetchAqicn(latitude, longitude);
  if (data.status !== "ok") throw new Error("AQICN API error");
  return data;
};

const aqiToLevel = (val: number): string => {
  if (val <= 50) return "green";
  if (val <= 100) return "yellow";
  if (val <= 150) return "orange";
  if (val <= 200) return "red";
  if (val <= 300) return "purple";
  return "unknown";
};

const buildBubble = (data: AqicnResponse, locationName: string) => {
  const aqi = data.data.aqi;
  const pm25 = (data.data.iaqi.pm25?.v ?? 0).toFixed(1);
  const tp = data.data.iaqi.t?.v ?? 0;
  const hu = data.data.iaqi.h?.v ?? 0;
  const ws = Math.round(data.data.iaqi.w?.v ?? 0);

  const level = aqiToLevel(aqi);
  const objAqi = AqiData.find((item) => item.level === level);

  const bg = objAqi?.backgroundColor ?? "#CCCCCC";
  const boxBg = objAqi?.boxImageColor ?? "#AAAAAA";
  const textColor = objAqi?.textColor ?? "#333333";

  return [
    {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "none",
        spacing: "none",
        contents: [
          // ── Colored AQI section ──────────────────────────────
          {
            type: "box",
            layout: "vertical",
            backgroundColor: bg,
            paddingAll: "lg",
            spacing: "md",
            contents: [
              // Location name
              {
                type: "text",
                text: `📍 ${locationName}`,
                size: "sm",
                color: textColor,
                wrap: true,
              },
              // Row: [AQI box] [Description] [Face]
              {
                type: "box",
                layout: "horizontal",
                alignItems: "center",
                spacing: "md",
                contents: [
                  // AQI number box (darker shade)
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: boxBg,
                    cornerRadius: "lg",
                    paddingAll: "sm",
                    paddingTop: "md",
                    paddingBottom: "md",
                    width: "76px",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 0,
                    contents: [
                      {
                        type: "text",
                        text: `${aqi}`,
                        size: "xxl",
                        weight: "bold",
                        color: textColor,
                        align: "center",
                      },
                      {
                        type: "text",
                        text: "US AQI+",
                        size: "xs",
                        color: textColor,
                        align: "center",
                      },
                    ],
                  },
                  // Description (fill)
                  {
                    type: "text",
                    text: objAqi?.description ?? "",
                    size: "md",
                    weight: "bold",
                    color: textColor,
                    wrap: true,
                    flex: 1,
                  },
                  // Face image (no box)
                  {
                    type: "image",
                    url: objAqi?.imageUrl ?? "",
                    size: "xs",
                    flex: 0,
                  },
                ],
              },
              // PM2.5 row
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "PM2.5 หลัก:",
                    color: textColor,
                    size: "sm",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: `${pm25}\u00A0µg/m³`,
                    color: textColor,
                    size: "sm",
                    align: "end",
                  },
                ],
              },
            ],
          },
          // ── White weather section ─────────────────────────────
          {
            type: "box",
            layout: "horizontal",
            backgroundColor: "#FFFFFF",
            paddingTop: "md",
            paddingBottom: "md",
            paddingStart: "xl",
            paddingEnd: "xl",
            contents: [
              { icon: "🌡️", value: `${tp}°` },
              { icon: "💨", value: `${ws}\u00A0km/h` },
              { icon: "💧", value: `${hu}%` },
            ].map(({ icon, value }) => ({
              type: "box",
              layout: "horizontal",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              spacing: "xs",
              contents: [
                {
                  type: "text",
                  text: icon,
                  size: "sm",
                  flex: 0,
                },
                {
                  type: "text",
                  text: value,
                  size: "sm",
                  weight: "bold",
                  color: "#414141",
                  flex: 0,
                },
              ],
            })),
          },
        ],
      },
    },
  ];
};

export const aqicnService = {
  getAirQualityData,
  buildBubble,
};

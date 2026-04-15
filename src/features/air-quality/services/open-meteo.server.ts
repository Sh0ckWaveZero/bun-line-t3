import { AqiData } from "../aqi_data";
import type {
  OpenMeteoAirQualityResponse,
  OpenMeteoWeatherResponse,
} from "../types/open-meteo";

const fetchAirQuality = (
  latitude: number,
  longitude: number,
): Promise<OpenMeteoAirQualityResponse> =>
  fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,us_aqi`,
  ).then((r) => r.json());

const fetchWeather = (
  latitude: number,
  longitude: number,
): Promise<OpenMeteoWeatherResponse> =>
  fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&wind_speed_unit=kmh`,
  ).then((r) => r.json());

const getAirQualityData = async (latitude: number, longitude: number) => {
  const [aq, weather] = await Promise.all([
    fetchAirQuality(latitude, longitude),
    fetchWeather(latitude, longitude),
  ]);
  return { aq, weather };
};

const aqiToLevel = (val: number): string => {
  if (val <= 50) return "green";
  if (val <= 100) return "yellow";
  if (val <= 150) return "orange";
  if (val <= 200) return "red";
  if (val <= 300) return "purple";
  return "unknown";
};

const buildBubble = (
  aq: OpenMeteoAirQualityResponse,
  weather: OpenMeteoWeatherResponse,
  locationName: string,
) => {
  const aqi = Math.round(aq.current.us_aqi);
  const pm25 = aq.current.pm2_5.toFixed(1);
  const tp = weather.current.temperature_2m;
  const hu = weather.current.relative_humidity_2m;
  const ws = Math.round(weather.current.wind_speed_10m);

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
                        size: "xxs",
                        color: textColor,
                        align: "center",
                      },
                    ],
                  },
                  // Description (fill)
                  {
                    type: "text",
                    text: objAqi?.description ?? "",
                    size: "lg",
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
                    text: `${pm25} µg/m³`,
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
              { icon: "💨", value: `${ws} km/h` },
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
                  size: "lg",
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

export const openMeteoService = {
  getAirQualityData,
  buildBubble,
};

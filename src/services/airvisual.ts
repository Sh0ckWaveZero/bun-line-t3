import { AqiData } from '~/data/aqi_data';
import { env } from '~/env.mjs';
import { WeatherIcon } from "../data/aqi_data";

const getNearestCity = async (latitude: number, longitude: number): Promise<any> => {
  const url = `http://api.airvisual.com/v2/nearest_city?lat=${latitude}&lon=${longitude}&key=${env.AIRVISUAL_API_KEY}`
  try {
    const response = await fetch(url, {
      method: 'GET',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return error;
  }
};

const getNearestCityBubble = (location: any) => {
  const aqi = location.data.current.pollution.aqius;
  const ts = location.data.current.pollution.ts;
  const city = location.data.city;
  const state = location.data.state;
  const country = location.data.country;
  const tp = location.data.current.weather.tp;
  const ws = location.data.current.weather.ws;
  const hu = location.data.current.weather.hu;
  const ic = location.data.current.weather.ic;


  let level = '';
  switch (true) {
    case (aqi <= 50):
      level = 'green';
      break;
    case (aqi >= 51 && aqi <= 100):
      level = 'yellow';
      break;
    case (aqi >= 101 && aqi <= 150):
      level = 'orange';
      break;
    case (aqi >= 151 && aqi <= 200):
      level = 'red';
      break;
    case (aqi >= 201 && aqi <= 300):
      level = 'purple';
      break;
    default:
      level = 'unknown';
      break;
  }

  const dateTime = new Date(ts).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour12: false,
  });

  const objAqi = AqiData.find((item: any) => item.level === level);
  const weatherIcon = WeatherIcon.find((item: any) => item.icon === ic);

  const bubble = [
    {
      "type": "bubble",
      "size": "giga",
      "hero": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": `📍 ${city} District`,
            "size": "xl",
            "color": "#404040"
          },
          {
            "type": "text",
            "text": `${state}, ${country}`,
            "color": "#68788D"
          }
        ],
        "justifyContent": "center",
        "alignItems": "center",
        "paddingTop": "xxl"
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                      {
                        "type": "image",
                        "url": `${objAqi?.imageUrl}`,
                        "size": "sm"
                      }
                    ],
                    "backgroundColor": objAqi?.boxImageColor,
                    "height": "110px",
                    "alignItems": "center",
                    "justifyContent": "center",
                    "paddingAll": "xl",
                    "width": "110px"
                  },
                  {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                      {
                        "type": "text",
                        "text": `${aqi}`,
                        "color": `${objAqi?.textColor}`,
                        "size": "xxl"
                      },
                      {
                        "type": "text",
                        "text": "สหรัฐ AQI",
                        "color": `${objAqi?.textColor}`,
                        "size": "sm"
                      }
                    ],
                    "alignItems": "center",
                    "backgroundColor": `${objAqi?.backgroundColor}`,
                    "justifyContent": "center",
                    "width": "110px"
                  },
                  {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                      {
                        "type": "text",
                        "text": "มีผลกระทบต่อทุกคน",
                        "color": `${objAqi?.textColor}`,
                        "size": "sm",
                        "wrap": true,
                        "align": "center"
                      }
                    ],
                    "alignItems": "center",
                    "justifyContent": "center",
                    "backgroundColor": `${objAqi?.backgroundColor}`,
                    "paddingAll": "md"
                  }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                      {
                        "type": "image",
                        "url": `${weatherIcon?.imageUrl}`,
                        "size": "md",
                        "align": "center"
                      },
                      {
                        "type": "text",
                        "text": `${tp}°`,
                        "align": "center",
                        "size": "md",
                        "color": "#414141"
                      }
                    ],
                    "height": "60px",
                    "alignItems": "center",
                    "justifyContent": "center",
                    "paddingAll": "xl"
                  },
                  {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                      {
                        "type": "text",
                        "text": `💨 ${ws} km/h`,
                        "color": "#414141",
                        "size": "md",
                        "align": "center"
                      }
                    ],
                    "alignItems": "center",
                    "justifyContent": "center"
                  },
                  {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                      {
                        "type": "text",
                        "text": `💧 ${hu}%`,
                        "color": "#414141",
                        "size": "md",
                        "align": "center"
                      }
                    ],
                    "alignItems": "center",
                    "justifyContent": "center"
                  }
                ],
                "backgroundColor": "#EDEDED"
              }
            ],
            "cornerRadius": "md"
          }
        ]
      }
    }
  ]

  return bubble;
};

export const airVisualService = {
  getNearestCity,
  getNearestCityBubble,
}
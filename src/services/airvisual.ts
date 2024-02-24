import { AqiData } from '~/data/aqi_data';
import { env } from '~/env.mjs';

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

const getNearestCityBubble = (aqi: number, ts: string) => {
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

  const bubble: any = [
    {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'ดัชนีคุณภาพอากาศ (AQI)',
            size: 'lg',
            weight: 'bold',
            color: '#414141',
          },
          {
            type: 'separator',
            margin: 'sm',
            color: '#414141',
          },
          {
            type: 'text',
            text: `${dateTime}`,
            size: 'sm',
            margin: 'md',
            color: '#93A2B7',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'image',
                    url: `${objAqi?.imageUrl}`,
                  },
                ],
                backgroundColor: `${objAqi?.boxImageColor}`,
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: `${aqi}`,
                    color: `${objAqi?.textColor}`,
                    size: '4xl',
                  },
                  {
                    type: 'text',
                    text: 'สหรัฐ AQI',
                    color: `${objAqi?.textColor}`,
                    size: 'xxs',
                    style: 'normal',
                  },
                ],
                alignItems: 'center',
                spacing: 'lg',
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: `${objAqi?.description}`,
                    wrap: true,
                    weight: 'bold',
                    size: 'xs',
                    color: `${objAqi?.textColor}`,
                  },
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: `${objAqi?.pm25}`,
                        size: 'xxs',
                        align: 'center',
                        color: `${objAqi?.textColor}`,
                      },
                    ],
                    backgroundColor: '#ffffff',
                    cornerRadius: 'sm',
                    paddingAll: 'xs',
                  },
                ],
                spacing: 'lg',
                paddingAll: 'lg',
              },
            ],
            margin: 'lg',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: `${objAqi?.backgroundColor}`,
            cornerRadius: 'sm',
          },
        ],
      },
      styles: {
        hero: {},
      },
    },
  ];
  return bubble;
};

export const airVisualService = {
  getNearestCity,
  getNearestCityBubble,
}
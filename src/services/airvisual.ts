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
  const aqiData: any = [
    {
      level: 'green',
      backgroundColor: '#A8DF5F',
      boxImageColor: '#87C13C',
      imageUrl: 'https://i.ibb.co/2g3LhbW/ic-face-green.png',
      textColor: '#607631',
      decription: 'ดี',
      pm25: '0-15 µg/m³',
    },
    {
      level: 'yellow',
      backgroundColor: '#FDD64B',
      boxImageColor: '#EFBE1D',
      imageUrl: 'https://i.ibb.co/L6v112C/ic-face-yellow.png',
      textColor: '#8B6B1D',
      decription: 'ปานกลาง',
      pm25: '16-35.4 µg/m³',
    },
    {
      level: 'orange',
      backgroundColor: '#FB9B57',
      boxImageColor: '#F27E2F',
      imageUrl: 'https://i.ibb.co/Z20zDcs/ic-face-orange.png',
      textColor: '#974920',
      decription: 'มีผลกระทบต่อผู้ป่วยหรือร่างกายอ่อนแอ',
      pm25: '35.5-65 µg/m³',
    },
    {
      level: 'red',
      backgroundColor: '#FA6A69',
      boxImageColor: '#E84B51',
      imageUrl: 'https://i.ibb.co/B26L61b/ic-face-red.png',
      textColor: '#942431',
      decription: 'มีผลกระทบต่อทุกคน',
      pm25: '66-150 µg/m³',
    },
    {
      level: 'purple',
      backgroundColor: '#A97ABC',
      boxImageColor: '#8A5D9D',
      imageUrl: 'https://i.ibb.co/3YRzknH/ic-face-purple.png',
      textColor: '#543B63',
      decription: 'มีผลกระทบต่อทุกคนอย่างรุนแรง',
      pm25: '201-250 µg/m³',
    },
  ];

  let level = '';
  if (aqi <= 50) {
    level = 'green';
  } else if (aqi >= 51 && aqi <= 100) {
    level = 'yellow';
  } else if (aqi >= 101 && aqi <= 150) {
    level = 'orange';
  } else if (aqi >= 151 && aqi <= 200) {
    level = 'red';
  } else if (aqi >= 201 && aqi <= 300) {
    level = 'purple';
  }

  const datetime = new Date(ts).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour12: false,
  });

  const objAqi = aqiData.filter((item: any) => item.level === level)[0];
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
            text: `${datetime}`,
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
                    url: `${objAqi.imageUrl}`,
                  },
                ],
                backgroundColor: `${objAqi.boxImageColor}`,
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: `${aqi}`,
                    color: `${objAqi.textColor}`,
                    size: '4xl',
                  },
                  {
                    type: 'text',
                    text: 'สหรัฐ AQI',
                    color: `${objAqi.textColor}`,
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
                    text: `${objAqi.decription}`,
                    wrap: true,
                    weight: 'bold',
                    size: 'xs',
                    color: `${objAqi.textColor}`,
                  },
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: `${objAqi.pm25}`,
                        size: 'xxs',
                        align: 'center',
                        color: `${objAqi.textColor}`,
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
            backgroundColor: `${objAqi.backgroundColor}`,
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
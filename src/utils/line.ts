import { CryptoInfo } from '~/interface';
import randomColor from './randomColor';
import { utils } from '.';
import { IMAGE_GOLD_URLS, IMAGE_URLS } from '~/config/common.constant';
import { env } from 'process';

const lottery = (infoItems: any[]) => {
  return infoItems.map((item) => {
    return {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "image",
                "url": `${item.image}`,
                "size": "full",
                "aspectMode": "cover",
                "aspectRatio": "4:3",
                "gravity": "center",
                "flex": 0
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  {
                    "type": "text",
                    "text": "ผลการตรวจรางวัล",
                    "size": "xs",
                    "color": "#ffffff",
                    "align": "center",
                    "gravity": "center",
                    "flex": 0
                  }
                ],
                "backgroundColor": "#cc66ff",
                "paddingAll": "2px",
                "paddingStart": "4px",
                "paddingEnd": "4px",
                "position": "absolute",
                "offsetStart": "18px",
                "offsetTop": "18px",
                "cornerRadius": "8px",
                "height": "25px"
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  {
                    "type": "text",
                    "text": `${item.value}`,
                    "size": "4xl",
                    "color": "#ffffff",
                    "align": "center",
                    "gravity": "center",
                    "flex": 0
                  }
                ],
                "paddingAll": "2px",
                "paddingStart": "4px",
                "paddingEnd": "4px",
                "position": "absolute",
                "offsetStart": "60px",
                "offsetTop": "90px",
                "height": "70px",
                "alignItems": "center",
                "cornerRadius": "8px",
                "background": {
                  "type": "linearGradient",
                  "angle": "0deg",
                  "startColor": "#cc66ff",
                  "endColor": "#15162c"
                }
              }
            ]
          }
        ],
        "paddingAll": "0px"
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
                "layout": "vertical",
                "contents": [
                  {
                    "type": "text",
                    "contents": [],
                    "size": "xl",
                    "wrap": true,
                    "text": "ประจำงวด",
                    "color": "#ffffff",
                    "weight": "bold"
                  },
                  {
                    "type": "text",
                    "text": `${item.lottoAt}`,
                    "color": "#ffffffcc",
                    "size": "sm"
                  }
                ],
                "spacing": "sm"
              },
              {
                "type": "box",
                "layout": "vertical",
                "contents": [
                  {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                      {
                        "type": "text",
                        "contents": [],
                        "size": "md",
                        "wrap": true,
                        "margin": "xs",
                        "color": "#ffffffde",
                        "text": `${item.name}`,
                        "align": "center"
                      }
                    ]
                  }
                ],
                "paddingAll": "13px",
                "backgroundColor": "#ffffff1A",
                "cornerRadius": "2px",
                "margin": "xl"
              }
            ]
          }
        ],
        "paddingAll": "20px",
        "backgroundColor": "#464F69"
      }
    }
  });
};

const cryptoCurrency = (data: CryptoInfo): any => {
  let bubbleMessageTpl = {};

  const boxOne = data.highPrice
    ? createBubbleBox('ราคาสูงสุด', data.highPrice)
    : createBubbleBox('ปริมาณ 24ชม.', data.volume_24h);

  const boxTwo = data.lowPrice
    ? createBubbleBox('ราคาต่ำสุด', data.lowPrice)
    : createBubbleBox('ลำดับที่', data.cmc_rank || '-');
  const boxThree = createBubbleBox(
    'ราคาเปลี่ยนแปลง',
    data.volume_change_24h,
    data.priceChangeColor,
  );

  const colorHeader = randomColor({
    luminosity: 'bright',
    hue: 'hsla',
  });

  bubbleMessageTpl = {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'baseline',
      contents: [
        {
          type: 'icon',
          url: `${data.urlLogo}`,
          size: '4xl',
        },
      ],
      justifyContent: 'center',
      alignItems: 'center',
      paddingAll: 'lg',
      offsetTop: 'lg',
    },
    hero: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${data.currencyName}`,
          align: 'center',
          size: 'xxl',
          weight: 'bold',
          color: '#FFFFFF',
        },
      ],
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'baseline',
          contents: [
            {
              type: 'icon',
              url: `${data.exchangeLogoUrl}`,
              size: 'lg',
            },
            {
              type: 'text',
              text: `${data.exchange}`,
              weight: 'bold',
              size: 'lg',
              offsetTop: '-10.5%',
              color: `${data.textColor}`,
            },
          ],
          spacing: 'md',
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: 'ราคาล่าสุด',
              size: 'lg',
              color: '#8c8c8c',
              weight: 'bold',
              margin: 'md',
              flex: 0,
              align: 'start',
            },
            {
              type: 'text',
              text: `${data.lastPrice}`,
              align: 'end',
              weight: 'bold',
              size: 'md',
            },
          ],
          justifyContent: 'space-between',
        },
        boxOne,
        boxTwo,
        boxThree,
      ],
      spacing: 'sm',
      paddingAll: '13px',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: 'วันที่',
              size: 'xs',
              color: '#aaaaaa',
              margin: 'md',
              flex: 0,
              align: 'start',
            },
            {
              type: 'text',
              align: 'end',
              size: 'xs',
              text: `${data.last_updated}`,
              color: '#aaaaaa',
            },
          ],
          justifyContent: 'space-between',
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
  text = '',
  value = '',
  priceChangeColor = '#454545',
): any => {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text: `${text}`,
        size: 'xs',
        color: '#8c8c8c',
        margin: 'md',
        flex: 0,
        align: 'start',
      },
      {
        type: 'text',
        text: `${value}`,
        align: 'end',
        size: 'xs',
        color: `${priceChangeColor}`,
      },
    ],
    justifyContent: 'space-between',
  };
};


const gold = (data: any): any => {
  let bubbleMessageTpl = {};
  const image1 = utils.randomItems(IMAGE_GOLD_URLS);
  const image2 = utils.randomItems(IMAGE_GOLD_URLS);
  const image3 = utils.randomItems(IMAGE_GOLD_URLS);
  bubbleMessageTpl = {
    "type": "bubble",
    "size": "mega",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            {
              "type": "image",
              "url": `${image1}`,
              "size": "full",
              "aspectMode": "cover",
              "aspectRatio": "150:196",
              "gravity": "center",
              "flex": 1
            },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "image",
                  "url": `${image2}`,
                  "size": "full",
                  "aspectMode": "cover",
                  "aspectRatio": "150:98",
                  "gravity": "center"
                },
                {
                  "type": "image",
                  "url": `${image3}`,
                  "size": "full",
                  "aspectMode": "cover",
                  "aspectRatio": "150:98",
                  "gravity": "center"
                }
              ],
              "flex": 1
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "text",
                  "text": "Gold",
                  "size": "xs",
                  "color": "#000000",
                  "align": "center",
                  "gravity": "center"
                }
              ],
              "backgroundColor": "#FFD700",
              "paddingAll": "2px",
              "paddingStart": "4px",
              "paddingEnd": "4px",
              "flex": 0,
              "position": "absolute",
              "offsetStart": "18px",
              "offsetTop": "18px",
              "cornerRadius": "100px",
              "width": "48px",
              "height": "25px"
            }
          ]
        }
      ],
      "paddingAll": "0px"
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
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "contents": [],
                  "size": "xl",
                  "wrap": true,
                  "text": "🏅 ราคาทองวันนี้",
                  "color": "#ffffff",
                  "weight": "bold"
                },
                {
                  "type": "text",
                  "text": "ความบริสุทธิ์ 96.5% ",
                  "color": "#ffffffcc",
                  "size": "sm"
                }
              ],
              "spacing": "sm"
            },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "text",
                      "text": "ทองคำแท่ง",
                      "size": "md",
                      "weight": "bold",
                      "offsetBottom": "none"
                    }
                  ],
                  "paddingTop": "sm",
                  "paddingBottom": "sm"
                },
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "text",
                      "text": "รับซื้อ",
                      "align": "start"
                    },
                    {
                      "type": "text",
                      "align": "end",
                      "text": `${data.barSell}`,
                      "color": `${data.barSellColor}`
                    }
                  ]
                },
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "text",
                      "text": "ขายออก",
                      "align": "start"
                    },
                    {
                      "type": "text",
                      "align": "end",
                      "text": `${data.barBuy}`,
                      "color": `${data.barBuyColor}`
                    }
                  ]
                }
              ],
              "paddingAll": "10px",
              "backgroundColor": "#FFD700",
              "cornerRadius": "5px",
              "margin": "xl"
            },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "text",
                      "text": "ทองรูปพรรณ",
                      "size": "md",
                      "weight": "bold",
                      "offsetBottom": "none"
                    }
                  ],
                  "paddingTop": "sm",
                  "paddingBottom": "sm"
                },
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "text",
                      "text": "รับซื้อ",
                      "align": "start"
                    },
                    {
                      "type": "text",
                      "align": "end",
                      "text": `${data.jewelrySell}`,
                      "color": `${data.jewelrySellColor}`
                    }
                  ]
                },
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "text",
                      "text": "ขายออก",
                      "align": "start"
                    },
                    {
                      "type": "text",
                      "align": "end",
                      "text": `${data.jewelryBuy}`,
                      "color": `${data.jewelryBuyColor}`
                    }
                  ]
                }
              ],
              "paddingAll": "10px",
              "backgroundColor": "#FFD700",
              "cornerRadius": "5px",
              "margin": "xl"
            },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "text",
                      "text": "วันนี้",
                      "color": `${data.changeColor}`,
                      "align": "start"
                    },
                    {
                      "type": "text",
                      "text": `${data.change}`,
                      "weight": "bold",
                      "align": "end",
                      "color": `${data.changeColor}`
                    }
                  ],
                  "paddingTop": "lg",
                  "paddingEnd": "xs"
                }
              ],
              "paddingAll": "md"
            }
          ]
        }
      ],
      "paddingAll": "20px",
      "backgroundColor": "#464F69"
    },
    "footer": {
      "type": "box",
      "layout": "horizontal",
      "contents": [
        {
          "type": "text",
          "text": `${data.updateAt}`,
          "align": "center",
          "size": "xs",
        }
      ]
    }
  };
  return bubbleMessageTpl;
};

const signIn = () => {
  const image = utils.randomItems(IMAGE_URLS);
  const bubble = [
    {
      type: 'bubble',
      hero: {
        type: 'image',
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
        url: `${image}`,
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: 'TO THE MOON 🚀 🌕',
            wrap: true,
            weight: 'bold',
            size: 'md',
            color: '#B2A4FF',
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              {
                type: 'text',
                text: '🫢 คุณยังไม่ได้ลงชื่อใช้งานหรือเซสชันหมด ช่วยลงชื่อเข้าใช้งานก่อนนะจ๊ะ',
                wrap: true,
                weight: 'bold',
                size: 'sm',
                flex: 0,
                margin: 'none',
              },
            ],
            margin: 'lg',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'uri',
              label: '🔑 เข้าสู่ระบบ ',
              uri: `${env.FRONTEND_URL}`,
            },
            color: '#14C38E',
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
      type: 'bubble',
      size: 'giga',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'image',
            url: 'https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif',
            size: 'full',
            aspectMode: 'cover',
            aspectRatio: '4:3',
            gravity: 'top',
            animated: true,
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '...ข่อยขอบอกอีหยั่งแน่',
                    size: 'xl',
                    color: '#383E56',
                    weight: 'bold',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: 'ตัวเจ้าเลือกเบิ่งมันบ่มีเด้อ!',
                    color: '#383E56',
                    size: 'sm',
                    flex: 0,
                  },
                ],
                spacing: 'lg',
              },
            ],
            position: 'relative',
            offsetBottom: '0px',
            offsetStart: '0px',
            offsetEnd: '0px',
            backgroundColor: '#FABEA7',
            paddingAll: '20px',
            paddingTop: '18px',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '404',
                color: '#ffffff',
                align: 'center',
                size: 'xs',
                offsetTop: '3px',
                weight: 'bold',
              },
            ],
            position: 'absolute',
            cornerRadius: '20px',
            offsetTop: '18px',
            backgroundColor: '#ff334b',
            offsetStart: '18px',
            height: '25px',
            width: '53px',
          },
        ],
        paddingAll: '0px',
      },
    },
  ];
};
export const bubbleTemplate = {
  lottery,
  cryptoCurrency,
  gold,
  signIn,
  notFound,
};
import { CryptoInfo } from '~/features/crypto/types/crypto.interface';
import randomColor from './randomColor';
import { utils } from '.';
import { IMAGE_GOLD_URLS, IMAGE_URLS } from '~/lib/constants/common.constant';
import { env } from 'process';
import { 
  formatHours, 
  formatPercentage 
} from '~/lib/utils/number';

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
        "backgroundColor": "#7A8299"
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
      "backgroundColor": "#7A8299"
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

const workCheckIn = () => {
  return [
    {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '⏰ ระบบลงชื่อเข้างาน',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
            align: 'center'
          }
        ],
        backgroundColor: '#7BB3A9',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📅 วันนี้คุณพร้อมทำงานแล้วใช่ไหม?',
            weight: 'bold',
            size: 'lg',
            wrap: true,
            align: 'center',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'นโยบายบริษัท: จันทร์-ศุกร์ เข้างาน 08:00-11:00 น.\nทำงาน 9 ชม./วัน (รวมพักกลางวัน 1 ชม.)',
            wrap: true,
            size: 'sm',
            color: '#8A8A8A',
            align: 'center',
            margin: 'lg'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: 'กดปุ่มด้านล่างเพื่อลงชื่อเข้างาน\nระบบจะคำนวณเวลาเลิกงานให้อัตโนมัติ',
            wrap: true,
            size: 'sm',
            color: '#8A8A8A',
            align: 'center',
            margin: 'lg'
          }
        ],
        paddingAll: '20px'
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
              type: 'postback',
              label: '🟢 เข้างาน',
              data: 'action=checkin'
            },
            color: '#7BB3A9',
            height: 'md'
          },
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: '📊 ดูสถานะการทำงาน',
              data: 'action=status'
            },
            height: 'sm'
          }
        ],
        paddingAll: '20px'
      }
    }
  ];
};

const workCheckInSuccess = (checkInTime: Date, expectedCheckOutTime: Date) => {
  const checkInTimeStr = checkInTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const checkOutTimeStr = expectedCheckOutTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit'
  });

  const dateStr = checkInTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return [
    {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '✅ ลงชื่อเข้างานสำเร็จ',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
            align: 'center'
          }
        ],
        backgroundColor: '#7BB3A9',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `📅 ${dateStr}`,
            weight: 'bold',
            size: 'md',
            wrap: true,
            align: 'center',
            margin: 'md',
            color: '#5A5A5A'
          },
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'xl',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🕐 เวลาเข้างาน:',
                    size: 'sm',
                    color: '#777777',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: checkInTimeStr,
                    weight: 'bold',
                    size: 'sm',
                    color: '#7BB3A9',
                    align: 'end'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🕔 เวลาเลิกงาน (คาด):',
                    size: 'sm',
                    color: '#777777',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: checkOutTimeStr,
                    weight: 'bold',
                    size: 'sm',
                    color: '#FFB366',
                    align: 'end'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '⏱️ ชั่วโมงทำงาน:',
                    size: 'sm',
                    color: '#777777',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: '9 ชั่วโมง',
                    weight: 'bold',
                    size: 'sm',
                    color: '#6BB6FF',
                    align: 'end'
                  }
                ]
              }
            ]
          }
        ],
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: '🔴 ออกงาน',
              data: 'action=checkout'
            },
            color: '#E57373'
          }
        ],
        paddingAll: '20px'
      }
    }
  ];
};

const workCheckInEarlySuccess = (actualCheckInTime: Date, recordedCheckInTime: Date, expectedCheckOutTime: Date) => {
  const actualTimeStr = actualCheckInTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const recordedTimeStr = recordedCheckInTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const checkOutTimeStr = expectedCheckOutTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit'
  });

  const dateStr = actualCheckInTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return [
    {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '⏰ ลงชื่อเข้างานเร็ว',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
            align: 'center'
          }
        ],
        backgroundColor: '#FFB366',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: dateStr,
            size: 'sm',
            color: '#8A8A8A',
            align: 'center'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🚪 มาถึงสำนักงาน:',
                    size: 'sm',
                    color: '#777777',
                    flex: 3
                  },
                  {
                    type: 'text',
                    text: `${actualTimeStr} น.`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#FFB366',
                    flex: 2,
                    align: 'end'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '⏰ เริ่มนับเวลาทำงาน:',
                    size: 'sm',
                    color: '#777777',
                    flex: 3
                  },
                  {
                    type: 'text',
                    text: `${recordedTimeStr} น.`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#7BB3A9',
                    flex: 2,
                    align: 'end'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🏁 เลิกงาน:',
                    size: 'sm',
                    color: '#777777',
                    flex: 3
                  },
                  {
                    type: 'text',
                    text: `${checkOutTimeStr} น.`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#6BB6FF',
                    flex: 2,
                    align: 'end'
                  }
                ]
              }
            ]
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            backgroundColor: '#F5F5F5',
            cornerRadius: '8px',
            paddingAll: '12px',
            contents: [
              {
                type: 'text',
                text: '📋 นโยบายบริษัท',
                size: 'sm',
                weight: 'bold',
                color: '#5A5A5A',
                align: 'center'
              },
              {
                type: 'text',
                text: '• การเข้างานก่อน 08:00 น. จะนับเวลาทำงานตั้งแต่ 08:00 น.',
                size: 'xs',
                color: '#8A8A8A',
                wrap: true,
                margin: 'sm'
              },
              {
                type: 'text',
                text: '• ทำงาน 9 ชั่วโมง (รวมพักเที่ยง 1 ชั่วโมง)',
                size: 'xs',
                color: '#8A8A8A',
                wrap: true
              }
            ]
          }
        ],
        paddingAll: '20px'
      }
    }
  ];
};

const workStatus = (attendance: any) => {
  const checkInTimeStr = attendance.checkInTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit'
  });

  const expectedCheckOutTime = new Date(attendance.checkInTime.getTime() + 9 * 60 * 60 * 1000);
  const expectedCheckOutTimeStr = expectedCheckOutTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit'
  });

  const dateStr = attendance.checkInTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isCheckedOut = attendance.status === 'checked_out';
  const statusText = isCheckedOut ? '✅ ออกงานแล้ว' : '🟢 กำลังทำงาน';
  const statusColor = isCheckedOut ? '#7BB3A9' : '#FFB366';

  let checkOutTimeContent: any[] = [];
  if (isCheckedOut && attendance.checkOutTime) {
    const checkOutTimeStr = attendance.checkOutTime.toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit'
    });
    checkOutTimeContent = [
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'text',
            text: '🕐 เวลาออกงาน:',
            size: 'sm',
            color: '#777777',
            flex: 0
          },
          {
            type: 'text',
            text: checkOutTimeStr,
            weight: 'bold',
            size: 'sm',
            color: '#7BB3A9',
            align: 'end'
          }
        ]
      }
    ];
  }

  return [
    {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📊 สถานะการทำงาน',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
            align: 'center'
          }
        ],
        backgroundColor: statusColor,
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: statusText,
            weight: 'bold',
            size: 'lg',
            align: 'center',
            margin: 'md',
            color: statusColor
          },
          {
            type: 'text',
            text: `📅 ${dateStr}`,
            size: 'sm',
            wrap: true,
            align: 'center',
            color: '#8A8A8A'
          },
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'xl',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🕐 เวลาเข้างาน:',
                    size: 'sm',
                    color: '#777777',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: checkInTimeStr,
                    weight: 'bold',
                    size: 'sm',
                    color: '#7BB3A9',
                    align: 'end'
                  }
                ]
              },
              ...checkOutTimeContent,
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🕔 เวลาเลิกงาน (คาด):',
                    size: 'sm',
                    color: '#777777',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: expectedCheckOutTimeStr,
                    weight: 'bold',
                    size: 'sm',
                    color: '#FFB366',
                    align: 'end'
                  }
                ]
              }
            ]
          }
        ],
        paddingAll: '20px'
      },
      footer: !isCheckedOut ? {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'postback',
              label: '🔴 ออกงาน',
              data: 'action=checkout'
            },
            color: '#E57373'
          }
        ],
        paddingAll: '20px'
      } : undefined
    }
  ];
};

const workAlreadyCheckedIn = (checkInTime: Date) => {
  return workStatus({
    checkInTime,
    status: 'checked_in',
    checkOutTime: null
  });
};

const workCheckOutSuccess = (checkInTime: Date, checkOutTime: Date) => {
  const checkInTimeStr = checkInTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const checkOutTimeStr = checkOutTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit'
  });

  const dateStr = checkInTime.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate actual work hours
  const workDurationMs = checkOutTime.getTime() - checkInTime.getTime();
  const workHours = Math.floor(workDurationMs / (1000 * 60 * 60));
  const workMinutes = Math.floor((workDurationMs % (1000 * 60 * 60)) / (1000 * 60));

  return [
    {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '✅ ออกงานสำเร็จ',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
            align: 'center'
          }
        ],
        backgroundColor: '#7BB3A9',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `📅 ${dateStr}`,
            weight: 'bold',
            size: 'md',
            wrap: true,
            align: 'center',
            margin: 'md',
            color: '#5A5A5A'
          },
          {
            type: 'text',
            text: 'ขอบคุณสำหรับการทำงานวันนี้! 🎉',
            size: 'sm',
            wrap: true,
            align: 'center',
            color: '#8A8A8A'
          },
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'xl',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🕐 เวลาเข้างาน:',
                    size: 'sm',
                    color: '#777777',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: checkInTimeStr,
                    weight: 'bold',
                    size: 'sm',
                    color: '#7BB3A9',
                    align: 'end'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🕔 เวลาออกงาน:',
                    size: 'sm',
                    color: '#777777',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: checkOutTimeStr,
                    weight: 'bold',
                    size: 'sm',
                    color: '#7BB3A9',
                    align: 'end'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '⏱️ ชั่วโมงทำงาน:',
                    size: 'sm',
                    color: '#777777',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: `${workHours} ชม. ${workMinutes} นาที`,
                    weight: 'bold',
                    size: 'sm',
                    color: '#6BB6FF',
                    align: 'end'
                  }
                ]
              }
            ]
          }
        ],
        paddingAll: '20px'
      }
    }
  ];
};

const workError = (message: string) => {
  return [
    {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '⚠️ เกิดข้อผิดพลาด',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
            align: 'center'
          }
        ],
        backgroundColor: '#E57373',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: message,
            wrap: true,
            size: 'md',
            align: 'center',
            margin: 'md',
            color: '#E57373'
          }
        ],
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: 'ลองใหม่',
              data: 'action=checkin_menu'
            }
          }
        ],
        paddingAll: '20px'
      }
    }
  ];
};

const monthlyReportMenu = () => {
  return {
    "type": "bubble",
    "size": "mega",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "📊 รายงานการเข้างานรายเดือน",
          "weight": "bold",
          "size": "xl",
          "color": "#ffffff"
        }
      ],
      "backgroundColor": "#8B7FE5",
      "paddingAll": "20px"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "เลือกเดือนที่ต้องการดูรายงาน",
          "size": "md",
          "color": "#374151",
          "margin": "md"
        },
        {
          "type": "separator",
          "margin": "xl"
        },
        {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "button",
              "action": {
                "type": "postback",
                "label": "เดือนปัจจุบัน",
                "data": "action=monthly_report&month=current"
              },
              "style": "primary",
              "color": "#8B7FE5",
              "margin": "md"
            },
            {
              "type": "button",
              "action": {
                "type": "postback",
                "label": "เดือนที่แล้ว",
                "data": "action=monthly_report&month=previous"
              },
              "style": "secondary",
              "margin": "md"
            },
            {
              "type": "button",
              "action": {
                "type": "uri",
                "label": "รายงานแบบละเอียดพร้อมกราฟ",
                "uri": `${env.NEXTAUTH_URL}/attendance-report`
              },
              "style": "link",
              "margin": "md",
              "color": "#5FB691"
            }
          ],
          "margin": "xl"
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "สามารถดูรายงานย้อนหลังได้ที่เว็บไซต์",
          "size": "xs",
          "color": "#9ca3af",
          "align": "center"
        }
      ],
      "margin": "sm"
    }
  };
};

const monthlyReportSummary = (report: any) => {
  const monthName = new Date(report.month + '-01').toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long'
  });

  return {
    "type": "bubble",
    "size": "mega",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": `📊 รายงานประจำเดือน${monthName}`,
          "weight": "bold",
          "size": "lg",
          "color": "#ffffff",
          "wrap": true
        }
      ],
      "backgroundColor": "#5FB691",
      "paddingAll": "20px"
    },
    "body": {
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
                  "type": "text",
                  "text": "วันที่ทำงาน",
                  "size": "sm",
                  "color": "#6b7280"
                },
                {
                  "type": "text",
                  "text": `${report.totalDaysWorked} วัน`,
                  "weight": "bold",
                  "size": "xl",
                  "color": "#5FB691"
                }
              ],
              "flex": 1
            },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "ชั่วโมงรวม",
                  "size": "sm",
                  "color": "#6b7280"
                },
                {
                  "type": "text",
                  "text": formatHours(report.totalHoursWorked),
                  "weight": "bold",
                  "size": "xl",
                  "color": "#5FB691"
                }
              ],
              "flex": 1
            }
          ],
          "margin": "lg"
        },
        {
          "type": "separator",
          "margin": "xl"
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "เปอร์เซ็นต์การเข้างาน",
                  "size": "sm",
                  "color": "#6b7280"
                },
                {
                  "type": "text",
                  "text": formatPercentage(report.attendanceRate),
                  "weight": "bold",
                  "size": "xl",
                  "color": "#dc2626"
                }
              ],
              "flex": 1
            },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "ชั่วโมงเฉลี่ย/วัน",
                  "size": "sm",
                  "color": "#6b7280"
                },
                {
                  "type": "text",
                  "text": formatHours(report.averageHoursPerDay),
                  "weight": "bold",
                  "size": "xl",
                  "color": "#dc2626"
                }
              ],
              "flex": 1
            }
          ],
          "margin": "xl"
        },
        {
          "type": "separator",
          "margin": "xl"
        },
        {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "อัตราการทำงานครบเวลา",
              "size": "sm",
              "color": "#6b7280",
              "align": "center"
            },
            {
              "type": "text",
              "text": `${formatPercentage(report.complianceRate)} (${report.completeDays} วัน ครบ 9 ชม.)`,
              "weight": "bold",
              "size": "md",
              "color": "#0891b2",
              "align": "center"
            }
          ],
          "margin": "lg"
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "button",
          "action": {
            "type": "uri",
            "label": "ดูรายละเอียดทั้งหมด",
            "uri": `${env.NEXTAUTH_URL}/attendance-report?month=${report.month}`
          },
          "style": "primary",
          "color": "#5FB691"
        }
      ]
    }
  };
};

const workplacePolicyInfo = () => {
  return {
    type: 'bubble',
    size: 'giga',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '📋 นโยบายการทำงานบริษัท',
          weight: 'bold',
          size: 'xl',
          color: '#ffffff',
          align: 'center'
        }
      ],
      backgroundColor: '#5B7FD3',
      paddingAll: '20px'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '1. การเข้าสำนักงาน',
              weight: 'bold',
              size: 'md',
              color: '#5B7FD3',
              margin: 'md'
            },
            {
              type: 'text',
              text: '• จันทร์ ถึง ศุกร์ (5 วันต่อสัปดาห์)\n• ทุกกลุ่มงานและทุกระดับงาน',
              wrap: true,
              size: 'sm',
              color: '#374151',
              margin: 'sm'
            }
          ]
        },
        {
          type: 'separator',
          margin: 'lg'
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '2. เวลาทำงาน',
              weight: 'bold',
              size: 'md',
              color: '#5B7FD3',
              margin: 'md'
            },
            {
              type: 'text',
              text: '• รวม 9 ชั่วโมงต่อวัน (รวมพักกลางวัน 1 ชม.)\n• เวลาปฏิบัติงานจริง 8 ชั่วโมงต่อวัน\n• เวลาเข้างานยืดหยุ่น: 08:00 - 11:00 น.',
              wrap: true,
              size: 'sm',
              color: '#374151',
              margin: 'sm'
            }
          ]
        },
        {
          type: 'separator',
          margin: 'lg'
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '3. การบันทึกเวลา',
              weight: 'bold',
              size: 'md',
              color: '#5B7FD3',
              margin: 'md'
            },
            {
              type: 'text',
              text: '• บันทึกเข้า-ออกงานที่เครื่องบันทึกเวลา\n• หน้าประตูทางเข้า-ออก (ประตูใหญ่)\n• ระบบนับ 9 ชั่วโมงรวมพัก 1 ชั่วโมง',
              wrap: true,
              size: 'sm',
              color: '#374151',
              margin: 'sm'
            }
          ]
        }
      ],
      paddingAll: '20px'
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          style: 'primary',
          action: {
            type: 'postback',
            label: '📝 ลงชื่อเข้างาน',
            data: 'action=checkin_menu'
          },
          color: '#5B7FD3'
        }
      ],
      paddingAll: '20px'
    }
  };
};

const workPublicHoliday = (holidayMessage: string) => {
  return [
    {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🗓️ วันหยุดประจำปี',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
            align: 'center'
          },
          {
            type: 'text',
            text: 'Public Holiday',
            size: 'sm',
            color: '#ffffff',
            align: 'center',
            margin: 'xs'
          }
        ],
        backgroundColor: '#ff9800',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: holidayMessage,
            wrap: true,
            size: 'md',
            align: 'center',
            margin: 'md',
            color: '#ff9800',
            weight: 'bold'
          },
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'text',
            text: '📅 วันทำงาน: จันทร์ - ศุกร์',
            size: 'sm',
            color: '#8A8A8A',
            align: 'center',
            margin: 'lg'
          },
          {
            type: 'text',
            text: '⏰ เวลาทำงาน: 08:00 - 17:00 น.',
            size: 'sm',
            color: '#8A8A8A',
            align: 'center'
          }
        ],
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: '📋 ดูนโยบายการทำงาน',
              data: 'action=work_policy'
            },
            color: '#ff9800'
          }
        ],
        paddingAll: '20px'
      }
    }
  ];
};

export const bubbleTemplate = {
  lottery,
  cryptoCurrency,
  gold,
  signIn,
  notFound,
  workCheckIn,
  workCheckInSuccess,
  workCheckInEarlySuccess,
  workStatus,
  workAlreadyCheckedIn,
  workCheckOutSuccess,
  workError,
  monthlyReportMenu,
  monthlyReportSummary,
  workplacePolicyInfo,
  workPublicHoliday
};
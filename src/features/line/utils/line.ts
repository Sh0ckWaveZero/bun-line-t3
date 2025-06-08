import { CryptoInfo } from '~/features/crypto/types/crypto.interface';
import randomColor from '~/lib/validation/randomColor';
import { utils } from '~/lib/validation';
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
        backgroundColor: '#c8e6c9', // พาสเทลเขียว - นุ่มนวล
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
            text: 'กดปุ่มด้านล่างเพื่อลงชื่อเข้างาน ระบบจะคำนวณเวลาเลิกงานให้อัตโนมัติ (9 ชั่วโมงทำงาน)',
            wrap: true,
            size: 'sm',
            color: '#9e9e9e', // สีเทาอ่อนนุ่มนวล
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
            color: '#81c784', // เขียวพาสเทลสำหรับปุ่ม
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
        backgroundColor: '#c8e6c9', // พาสเทลเขียว - นุ่มนวล
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
            color: '#757575' // เทาอ่อนนุ่มนวล
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
                    color: '#9e9e9e', // เทาอ่อนนุ่มนวล
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: checkInTimeStr,
                    weight: 'bold',
                    size: 'sm',
                    color: '#81c784', // เขียวพาสเทล
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
                    color: '#9e9e9e', // เทาอ่อนนุ่มนวล
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: checkOutTimeStr,
                    weight: 'bold',
                    size: 'sm',
                    color: '#ffcc80', // ส้มพาสเทล
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
                    color: '#9e9e9e', // เทาอ่อนนุ่มนวล
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: '9 ชั่วโมง',
                    weight: 'bold',
                    size: 'sm',
                    color: '#90caf9', // ฟ้าพาสเทล
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
            color: '#ffab91' // แดงพาสเทล
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
  const statusColor = isCheckedOut ? '#c8e6c9' : '#ffcc80'; // พาสเทลเขียวและส้ม

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
            color: '#9e9e9e', // เทาอ่อนนุ่มนวล
            flex: 0
          },
          {
            type: 'text',
            text: checkOutTimeStr,
            weight: 'bold',
            size: 'sm',
            color: '#81c784', // เขียวพาสเทล
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
            color: '#9e9e9e' // เทาอ่อนนุ่มนวล
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
                    color: '#9e9e9e', // เทาอ่อนนุ่มนวล
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: checkInTimeStr,
                    weight: 'bold',
                    size: 'sm',
                    color: '#81c784', // เขียวพาสเทล
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
                    color: '#9e9e9e', // เทาอ่อนนุ่มนวล
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: expectedCheckOutTimeStr,
                    weight: 'bold',
                    size: 'sm',
                    color: '#ffcc80', // ส้มพาสเทล
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
            color: '#ffab91' // แดงพาสเทล
          }
        ],
        paddingAll: '20px'
      } : undefined
    }
  ];
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
        backgroundColor: '#c8e6c9', // พาสเทลเขียว - นุ่มนวล
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
            color: '#757575' // เทาอ่อนนุ่มนวล
          },
          {
            type: 'text',
            text: 'ขอบคุณสำหรับการทำงานวันนี้! 🎉',
            size: 'sm',
            wrap: true,
            align: 'center',
            color: '#9e9e9e' // เทาอ่อนนุ่มนวล
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
                    color: '#9e9e9e', // เทาอ่อนนุ่มนวล
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: checkInTimeStr,
                    weight: 'bold',
                    size: 'sm',
                    color: '#81c784', // เขียวพาสเทล
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
                    color: '#9e9e9e', // เทาอ่อนนุ่มนวล
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: checkOutTimeStr,
                    weight: 'bold',
                    size: 'sm',
                    color: '#81c784', // เขียวพาสเทล
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
                    color: '#9e9e9e', // เทาอ่อนนุ่มนวล
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: `${workHours} ชม. ${workMinutes} นาที`,
                    weight: 'bold',
                    size: 'sm',
                    color: '#90caf9', // ฟ้าพาสเทล
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

const workError = (message: string, errorType: 'error' | 'warning' | 'info' = 'error') => {
  // 🚀 การกำหนดค่าตาม error type แบบ functional - โทนพาสเทลนุ่มนวล
  const errorConfig = {
    error: {
      icon: '⚠️',
      title: 'เกิดข้อผิดพลาด',
      backgroundColor: '#ffb3ba', // พาสเทลแดง - นุ่มนวล
      textColor: '#d32f2f',      // แดงเข้มอ่อนลง
      buttonLabel: 'ลองใหม่',
      buttonData: 'action=checkin_menu'
    },
    warning: {
      icon: '⚡',
      title: 'คำเตือน',
      backgroundColor: '#ffd4a3', // พาสเทลส้ม - อบอุ่น
      textColor: '#e65100',      // ส้มเข้มอ่อนลง
      buttonLabel: 'เข้าใจแล้ว',
      buttonData: 'action=checkin_menu'
    },
    info: {
      icon: 'ℹ️',
      title: 'ข้อมูล',
      backgroundColor: '#a3d5ff', // พาสเทลฟ้า - สงบ
      textColor: '#1565c0',      // ฟ้าเข้มอ่อนลง
      buttonLabel: 'ตกลง',
      buttonData: 'action=checkin_menu'
    }
  } as const;

  // 🚀 ใช้ config ที่เลือกตาม type
  const config = errorConfig[errorType];
  
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
            text: `${config.icon} ${config.title}`,
            weight: 'bold',
            size: 'xl',
            color: '#ffffff',
            align: 'center'
          }
        ],
        backgroundColor: config.backgroundColor,
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
            color: config.textColor
          },
          ...(errorType === 'error' ? [
            {
              type: 'separator',
              margin: 'xl'
            },
            {
              type: 'text',
              text: '💡 หากปัญหายังคงเกิดขึ้น กรุณาติดต่อทีมงาน',
              wrap: true,
              size: 'xs',
              align: 'center',
              margin: 'md',
              color: '#9e9e9e' // สีเทาอ่อนนุ่มนวล
            }
          ] : [])
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
            style: errorType === 'error' ? 'secondary' : 'primary',
            action: {
              type: 'postback',
              label: config.buttonLabel,
              data: config.buttonData
            },
            color: errorType === 'error' ? undefined : config.backgroundColor
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
      "backgroundColor": "#b39ddb", // ม่วงพาสเทล
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
          "color": "#9e9e9e", // เทาอ่อนนุ่มนวล
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
              "color": "#b39ddb", // ม่วงพาสเทล
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
                "label": "ดูรายงานแบบละเอียด",
                "uri": `${env.NEXTAUTH_URL}/attendance-report`
              },
              "style": "link",
              "margin": "md"
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
          "color": "#bdbdbd", // เทาอ่อนมากขึ้น
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
      "backgroundColor": "#a5d6a7", // เขียวพาสเทลเข้ม
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
                  "color": "#9e9e9e" // เทาอ่อนนุ่มนวล
                },
                {
                  "type": "text",
                  "text": `${report.totalDaysWorked} วัน`,
                  "weight": "bold",
                  "size": "xl",
                  "color": "#81c784" // เขียวพาสเทล
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
                  "color": "#9e9e9e" // เทาอ่อนนุ่มนวล
                },
                {
                  "type": "text",
                  "text": formatHours(report.totalHoursWorked),
                  "weight": "bold",
                  "size": "xl",
                  "color": "#81c784" // เขียวพาสเทล
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
                  "color": "#9e9e9e" // เทาอ่อนนุ่มนวล
                },
                {
                  "type": "text",
                  "text": formatPercentage(report.attendanceRate),
                  "weight": "bold",
                  "size": "xl",
                  "color": "#ef9a9a" // แดงพาสเทล
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
                  "color": "#9e9e9e" // เทาอ่อนนุ่มนวล
                },
                {
                  "type": "text",
                  "text": formatHours(report.totalHoursWorked / Math.max(report.totalDaysWorked, 1)),
                  "weight": "bold",
                  "size": "xl",
                  "color": "#ef9a9a" // แดงพาสเทล
                }
              ],
              "flex": 1
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
          "type": "button",
          "action": {
            "type": "uri",
            "label": "ดูรายละเอียดทั้งหมด",
            "uri": `${env.NEXTAUTH_URL}/attendance-report?month=${report.month}`
          },
          "style": "primary",
          "color": "#a5d6a7" // เขียวพาสเทลเข้ม
        }
      ]
    }
  };
};

const workAlreadyCheckedIn = (checkInTime: Date) => {
  return workStatus({
    checkInTime,
    status: 'checked_in',
    checkOutTime: null
  });
};

export const bubbleTemplate = {
  lottery,
  cryptoCurrency,
  gold,
  signIn,
  notFound,
  workCheckIn,
  workCheckInSuccess,
  workStatus,
  workAlreadyCheckedIn,
  workCheckOutSuccess,
  workError,
  monthlyReportMenu,
  monthlyReportSummary,
};
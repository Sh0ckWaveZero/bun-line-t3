import { CONSOLATION, IMAGE_GOLD_URLS, IMAGE_URLS } from '~/config/common.constant';
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { CryptoInfo } from '~/interface';
import randomColor from '~/utils/randomColor';
import { utils } from '~/utils';
import { exchangeService } from './exchange';
import { db } from "~/server/db";
import { env } from '~/env.mjs';

const handleEvent = (req: NextApiRequest,
  res: NextApiResponse): any => {
  const events = req.body.events;
  events.forEach((event: any) => {
    switch (event.type) {
      case 'message':
        switch (event.message.type) {
          case 'text':
            handleLogin(req, event.message.text);
            break;
          case 'sticker':
            handleSticker(req, event);
            break;
          default:
            res.status(401).send('Invalid token');
            break;
        }
        break;
      default:
        res.status(401).send('Invalid token');
    }
  });
}

const handleLogin = async (req: NextApiRequest, message: string) => {
  const prefix = message[0];

  // reject not en lang
  if (prefix !== '/' && prefix !== '$') {
    return;
  }

  const userId = req.body.events[0].source.userId;
  const userPermission: any = await db.account.findFirst({
    where: {
      providerAccountId: userId,
    },
  });

  if (
    !userPermission ||
    !utils.compareDate(userPermission?.expires_at, new Date().toISOString())
  ) {
    const payload = bubbleSignIn();
    return sendMessage(req, flexMessage(payload));
  }

  if (prefix === '/') {
    handleText(req, message);
  }
}

const handleText = async (req: NextApiRequest, message: string): Promise<void> => {
  const commandList: any[] = message.split(' ');
  const command = commandList[0]?.slice(1).toLowerCase();
  const currency = commandList.slice(1).filter((c) => c !== '');
  handleCommand(command, currency, req);
}

const handleSticker = (req: NextApiRequest, event: any) => {
  const keywords: string[] = ['Sad', 'Crying', 'Tears', 'anguish'];
  if (event.message.keywords.some((k: any) => keywords.includes(k))) {
    const text: string = utils.randomItems(CONSOLATION);
    sendMessage(req, [{ type: 'text', text: text }]);
  }
}

const handleCommand = async (command: string, currency: any[], req: NextApiRequest) => {
  const exchangeName = command;
  let promises: any[] = [];
  let options: string = '';

  switch (exchangeName) {
    case 'bk' || 'bitkub':
      currency.forEach((_currency: any) => {
        promises.push(exchangeService.getBitkub(_currency));
      });
      break;
    case 'st' || 'satang':
      currency.forEach((_currency: any) => {
        promises.push(exchangeService.getSatangCorp(_currency));
      });
      break;
    case 'btz' || 'bitazza':
      currency.forEach((_currency: any) => {
        promises.push(exchangeService.getBitazza(_currency));
      });
      break;
    case 'bn' || 'binance':
      currency.forEach((_currency: any) => {
        promises.push(exchangeService.getBinance(_currency, 'USDT'));
      });
      break;
    case 'bnbusd':
      currency.forEach((_currency: any) => {
        promises.push(exchangeService.getBinance(_currency, 'BUSD'));
      });
      break;
    case 'gate' || 'gateio' || 'gt':
      currency.forEach((_currency: any) => {
        promises.push(exchangeService.getGeteio(_currency));
      });
      break;
    case 'mexc' || 'mx':
      currency.forEach((_currency: any) => {
        promises.push(exchangeService.getMexc(_currency));
      });
      break;
    case 'cmc' || 'coinmarketcap':
      currency.forEach((_currency: any) => {
        promises.push(exchangeService.getCoinMarketCap(_currency));
      });
      break;
    case 'gold' || 'ทอง':
      promises = [exchangeService.getGoldPrice()];
      options = 'gold';
      break;
    case 'gas' || 'น้ำมัน':
      if (currency.length === 0) replyNotFound(req);
      promises = [exchangeService.getGasPrice(currency[0])];
      break;
    default:
      replyNotFound(req);
      return;
  }

  await getFlexMessage(req, promises, options);
}

const getFlexMessage = async (req: any, data: any[], options?: string) => {
  try {
    const items = await Promise.all(data);
    if (utils.isEmpty(items[0])) {
      replyNotFound(req);
      return;
    }
    replyRaw(req, items, options);
  } catch (err: any) {
    console.error(err?.message);
  }
}

const replyRaw = async (req: Request, cryptoInfoItems: any[], options?: string) => {
  const bubbleItems: any[] = [];
  for (const index in cryptoInfoItems) {
    if (options === 'gold') {
      bubbleItems.push(bubbleGoldMessage(cryptoInfoItems[index]));
    } else {
      bubbleItems.push(bubbleMessage(cryptoInfoItems[index]));
    }
  }

  Promise.all(bubbleItems)
    .then(async (items) => {
      const payload = flexMessage(items);
      sendMessage(req, payload);
    })
    .catch((err) => {
      console.error('error: ', err.message);
    });
};


const bubbleMessage = (data: CryptoInfo): any => {
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
}

const bubbleSignIn = () => {
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

const bubbleGoldMessage = (data: any): any => {
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
}

const replyNotFound = (req: NextApiRequest) => {
  const msg = [
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
  const payload = flexMessage(msg);
  sendMessage(req, payload);
}

const flexMessage = (bubbleItems: any[]) => {
  return [
    {
      type: 'flex',
      altText: 'CryptoInfo',
      contents: {
        type: 'carousel',
        contents: bubbleItems,
      },
    },
  ];
}

const sendMessage = (req: any, payload: any) => {
  try {
    const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
    const lineHeader = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lineChannelAccessToken}`,
    };

    return axios({
      method: 'post',
      url: `${env.LINE_MESSAGING_API}/reply`,
      headers: lineHeader,
      data: JSON.stringify({
        replyToken: req.body.events[0].replyToken,
        messages: payload,
      }),
    });
  } catch (err: any) {
    console.error(err.message);
  }
};


export const lineService = {
  handleEvent,
}
import { CONSOLATION } from '~/config/common.constant';
import { NextApiRequest, NextApiResponse } from 'next';
import { utils } from '~/utils';
import { exchangeService } from './exchange';
import { db } from "~/server/db";
import { env } from '~/env.mjs';
import { bubbleTemplate } from '~/utils/line';
import { airVisualService } from './airvisual';

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
          case 'location':
            handleLocation(req, event);
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
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }

  if (prefix === '/') {
    handleText(req, message);
  }
}

const handleLocation = async (req: NextApiRequest, event: any) => {
  try {
    const location: any = await airVisualService.getNearestCity(
      event.message.latitude,
      event.message.longitude,
    );
    const msg = airVisualService.getNearestCityBubble(
      location.data.current.pollution.aqius,
      location.data.current.pollution.ts,
    );
    sendMessage(req, flexMessage(msg));
  } catch (err: any) {
    replyNotFound(req);
    return;
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

const handleCommand = async (command: string, conditions: any[], req: NextApiRequest) => {
  const exchangeName = command;
  let promises: any[] = [];
  let options: string = '';

  switch (exchangeName) {
    case 'bk' || 'bitkub':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getBitkub(condition));
      });
      break;
    case 'st' || 'satang':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getSatangCorp(condition));
      });
      break;
    case 'btz' || 'bitazza':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getBitazza(condition));
      });
      break;
    case 'bn' || 'binance':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getBinance(condition, 'USDT'));
      });
      break;
    case 'bnbusd':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getBinance(condition, 'BUSD'));
      });
      break;
    case 'gate' || 'gateio' || 'gt':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getGeteio(condition));
      });
      break;
    case 'mexc' || 'mx':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getMexc(condition));
      });
      break;
    case 'cmc' || 'coinmarketcap':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getCoinMarketCap(condition));
      });
      break;
    case 'gold' || 'ทอง':
      promises = [exchangeService.getGoldPrice()];
      options = 'gold';
      break;
    case 'หวย' || 'lotto':
      promises = [exchangeService.getLotto(conditions)];
      options = 'lotto';
      break;
    case 'gas' || 'น้ำมัน':
      if (conditions.length === 0) replyNotFound(req);
      promises = [exchangeService.getGasPrice(conditions[0])];
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

const replyRaw = async (req: Request, infoItems: any[], options?: string) => {
  const bubbleItems: any[] = [];
  for (const index in infoItems) {
    switch (options) {
      case 'gold':
        bubbleItems.push(bubbleTemplate.gold(infoItems[index]));
        break;
      case 'lotto':
        const bubble = bubbleTemplate.lottery(infoItems[0]);
        bubble.forEach((b) => bubbleItems.push(b))
        break;
      default:
        bubbleItems.push(bubbleTemplate.cryptoCurrency(infoItems[index]));
        break;
    }
  }

  Promise.all(bubbleItems)
    .then(async (items) => {
      const payload = flexMessage(items);
      await sendMessage(req, payload);
    })
    .catch((err) => {
      console.error('error: ', err.message);
    });
};

const replyNotFound = (req: NextApiRequest) => {
  const payload = flexMessage(bubbleTemplate.notFound());
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

const sendMessage = async (req: any, payload: any) => {
  try {
    const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
    const lineHeader = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lineChannelAccessToken}`,
    };

    const response = await fetch(`${env.LINE_MESSAGING_API}/reply`, {
      method: 'POST',
      headers: lineHeader,
      body: JSON.stringify({
        replyToken: req.body.events[0].replyToken,
        messages: payload,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response;
  } catch (err: any) {
    console.error(err.message);
  }
};


export const lineService = {
  handleEvent,
}
import { CONSOLATION } from '~/lib/constants/common.constant';
import { NextApiRequest, NextApiResponse } from 'next';
import { utils } from '~/lib/validation';
import { exchangeService } from '~/features/crypto/services/exchange';
import { attendanceService } from '~/features/attendance/services/attendance';
import { db } from "~/lib/database/db";
import { env } from '~/env.mjs';
import { bubbleTemplate } from '~/lib/validation/line';
import { airVisualService } from '~/features/air-quality/services/airvisual';

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
      case 'postback':
        handlePostback(req, event);
        break;
      default:
        res.status(401).send('Invalid token');
    }
  });
}

const handleLogin = async (req: NextApiRequest, message: string) => {
  const prefix = message[0] || '';


  if (!new Set(['/', '$']).has(prefix)) {
    return;
  }

  const userId = req.body.events[0].source.userId;
  const userPermission: any = await db.account.findFirst({
    where: {
      providerAccountId: userId,
    },
  });

  const isPermissionExpired = !userPermission || !utils.compareDate(userPermission?.expires_at, new Date().toISOString());

  if (isPermissionExpired) {
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
      location
    );

    sendMessage(req, flexMessage(msg));
  } catch (err: any) {
    console.error('Location handling error:', err);
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
    case 'bk':
    case 'bitkub':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getBitkub(condition));
      });
      break;
    case 'st':
    case 'satang':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getSatangCorp(condition));
      });
      break;
    case 'btz':
    case 'bitazza':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getBitazza(condition));
      });
      break;
    case 'bn':
    case 'binance':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getBinance(condition, 'USDT'));
      });
      break;
    case 'bnbusd':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getBinance(condition, 'BUSD'));
      });
      break;
    case 'gate':
    case 'gateio':
    case 'gt':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getGeteio(condition));
      });
      break;
    case 'mexc':
    case 'mx':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getMexc(condition));
      });
      break;
    case 'cmc':
    case 'coinmarketcap':
      conditions.forEach((condition: any) => {
        promises.push(exchangeService.getCoinMarketCap(condition));
      });
      break;
    case 'gold':
    case 'ทอง':
      promises = [exchangeService.getGoldPrice()];
      options = 'gold';
      break;
    case 'หวย':
    case 'lotto':
      promises = [exchangeService.getLotto(conditions)];
      options = 'lotto';
      break;
    case 'gas':
    case 'น้ำมัน':
      if (conditions.length === 0) replyNotFound(req);
      promises = [exchangeService.getGasPrice(conditions[0])];
      break;
    case 'work':
    case 'งาน':
    case 'เข้างาน':
    case 'checkin':
      await handleWorkAttendanceCommand(req);
      return;
    case 'เลิกงาน':
    case 'ออกงาน':
    case 'checkout':
      const userId = req.body.events[0].source.userId;
      const userAccount = await db.account.findFirst({
        where: { providerAccountId: userId }
      });

      const isPermissionExpired = !userAccount || !userAccount.expires_at || !utils.compareDate(userAccount.expires_at.toString(), new Date().toISOString());

      if (isPermissionExpired) {
        const payload = bubbleTemplate.signIn();
        return sendMessage(req, flexMessage(payload));
      }

      if (userAccount?.userId) {
        await handleCheckOut(req, userAccount.userId);
      }
      return;
    case 'รายงาน':
    case 'report':
      await handleReportCommand(req);
      return;
    case 'สถานะ':
    case 'status':
      const statusUserId = req.body.events[0].source.userId;
      const statusUserAccount = await db.account.findFirst({
        where: { providerAccountId: statusUserId }
      });

      const isStatusPermissionExpired = !statusUserAccount || !statusUserAccount.expires_at || !utils.compareDate(statusUserAccount.expires_at.toString(), new Date().toISOString());

      if (isStatusPermissionExpired) {
        const payload = bubbleTemplate.signIn();
        return sendMessage(req, flexMessage(payload));
      }

      if (statusUserAccount?.userId) {
        await handleWorkStatus(req, statusUserAccount.userId);
      }
      return;
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

const sendRequest = async (url: string, method: string, headers: any, body: any) => {
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to send request');
    }

    return response;
  } catch (err: any) {
    console.error(err.message);
  }
};

const sendMessage = async (req: any, payload: any) => {
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };

  try {
    await sendLoadingAnimation(req);

    return sendRequest(`${env.LINE_MESSAGING_API}/reply`, 'POST', lineHeader, {
      replyToken: req.body.events[0].replyToken,
      messages: payload,
    });
  } catch (err: any) {
    console.error(err.message);
  }
};

const sendLoadingAnimation = async (req: any) => {
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };

  return sendRequest('https://api.line.me/v2/bot/chat/loading/start', 'POST', lineHeader, {
    chatId: req.body.events[0].source.userId,
    loadingSeconds: 5
  });
};

const handlePostback = async (req: NextApiRequest, event: any) => {
  const userId = req.body.events[0].source.userId;
  const data = event.postback.data;

  // Check user permission first
  const userPermission: any = await db.account.findFirst({
    where: {
      providerAccountId: userId,
    },
  });

  const isPermissionExpired = !userPermission || !utils.compareDate(userPermission?.expires_at, new Date().toISOString());

  if (isPermissionExpired) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }

  const params = new URLSearchParams(data);
  const action = params.get('action');

  switch (action) {
    case 'checkin':
      // Check current attendance status before allowing check-in
      const currentAttendance = await attendanceService.getTodayAttendance(userPermission.userId);
      
      if (currentAttendance) {
        // If already has attendance record, show current status instead of check-in
        const payload = bubbleTemplate.workStatus(currentAttendance);
        await sendMessage(req, flexMessage(payload));
      } else {
        // No attendance record, proceed with check-in
        await handleCheckIn(req, userPermission.userId);
      }
      break;
    case 'checkout':
      await handleCheckOut(req, userPermission.userId);
      break;
    case 'status':
      await handleWorkStatus(req, userPermission.userId);
      break;
    case 'checkin_menu':
      await handleCheckInMenu(req);
      break;
    case 'monthly_report':
      const month = params.get('month');
      await handleMonthlyReport(req, userPermission.userId, month);
      break;
    case 'report_menu':
      await handleReportMenu(req);
      break;
    default:
      break;
  }
};

const handleCheckIn = async (req: NextApiRequest, userId: string) => {
  try {
    // Proceed with check-in (status already checked in postback handler)
    const result = await attendanceService.checkIn(userId);

    if (result.success && result.checkInTime && result.expectedCheckOutTime) {
      const payload = bubbleTemplate.workCheckInSuccess(result.checkInTime, result.expectedCheckOutTime);
      await sendMessage(req, flexMessage(payload));
    } else if (result.alreadyCheckedIn && result.checkInTime && result.expectedCheckOutTime) {
      const payload = bubbleTemplate.workAlreadyCheckedIn(result.checkInTime);
      await sendMessage(req, flexMessage(payload));
    } else {
      const payload = bubbleTemplate.workError(result.message);
      await sendMessage(req, flexMessage(payload));
    }
  } catch (error) {
    console.error('Error in handleCheckIn:', error);
    const payload = bubbleTemplate.workError('เกิดข้อผิดพลาดในระบบ');
    await sendMessage(req, flexMessage(payload));
  }
};

const handleCheckOut = async (req: NextApiRequest, userId: string) => {
  try {
    // First check current status
    const currentAttendance = await attendanceService.getTodayAttendance(userId);
    
    // If no attendance record found
    if (!currentAttendance) {
      const payload = bubbleTemplate.workError('ไม่พบการลงชื่อเข้างานวันนี้');
      await sendMessage(req, flexMessage(payload));
      return;
    }
    
    // If already checked out, show the checkout success with existing data
    if (currentAttendance.status === "checked_out") {
      const payload = bubbleTemplate.workCheckOutSuccess(
        currentAttendance.checkInTime, 
        currentAttendance.checkOutTime || new Date()
      );
      await sendMessage(req, flexMessage(payload));
      return;
    }
    
    // Proceed with check-out
    const result = await attendanceService.checkOut(userId);
    
    if (result.success && result.checkInTime && result.expectedCheckOutTime) {
      const payload = bubbleTemplate.workCheckOutSuccess(result.checkInTime, result.expectedCheckOutTime);
      await sendMessage(req, flexMessage(payload));
    } else if (!result.success && result.checkInTime && result.expectedCheckOutTime) {
      // Already checked out case - show status instead of error
      const payload = bubbleTemplate.workCheckOutSuccess(result.checkInTime, result.expectedCheckOutTime);
      await sendMessage(req, flexMessage(payload));
    } else {
      const payload = bubbleTemplate.workError(result.message);
      await sendMessage(req, flexMessage(payload));
    }
  } catch (error) {
    console.error('Error in handleCheckOut:', error);
    const payload = bubbleTemplate.workError('เกิดข้อผิดพลาดในระบบ');
    await sendMessage(req, flexMessage(payload));
  }
};

const handleWorkStatus = async (req: NextApiRequest, userId: string) => {
  try {
    const attendance = await attendanceService.getTodayAttendance(userId);

    if (attendance) {
      const payload = bubbleTemplate.workStatus(attendance);
      await sendMessage(req, flexMessage(payload));
    } else {
      const payload = bubbleTemplate.workCheckIn();
      await sendMessage(req, flexMessage(payload));
    }
  } catch (error) {
    console.error('Error in handleWorkStatus:', error);
    const payload = bubbleTemplate.workError('เกิดข้อผิดพลาดในระบบ');
    await sendMessage(req, flexMessage(payload));
  }
};

const handleCheckInMenu = async (req: NextApiRequest) => {
  const userId = req.body.events[0].source.userId;
  const userAccount = await db.account.findFirst({
    where: { providerAccountId: userId }
  });

  if (!userAccount) {
    const payload = bubbleTemplate.signIn();
    await sendMessage(req, flexMessage(payload));
    return;
  }

  // Check current attendance status
  const attendance = await attendanceService.getTodayAttendance(userAccount.userId);
  
  if (attendance) {
    // If already has attendance record, show status instead of check-in menu
    const payload = bubbleTemplate.workStatus(attendance);
    await sendMessage(req, flexMessage(payload));
  } else {
    // No attendance record, show check-in menu
    const payload = bubbleTemplate.workCheckIn();
    await sendMessage(req, flexMessage(payload));
  }
};

const handleWorkAttendanceCommand = async (req: NextApiRequest) => {
  const userId = req.body.events[0].source.userId;
  const userAccount = await db.account.findFirst({
    where: { providerAccountId: userId }
  });

  if (!userAccount) {
    const payload = bubbleTemplate.signIn();
    await sendMessage(req, flexMessage(payload));
    return;
  }

  // Always check attendance status first
  const attendance = await attendanceService.getTodayAttendance(userAccount.userId);
  
  if (attendance) {
    // Show current status if there's an attendance record
    const payload = bubbleTemplate.workStatus(attendance);
    await sendMessage(req, flexMessage(payload));
  } else {
    // No attendance record for today, show check-in menu
    const payload = bubbleTemplate.workCheckIn();
    await sendMessage(req, flexMessage(payload));
  }
};

const handleReportCommand = async (req: NextApiRequest) => {
  const userId = req.body.events[0].source.userId;
  const userAccount = await db.account.findFirst({
    where: { providerAccountId: userId }
  });

  const isPermissionExpired = !userAccount || !userAccount.expires_at || !utils.compareDate(userAccount.expires_at.toString(), new Date().toISOString());

  if (isPermissionExpired) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }

  await handleReportMenu(req);
};

const handleMonthlyReport = async (req: NextApiRequest, userId: string, monthType: string | null) => {
  try {
    let month: string;
    const now = new Date();
    
    if (monthType === 'current') {
      month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    } else if (monthType === 'previous') {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      month = `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}`;
    } else {
      // Default to current month
      month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    const report = await attendanceService.getMonthlyAttendanceReport(userId, month);

    if (report && report.attendanceRecords.length > 0) {
      const payload = [bubbleTemplate.monthlyReportSummary(report)];
      await sendMessage(req, flexMessage(payload));
    } else {
      const payload = [bubbleTemplate.workError('ไม่พบข้อมูลการเข้างานในเดือนที่เลือก')];
      await sendMessage(req, flexMessage(payload));
    }
  } catch (error) {
    console.error('Error in handleMonthlyReport:', error);
    const payload = [bubbleTemplate.workError('เกิดข้อผิดพลาดในการสร้างรายงาน')];
    await sendMessage(req, flexMessage(payload));
  }
};

const handleReportMenu = async (req: NextApiRequest) => {
  try {
    const payload = [bubbleTemplate.monthlyReportMenu()];
    await sendMessage(req, flexMessage(payload));
  } catch (error) {
    console.error('Error in handleReportMenu:', error);
    const payload = [bubbleTemplate.workError('เกิดข้อผิดพลาดในระบบ')];
    await sendMessage(req, flexMessage(payload));
  }
};

export const lineService = {
  handleEvent,
}
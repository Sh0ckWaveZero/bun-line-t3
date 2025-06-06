import { NextApiRequest, NextApiResponse } from 'next';
import { env } from '~/env.mjs';
import { bubbleTemplate } from '~/utils/line';

// Helper function to send push message
const sendPushMessage = async (userId: string, messages: any[]) => {
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };

  try {
    const response = await fetch(`${env.LINE_MESSAGING_API}/push`, {
      method: 'POST',
      headers: lineHeader,
      body: JSON.stringify({
        to: userId,
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send push message');
    }

    return response;
  } catch (err: any) {
    console.error('Error sending push message:', err.message);
    throw err;
  }
};

const flexMessage = (bubbleItems: any[]) => {
  return [
    {
      type: 'flex',
      altText: 'Work Attendance System',
      contents: {
        type: 'carousel',
        contents: bubbleItems,
      },
    },
  ];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, messageType = 'checkin_menu' } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    let payload;
    
    switch (messageType) {
      case 'checkin_menu':
        payload = flexMessage(bubbleTemplate.workCheckIn());
        break;
      case 'reminder':
        payload = [
          {
            type: 'text',
            text: '⏰ อย่าลืมลงชื่อเข้างานนะคะ! กดที่ปุ่มด้านล่างเพื่อเริ่มทำงาน 😊'
          },
          ...flexMessage(bubbleTemplate.workCheckIn())
        ];
        break;
      case 'checkout_reminder':
        payload = [
          {
            type: 'text',
            text: '🕔 ถึงเวลาเลิกงานแล้ว! อย่าลืมลงชื่อออกงานด้วยนะคะ 👋'
          }
        ];
        break;
      default:
        payload = flexMessage(bubbleTemplate.workCheckIn());
    }

    await sendPushMessage(userId, payload);
    
    res.status(200).json({ 
      success: true, 
      message: 'Push message sent successfully' 
    });

  } catch (error: any) {
    console.error('Error in attendance push API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send push message',
      error: error.message 
    });
  }
}

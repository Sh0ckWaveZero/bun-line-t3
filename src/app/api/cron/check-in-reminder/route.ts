import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { env } from '@/env.mjs';
import { attendanceService } from '@/features/attendance/services/attendance';
import { holidayService } from '@/features/attendance/services/holidays';
import { selectRandomElement } from '@/lib/crypto-random';
import { RateLimiter } from '@/lib/utils/rate-limiter';

// Helper function to send broadcast message
const sendBroadcastMessage = async (messages: any[]) => {
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };

  try {
    const response = await fetch(`${env.LINE_MESSAGING_API}/broadcast`, {
      method: 'POST',
      headers: lineHeader,
      body: JSON.stringify({
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send broadcast message');
    }

    return response;
  } catch (err: any) {
    console.error('Error sending broadcast message:', err.message);
    throw err;
  }
};

// Check if today is a working day (Monday-Friday, excluding holidays from MongoDB)
const isWorkingDay = async (): Promise<boolean> => {
  const now = attendanceService.getCurrentBangkokTime();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Check if it's Monday (1) to Friday (5)
  if (dayOfWeek < 1 || dayOfWeek > 5) {
    return false;
  }
  
  // Check if today is a public holiday from MongoDB
  const isHoliday = await holidayService.isPublicHoliday(now);
  if (isHoliday) {
    console.log('📅 Today is a public holiday, skipping check-in reminder');
    return false;
  }
  
  return true;
};

// Array of 20 gentle, friendly check-in reminder messages
const checkInReminderMessages = [
  "🌅 สวัสดีตอนเช้า! วันใหม่ที่สดใส เริ่มต้นด้วยการลงชื่อเข้างานกันนะคะ ✨",
  "☀️ อรุณสวัสดิ์ค่ะ! พร้อมเริ่มวันทำงานที่ดีแล้วหรือยัง? อย่าลืมเช็คอินนะคะ 😊",
  "🌸 วันนี้เป็นวันที่ดี! เริ่มต้นด้วยความสดชื่น และอย่าลืมลงชื่อเข้างานด้วยนะ 🌟",
  "🌱 ตื่นมาแล้วปะ? วันใหม่มาแล้ว พร้อมทำงานด้วยพลังบวกกันเลย! เช็คอินได้แล้วค่ะ 💚",
  "🎶 สวัสดีค่ะ! เวลาทำงานมาถึงแล้ว ลงชื่อเข้างานแล้วเริ่มวันที่สวยงามกันเลย 🎵",
  "🌞 หวาดดี! วันใหม่มาพร้อมโอกาสใหม่ อย่าลืมเช็คอินเพื่อเริ่มต้นวันที่ดีนะคะ ✌️",
  "🌺 เช้าสดใส! ขอให้วันนี้เป็นวันที่มีความสุข เริ่มด้วยการลงชื่อเข้างานกันค่ะ 🌈",
  "☕ กาแฟหอม เช้าใหม่! พร้อมเผชิญหน้ากับวันทำงานแล้วใช่ไหม? เช็คอินได้เลย ☺️",
  "🌄 อรุณอุทัยที่สวยงาม! วันใหม่เริ่มต้นแล้ว มาลงชื่อเข้างานพร้อมรับความท้าทายใหม่กันนะ 🚀",
  "🎋 สวัสดีตอนเช้า! วันนี้จะเป็นวันที่ยอดเยี่ยม เริ่มต้นด้วยการเช็คอินเลยค่ะ 🌟",
  "🌅 ยามเช้าที่แสนดี! หวังว่าเพื่อนๆ จะมีวันที่ดีนะคะ อย่าลืมลงชื่อเข้างานด้วย 💫",
  "🎀 เช้าอันสดใส! วันใหม่เต็มไปด้วยความหวัง เริ่มต้นด้วยการเช็คอินกันเลย 🌻",
  "🌸 อรุณสวัสดิ์ค่ะ! เวลาทำงานมาถึงแล้ว พร้อมสร้างผลงานดีๆ กันหรือยัง? 💪",
  "🍃 เช้าที่สดชื่น! วันใหม่มีพลังงานดีๆ รออยู่ เริ่มด้วยการลงชื่อเข้างานนะคะ 🌿",
  "🎨 วันใหม่ที่มีสีสัน! พร้อมสร้างสรรค์ผลงานดีๆ แล้วหรือยัง? เช็คอินได้แล้วค่ะ 🖌️",
  "🌤️ เช้าที่อบอุ่น! วันนี้น่าจะเป็นวันที่ดี เริ่มต้นด้วยการลงชื่อเข้างานกันเลย ☀️",
  "🎪 สวัสดีค่ะ! วันใหม่เต็มไปด้วยความสนุก พร้อมเริ่มทำงานแล้วหรือยัง? 🎭",
  "🌊 ไหลไปกับวันใหม่! เต็มไปด้วยพลังบวก อย่าลืมเช็คอินเพื่อเริ่มต้นวันที่ดี 🌊",
  "🦋 เช้าที่สดใส! วันใหม่พร้อมบินไปสู่ความสำเร็จ เริ่มด้วยการลงชื่อเข้างานกันค่ะ 🦋",
  "🎈 อรุณสวัสดิ์! วันใหม่เบาสบาย พร้อมเติมเต็มความฝันแล้วหรือยัง? เช็คอินได้เลยค่ะ 🎈"
] as const;

/**
 * Morning Check-in Reminder Cron Job
 * This endpoint sends friendly reminders to all users at 8:00 AM on weekdays
 * to encourage them to check in for work
 */
export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await RateLimiter.checkCronRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const headersList = await headers();
    
    // Verify that this request is coming from Vercel Cron or authorized source
    const authHeader = headersList.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🌅 Vercel Cron: Running check-in reminder job...');
    
    // Check if today is a working day (including MongoDB holiday check)
    if (!(await isWorkingDay())) {
      // Get additional holiday info for logging
      const currentBangkokTime = attendanceService.getCurrentBangkokTime();
      const holidayInfo = await holidayService.getHolidayInfo(currentBangkokTime);
      
      let reason = 'not a working day';
      if (holidayInfo) {
        reason = `public holiday: ${holidayInfo.nameThai} (${holidayInfo.nameEnglish})`;
        console.log(`🎉 Today is ${holidayInfo.nameThai} (${holidayInfo.nameEnglish}), skipping reminder`);
      } else {
        console.log('📅 Today is not a working day (weekend), skipping reminder');
      }
      
      return Response.json({ 
        success: true, 
        message: `Skipped - ${reason}`,
        holidayInfo: holidayInfo ? {
          nameThai: holidayInfo.nameThai,
          nameEnglish: holidayInfo.nameEnglish,
          type: holidayInfo.type
        } : null,
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }
    
    // Get current Bangkok time
    const currentBangkokTime = attendanceService.getCurrentBangkokTime();
    const currentHour = currentBangkokTime.getHours();
    
    // Double-check time (should be around 8 AM)
    if (currentHour !== 8) {
      console.log(`⏰ Current time is ${currentHour}:00, check-in reminder is for 8:00 AM only`);
      return Response.json({ 
        success: true, 
        message: `Skipped - not the right time (${currentHour}:00)`,
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }
    
    // Select a random friendly message
    const randomMessage = selectRandomElement(checkInReminderMessages);
    
    // Create the broadcast message with a simple text and check-in button
    const messages = [
      {
        type: 'text',
        text: randomMessage
      },
      {
        type: 'template',
        altText: 'ลงชื่อเข้างาน',
        template: {
          type: 'buttons',
          text: '👆 กดปุ่มด้านล่างเพื่อลงชื่อเข้างานได้เลย',
          actions: [
            {
              type: 'postback',
              label: '🏢 ลงชื่อเข้างาน',
              data: 'action=checkin',
            }
          ]
        }
      }
    ];
    
    // Send broadcast message to all users
    await sendBroadcastMessage(messages);
    
    console.log('✅ Check-in reminder broadcast sent successfully');
    
    return Response.json({ 
      success: true, 
      message: 'Check-in reminder broadcast sent successfully',
      messageText: randomMessage,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error in check-in reminder job:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to send check-in reminder',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { env } from '~/env.mjs';
import { bubbleTemplate } from '~/lib/validation/line';
import { attendanceService } from '~/features/attendance/services/attendance';
import { db } from '~/lib/database/db';

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

/**
 * API handler for sending automatic checkout reminders
 * It will find all users who checked in but haven't checked out
 * and send them a reminder message near the end of workday
 */
export async function GET(req: NextRequest) {
  try {
    // Check if API key is valid (for security)
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== env.INTERNAL_API_KEY) {
      return Response.json({ message: 'Unauthorized access' }, { status: 401 });
    }
    
    // Get all users who need checkout reminders
    const usersNeedingReminder = await attendanceService.getUsersWithPendingCheckout();
    
    if (!usersNeedingReminder.length) {
      return Response.json({ 
        success: true, 
        message: 'No users need checkout reminders' 
      }, { status: 200 });
    }
    
    // Get the LINE user IDs for each internal user ID
    const results = await Promise.all(
      usersNeedingReminder.map(async (userId) => {
        try {
          // Find the LINE account associated with this user
          const userAccount = await db.account.findFirst({
            where: { 
              userId,
              provider: 'line'  // Make sure we're getting LINE accounts
            }
          });
          
          if (!userAccount) {
            return { userId, status: 'skipped', reason: 'No LINE account found' };
          }
          
          // Get the attendance record to show in reminder
          const attendance = await attendanceService.getTodayAttendance(userId);
          
          if (!attendance) {
            return { userId, status: 'skipped', reason: 'No attendance record found' };
          }
          
          // Build checkout reminder payload with personalized information
          const reminderTime = new Date();
          const checkInTime = attendance.checkInTime;
          const hoursWorked = (reminderTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
          
          const payload = [
            {
              type: 'text',
              text: `⏰ ใกล้ถึงเวลาเลิกงานแล้ว! อย่าลืมลงชื่อออกงานนะคะ\n\nคุณเข้างานตั้งแต่ ${attendanceService.formatThaiTimeOnly(checkInTime)} น.\n(ทำงานแล้วประมาณ ${hoursWorked.toFixed(1)} ชั่วโมง)`
            },
            ...flexMessage(bubbleTemplate.workStatus(attendance))
          ];
          
          // Send the push message
          await sendPushMessage(userAccount.providerAccountId, payload);
          
          return { 
            userId, 
            lineUserId: userAccount.providerAccountId, 
            status: 'success' 
          };
        } catch (error: any) {
          console.error(`Error sending reminder to user ${userId}:`, error);
          return { 
            userId, 
            status: 'failed', 
            error: error.message 
          };
        }
      })
    );
    
    // Count successful reminders
    const successCount = results.filter(r => r.status === 'success').length;
    
    return Response.json({ 
      success: true, 
      message: `Checkout reminders sent to ${successCount} users`,
      results
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in checkout-reminder API:', error);
    return Response.json({ 
      success: false, 
      message: 'Failed to send checkout reminders',
      error: error.message 
    }, { status: 500 });
  }
}

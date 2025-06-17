import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { env } from '@/env.mjs';
import { bubbleTemplate } from '@/lib/validation/line';
import { attendanceService } from '@/features/attendance/services/attendance';
import { db } from '@/lib/database/db';
import { roundToOneDecimal } from '@/lib/utils/number';
import { convertUTCToBangkok, getCurrentBangkokTime } from '@/lib/utils/datetime';

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
 * Enhanced Checkout Reminder with Dynamic Timing
 * This endpoint can be called more frequently (every 15-30 minutes) to check individual users
 * It calculates personalized reminder times based on each user's check-in time
 */
export async function GET(_req: NextRequest) {
  try {
    const headersList = await headers();
    
    // Verify that this request is coming from authorized source
    const authHeader = headersList.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔔 Enhanced Cron: Running dynamic checkout reminder job...');
    
    // Get current Bangkok time
    const currentBangkokTime = getCurrentBangkokTime();
    console.log(`⏰ Current Bangkok time: ${currentBangkokTime.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
    
    // Get all users who need checkout reminders
    const usersNeedingReminder = await attendanceService.getUsersWithPendingCheckout();
    
    if (!usersNeedingReminder.length) {
      console.log('✅ No users need checkout reminders');
      return Response.json({ 
        success: true, 
        message: 'No users need checkout reminders',
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }
    
    console.log(`📝 Found ${usersNeedingReminder.length} users to check for dynamic reminders`);
    
    // Process each user individually with dynamic timing
    const results = await Promise.all(
      usersNeedingReminder.map(async (userId) => {
        try {
          // Get the attendance record to check timing
          const attendance = await attendanceService.getTodayAttendance(userId);
          
          if (!attendance) {
            console.log(`⚠️ User ${userId}: No attendance record found`);
            return { userId, status: 'skipped', reason: 'No attendance record found' };
          }
          
          // Calculate if this user should receive reminder now
          const shouldRemind = attendanceService.shouldReceiveReminderNow(attendance.checkInTime, currentBangkokTime);
          
          if (!shouldRemind) {
            const reminderTime = attendanceService.calculateUserReminderTime(attendance.checkInTime);
            console.log(`⏳ User ${userId}: Not time for reminder yet. Reminder time: ${reminderTime.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
            return { 
              userId, 
              status: 'scheduled', 
              reminderTime: reminderTime.toISOString(),
              checkInTime: attendance.checkInTime.toISOString()
            };
          }
          
          // Find the LINE account associated with this user
          const userAccount = await db.account.findFirst({
            where: { 
              userId,
              provider: 'line'
            }
          });
          
          if (!userAccount) {
            console.log(`⚠️ User ${userId}: No LINE account found`);
            return { userId, status: 'skipped', reason: 'No LINE account found' };
          }
          
          // Build personalized checkout reminder
          const currentTime = getCurrentBangkokTime();
          const checkInTime = convertUTCToBangkok(attendance.checkInTime);
          const hoursWorked = (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
          const reminderTime = attendanceService.calculateUserReminderTime(attendance.checkInTime);
          
          const payload = [
            {
              type: 'text',
              text: `⏰ เวลาแจ้งเตือนส่วนตัว!\n\nคุณเข้างานตั้งแต่ ${attendanceService.formatThaiTimeOnly(checkInTime)} น.\nทำงานแล้ว ${roundToOneDecimal(hoursWorked)} ชั่วโมง\n\n🎯 อีกประมาณ 30 นาทีจะครบ 8 ชั่วโมงแล้ว\nอย่าลืมลงชื่อออกงานด้วยนะคะ!`
            },
            ...flexMessage(bubbleTemplate.workStatus(attendance))
          ];
          
          // Send the personalized push message
          await sendPushMessage(userAccount.providerAccountId, payload);
          
          console.log(`✅ User ${userId}: Dynamic reminder sent successfully at ${currentTime.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
          return { 
            userId, 
            lineUserId: userAccount.providerAccountId.substring(0, 8) + '...', 
            status: 'sent',
            checkInTime: checkInTime.toISOString(),
            reminderTime: reminderTime.toISOString(),
            hoursWorked: roundToOneDecimal(hoursWorked)
          };
        } catch (error: any) {
          console.error(`❌ Error processing dynamic reminder for user ${userId}:`, error);
          return { 
            userId, 
            status: 'failed', 
            error: error.message 
          };
        }
      })
    );
    
    // Count results
    const sentCount = results.filter(r => r.status === 'sent').length;
    const scheduledCount = results.filter(r => r.status === 'scheduled').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    
    console.log(`📊 Dynamic Results: ${sentCount} sent, ${scheduledCount} scheduled, ${failedCount} failed, ${skippedCount} skipped`);
    
    return Response.json({ 
      success: true, 
      message: `Dynamic checkout reminders processed: ${sentCount} sent, ${scheduledCount} scheduled, ${failedCount} failed, ${skippedCount} skipped`,
      timestamp: new Date().toISOString(),
      currentBangkokTime: currentBangkokTime.toISOString(),
      statistics: {
        total: results.length,
        sent: sentCount,
        scheduled: scheduledCount,
        failed: failedCount,
        skipped: skippedCount
      },
      results
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error in dynamic checkout-reminder cron job:', error);
    return Response.json({ 
      success: false, 
      message: 'Failed to send dynamic checkout reminders',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

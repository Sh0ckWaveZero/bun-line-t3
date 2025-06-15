import { NextRequest } from 'next/server';
import { env } from '@/env.mjs';
import { attendanceService } from '@/features/attendance/services/attendance';
import { db } from '@/lib/database/db';
import { AttendanceStatusType } from '@prisma/client';

/**
 * API handler สำหรับการลงชื่อออกงานอัตโนมัติตอนเที่ยงคืน
 * สำหรับพนักงานที่ลืมลงชื่อออกงาน
 */
export async function GET(req: NextRequest) {
  try {
    // ตรวจสอบ API key เพื่อความปลอดภัย
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== env.INTERNAL_API_KEY) {
      return Response.json({ message: 'Unauthorized access' }, { status: 401 });
    }
    
    const currentTime = new Date();
    const bangkokTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    
    console.log(`[${bangkokTime.toLocaleString('th-TH')}] เริ่มกระบวนการลงชื่อออกงานอัตโนมัติ...`);
    
    // ค้นหาพนักงานที่ยังไม่ลงชื่อออกงานในวันนี้
    const usersWithoutCheckout = await attendanceService.getUsersWithPendingCheckout();
    
    if (!usersWithoutCheckout.length) {
      console.log('✅ ไม่มีพนักงานที่ต้องลงชื่อออกงานอัตโนมัติ');
      return Response.json({ 
        success: true, 
        message: 'ไม่มีพนักงานที่ต้องลงชื่อออกงานอัตโนมัติ',
        processedCount: 0
      }, { status: 200 });
    }
    
    console.log(`🔍 พบพนักงานที่ยังไม่ลงชื่อออกงาน: ${usersWithoutCheckout.length} คน`);
    
    // ประมวลผลลงชื่อออกงานอัตโนมัติสำหรับแต่ละคน
    const results = await Promise.all(
      usersWithoutCheckout.map(async (userId) => {
        try {
          // ค้นหา attendance record ของวันนี้
          const todayAttendance = await attendanceService.getTodayAttendance(userId);
          
          if (!todayAttendance || todayAttendance.checkOutTime) {
            return { 
              userId, 
              status: 'skipped', 
              reason: 'ไม่พบ attendance record หรือลงชื่อออกแล้ว' 
            };
          }
          
          // คำนวณเวลาลงชื่อออกงานอัตโนมัติ (เที่ยงคืน)
          const autoCheckoutTime = new Date(bangkokTime);
          autoCheckoutTime.setHours(0, 0, 0, 0);
          
          // อัปเดต WorkAttendance record ด้วยการลงชื่อออกงานอัตโนมัติ
          await db.workAttendance.update({
            where: { id: todayAttendance.id },
            data: {
              checkOutTime: autoCheckoutTime,
              // ใช้ string literal แทน enum ชั่วคราว
              status: 'AUTO_CHECKOUT_MIDNIGHT' as AttendanceStatusType
            }
          });
          
          // คำนวณชั่วโมงทำงาน
          const checkInTime = todayAttendance.checkInTime;
          const workingMilliseconds = autoCheckoutTime.getTime() - checkInTime.getTime();
          const workingHours = workingMilliseconds / (1000 * 60 * 60);
          
          console.log(`✅ ลงชื่อออกงานอัตโนมัติสำหรับ userId: ${userId} (${workingHours.toFixed(2)} ชั่วโมง)`);
          
          // ส่งแจ้งเตือนให้ผู้ใช้ทราบ (ถ้าต้องการ)
          await sendAutoCheckoutNotification(userId, {
            checkInTime: todayAttendance.checkInTime,
            checkOutTime: autoCheckoutTime,
            workingHours
          });
          
          return { 
            userId, 
            status: 'success',
            checkInTime: todayAttendance.checkInTime,
            autoCheckoutTime,
            workingHours: workingHours.toFixed(2)
          };
        } catch (error: any) {
          console.error(`❌ เกิดข้อผิดพลาดในการลงชื่อออกงานอัตโนมัติสำหรับ userId ${userId}:`, error);
          return { 
            userId, 
            status: 'failed', 
            error: error.message 
          };
        }
      })
    );
    
    // นับจำนวนที่สำเร็จ
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    
    console.log(`📊 สรุปผลการลงชื่อออกงานอัตโนมัติ: สำเร็จ ${successCount}, ล้มเหลว ${failedCount}, ข้าม ${skippedCount}`);
    
    return Response.json({ 
      success: true, 
      message: `ลงชื่อออกงานอัตโนมัติเสร็จสิ้น: ${successCount} คน`,
      summary: {
        processed: usersWithoutCheckout.length,
        successful: successCount,
        failed: failedCount,
        skipped: skippedCount
      },
      results
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาดในระบบลงชื่อออกงานอัตโนมัติ:', error);
    return Response.json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในระบบลงชื่อออกงานอัตโนมัติ',
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * ส่งแจ้งเตือนให้ผู้ใช้ทราบว่ามีการลงชื่อออกงานอัตโนมัติ
 */
async function sendAutoCheckoutNotification(userId: string, data: {
  checkInTime: Date;
  checkOutTime: Date;
  workingHours: number;
}) {
  try {
    // ค้นหา LINE account ของผู้ใช้
    const userAccount = await db.account.findFirst({
      where: { 
        userId,
        provider: 'line'
      }
    });
    
    if (!userAccount) {
      console.log(`⚠️ ไม่พบ LINE account สำหรับ userId: ${userId}`);
      return;
    }
    
    // สร้างข้อความแจ้งเตือน
    const message = {
      type: 'text',
      text: `🕛 แจ้งเตือนการลงชื่อออกงานอัตโนมัติ\n\n` +
            `เนื่องจากคุณลืมลงชื่อออกงาน ระบบจึงลงชื่อออกให้อัตโนมัติตอนเที่ยงคืน\n\n` +
            `📅 วันที่: ${data.checkInTime.toLocaleDateString('th-TH')}\n` +
            `🕐 เข้างาน: ${attendanceService.formatThaiTimeOnly(data.checkInTime)} น.\n` +
            `🕛 ออกงาน: ${attendanceService.formatThaiTimeOnly(data.checkOutTime)} น. (อัตโนมัติ)\n` +
            `⏱️ รวม: ${data.workingHours.toFixed(2)} ชั่วโมง\n\n` +
            `💡 หากมีข้อผิดพลาด กรุณาติดต่อ HR เพื่อแก้ไข`
    };
    
    // ส่งข้อความผ่าน LINE
    const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
    const response = await fetch(`${env.LINE_MESSAGING_API}/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineChannelAccessToken}`,
      },
      body: JSON.stringify({
        to: userAccount.providerAccountId,
        messages: [message]
      }),
    });
    
    if (response.ok) {
      console.log(`📱 ส่งแจ้งเตือนการลงชื่อออกงานอัตโนมัติให้ userId: ${userId} แล้ว`);
    } else {
      console.error(`❌ ไม่สามารถส่งแจ้งเตือนให้ userId: ${userId} ได้`);
    }
    
  } catch (error: any) {
    console.error(`❌ เกิดข้อผิดพลาดในการส่งแจ้งเตือนให้ userId ${userId}:`, error);
  }
}

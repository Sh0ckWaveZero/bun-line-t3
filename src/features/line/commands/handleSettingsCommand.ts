import { sendMessage } from "../../../lib/utils/line-utils";
import { replyNotFound } from "@/lib/utils/line-message-utils";
import { db as prisma } from "@/lib/database/db";

export const handleSettingsCommand = async (req: any, conditions: any[]) => {
  try {
    const userId = req.body.events[0].source.userId;
    const originalText = req.body.events[0].message.text;
    const command = originalText.split(" ")[0]?.slice(1).toLowerCase();
    
    // Find user by LINE userId
    const account = await prisma.account.findFirst({
      where: {
        providerAccountId: userId,
        provider: "line",
      },
      include: {
        user: {
          include: {
            settings: true,
          },
        },
      },
    });

    if (!account || !account.user) {
      // Detect language from command
      const isEnglish = ["settings", "setting", "config", "preferences", "pref"].includes(command);
      
      const notRegisteredMessage = {
        type: "text",
        text: isEnglish 
          ? "🔐 Please register first to access settings\n\nClick 'Register' in the Rich Menu"
          : "🔐 กรุณาลงทะเบียนระบบก่อนเพื่อใช้งานการตั้งค่า\n\nคลิก 'ลงทะเบียน' ในเมนู Rich Menu",
      };
      await sendMessage(req, [notRegisteredMessage]);
      return;
    }

    const user = account.user;
    const action = conditions[0]?.toLowerCase();

    if (["เข้างาน", "morning", "entry", "signin", "login-reminder"].includes(action)) {
      // Toggle check-in reminders
      const currentSetting = user.settings?.enableCheckInReminders ?? true;
      const newSetting = !currentSetting;

      // Detect language based on action
      const isEnglish = ["morning", "entry", "signin", "login-reminder"].includes(action);

      if (!user.settings) {
        // Create new settings
        await prisma.userSettings.create({
          data: {
            userId: user.id,
            enableCheckInReminders: newSetting,
            enableCheckOutReminders: true,
            enableHolidayNotifications: false,
            timezone: "Asia/Bangkok",
            language: isEnglish ? "en" : "th",
          },
        });
      } else {
        // Update existing settings
        await prisma.userSettings.update({
          where: { userId: user.id },
          data: { enableCheckInReminders: newSetting },
        });
      }

      const statusText = isEnglish 
        ? (newSetting ? "Enabled" : "Disabled")
        : (newSetting ? "เปิด" : "ปิด");
      const emoji = newSetting ? "🔔" : "🔕";
      
      const successMessage = {
        type: "text",
        text: isEnglish 
          ? `${emoji} ${statusText} 8:00 AM check-in reminders successfully!\n\n${newSetting ? "You will receive daily check-in reminders every morning." : "You will no longer receive check-in reminders."}`
          : `${emoji} ${statusText}การแจ้งเตือนเข้างานตอน 8:00 น. เรียบร้อยแล้ว\n\n${newSetting ? "คุณจะได้รับการแจ้งเตือนลงชื่อเข้างานทุกเช้า" : "คุณจะไม่ได้รับการแจ้งเตือนลงชื่อเข้างานอีกต่อไป"}`,
      };

      await sendMessage(req, [successMessage]);
      return;
    }

    if (["เลิกงาน", "finish", "end", "exit", "signout", "logout-reminder"].includes(action)) {
      // Toggle check-out reminders
      const currentSetting = user.settings?.enableCheckOutReminders ?? true;
      const newSetting = !currentSetting;

      // Detect language based on action
      const isEnglish = ["finish", "end", "exit", "signout", "logout-reminder"].includes(action);

      if (!user.settings) {
        // Create new settings
        await prisma.userSettings.create({
          data: {
            userId: user.id,
            enableCheckInReminders: true,
            enableCheckOutReminders: newSetting,
            enableHolidayNotifications: false,
            timezone: "Asia/Bangkok",
            language: isEnglish ? "en" : "th",
          },
        });
      } else {
        // Update existing settings
        await prisma.userSettings.update({
          where: { userId: user.id },
          data: { enableCheckOutReminders: newSetting },
        });
      }

      const statusText = isEnglish 
        ? (newSetting ? "Enabled" : "Disabled")
        : (newSetting ? "เปิด" : "ปิด");
      const emoji = newSetting ? "🔔" : "🔕";
      
      const successMessage = {
        type: "text",
        text: isEnglish 
          ? `${emoji} ${statusText} checkout reminders successfully!\n\n${newSetting ? "You will receive reminders 10 minutes before completing 9 hours and when you reach 9 hours." : "You will no longer receive checkout reminders."}`
          : `${emoji} ${statusText}การแจ้งเตือนเลิกงานเรียบร้อยแล้ว\n\n${newSetting ? "คุณจะได้รับการแจ้งเตือนก่อนครบ 9 ชั่วโมง และเมื่อครบ 9 ชั่วโมงแล้ว" : "คุณจะไม่ได้รับการแจ้งเตือนเลิกงานอีกต่อไป"}`,
      };

      await sendMessage(req, [successMessage]);
      return;
    }

    if (["วันหยุด", "holiday", "holidays", "วันหยุดราชการ", "holiday-notifications"].includes(action)) {
      // Toggle holiday notifications
      const currentSetting = user.settings?.enableHolidayNotifications ?? false;
      const newSetting = !currentSetting;

      // Detect language based on action
      const isEnglish = ["holiday", "holidays", "holiday-notifications"].includes(action);

      if (!user.settings) {
        // Create new settings
        await prisma.userSettings.create({
          data: {
            userId: user.id,
            enableCheckInReminders: true,
            enableCheckOutReminders: true,
            enableHolidayNotifications: newSetting,
            timezone: "Asia/Bangkok",
            language: isEnglish ? "en" : "th",
          },
        });
      } else {
        // Update existing settings
        await prisma.userSettings.update({
          where: { userId: user.id },
          data: { enableHolidayNotifications: newSetting },
        });
      }

      const statusText = isEnglish 
        ? (newSetting ? "Enabled" : "Disabled")
        : (newSetting ? "เปิด" : "ปิด");
      const emoji = newSetting ? "🔔" : "🔕";
      
      const successMessage = {
        type: "text",
        text: isEnglish 
          ? `${emoji} ${statusText} holiday notifications successfully!\n\n${newSetting ? "You will receive notifications about public holidays." : "You will no longer receive holiday notifications."}`
          : `${emoji} ${statusText}การแจ้งเตือนวันหยุดราชการเรียบร้อยแล้ว\n\n${newSetting ? "คุณจะได้รับการแจ้งเตือนเกี่ยวกับวันหยุดราชการ" : "คุณจะไม่ได้รับการแจ้งเตือนวันหยุดราชการอีกต่อไป"}`,
      };

      await sendMessage(req, [successMessage]);
      return;
    }

    // Show current settings
    const currentSettings = user.settings;
    const checkInStatus = currentSettings?.enableCheckInReminders ?? true;
    const checkOutStatus = currentSettings?.enableCheckOutReminders ?? true;
    const holidayStatus = currentSettings?.enableHolidayNotifications ?? false;
    
    // Detect language from user's previous language setting or command
    const isEnglish = currentSettings?.language === "en" || 
                     ["settings", "setting", "config", "preferences", "pref"].includes(command);
    
    const checkInEmoji = checkInStatus ? "🔔" : "🔕";
    const checkInText = isEnglish 
      ? (checkInStatus ? "ON" : "OFF")
      : (checkInStatus ? "เปิด" : "ปิด");
    const checkOutEmoji = checkOutStatus ? "🔔" : "🔕";
    const checkOutText = isEnglish 
      ? (checkOutStatus ? "ON" : "OFF")
      : (checkOutStatus ? "เปิด" : "ปิด");
    const holidayEmoji = holidayStatus ? "🔔" : "🔕";
    const holidayText = isEnglish 
      ? (holidayStatus ? "ON" : "OFF")
      : (holidayStatus ? "เปิด" : "ปิด");

    const settingsMessage = {
      type: "template",
      altText: isEnglish ? "Your Settings" : "การตั้งค่าของคุณ",
      template: {
        type: "buttons",
        text: isEnglish 
          ? `⚙️ Notification Settings\n\n${checkInEmoji} Check-in (8:00 AM): ${checkInText}\n${checkOutEmoji} Check-out (Before 9 hrs): ${checkOutText}\n${holidayEmoji} Holiday notifications: ${holidayText}\n\nSelect setting to adjust:`
          : `⚙️ การตั้งค่าการแจ้งเตือน\n\n${checkInEmoji} เข้างาน (8:00 น.): ${checkInText}\n${checkOutEmoji} เลิกงาน (ก่อนครบ 9 ชม.): ${checkOutText}\n${holidayEmoji} แจ้งเตือนวันหยุด: ${holidayText}\n\nเลือกการตั้งค่าที่ต้องการปรับ:`,
        actions: [
          {
            type: "message",
            label: isEnglish 
              ? `${checkInStatus ? "Disable" : "Enable"} Check-in`
              : `${checkInStatus ? "ปิด" : "เปิด"}แจ้งเตือนเข้างาน`,
            text: isEnglish ? "/settings morning" : "/ตั้งค่า เข้างาน",
          },
          {
            type: "message",
            label: isEnglish 
              ? `${checkOutStatus ? "Disable" : "Enable"} Check-out`
              : `${checkOutStatus ? "ปิด" : "เปิด"}แจ้งเตือนเลิกงาน`,
            text: isEnglish ? "/settings finish" : "/ตั้งค่า เลิกงาน",
          },
          {
            type: "message",
            label: isEnglish 
              ? `${holidayStatus ? "Disable" : "Enable"} Holiday`
              : `${holidayStatus ? "ปิด" : "เปิด"}แจ้งเตือนวันหยุด`,
            text: isEnglish ? "/settings holiday" : "/ตั้งค่า วันหยุด",
          },
        ],
      },
    };

    await sendMessage(req, [settingsMessage]);
  } catch (error) {
    console.error("Error handling settings command:", error);
    replyNotFound(req);
  }
};
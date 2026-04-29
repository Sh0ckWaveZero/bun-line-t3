import { sendMessage } from "../../../lib/utils/line-utils";
import { replyNotFound } from "@/lib/utils/line-message-utils";
import { db as prisma } from "@/lib/database/db";
import { getLineUserAccount } from "@/features/line/utils/getLineUserAccount";

export const handleSettingsCommand = async (req: any, conditions: any[]) => {
  try {
    const originalText = req.body.events[0].message.text;
    const command = originalText.split(" ")[0]?.slice(1).toLowerCase();

    const lineAccount = await getLineUserAccount(req.body.events[0]);
    const account = lineAccount
      ? await prisma.account.findUnique({
          where: { id: lineAccount.id },
          include: {
            user: {
              include: {
                settings: true,
              },
            },
          },
        })
      : null;

    if (!account || !account.user) {
      // Detect language from command
      const isEnglish = [
        "settings",
        "setting",
        "config",
        "preferences",
        "pref",
      ].includes(command);

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

    if (
      ["เข้างาน", "morning", "entry", "signin", "login-reminder"].includes(
        action,
      )
    ) {
      // Toggle check-in reminders
      const currentSetting = user.settings?.enableCheckInReminders ?? true;
      const newSetting = !currentSetting;

      // Detect language based on action
      const isEnglish = [
        "morning",
        "entry",
        "signin",
        "login-reminder",
      ].includes(action);

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
        ? newSetting
          ? "Enabled"
          : "Disabled"
        : newSetting
          ? "เปิด"
          : "ปิด";
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

    if (
      [
        "เลิกงาน",
        "finish",
        "end",
        "exit",
        "signout",
        "logout-reminder",
      ].includes(action)
    ) {
      // Toggle check-out reminders
      const currentSetting = user.settings?.enableCheckOutReminders ?? true;
      const newSetting = !currentSetting;

      // Detect language based on action
      const isEnglish = [
        "finish",
        "end",
        "exit",
        "signout",
        "logout-reminder",
      ].includes(action);

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
        ? newSetting
          ? "Enabled"
          : "Disabled"
        : newSetting
          ? "เปิด"
          : "ปิด";
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

    if (
      [
        "วันหยุด",
        "holiday",
        "holidays",
        "วันหยุดราชการ",
        "holiday-notifications",
      ].includes(action)
    ) {
      // Toggle holiday notifications
      const currentSetting = user.settings?.enableHolidayNotifications ?? false;
      const newSetting = !currentSetting;

      // Detect language based on action
      const isEnglish = [
        "holiday",
        "holidays",
        "holiday-notifications",
      ].includes(action);

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
        ? newSetting
          ? "Enabled"
          : "Disabled"
        : newSetting
          ? "เปิด"
          : "ปิด";
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

    // Toggle privacy — ซ่อนเงิน LINE ส่วนตัว
    if (
      ["ซ่อนเงิน", "hide-money", "privacy", "ซ่อน"].includes(action)
    ) {
      const currentSetting = user.settings?.hideAmountsLinePersonal ?? false;
      const newSetting = !currentSetting;

      const isEnglish = ["hide-money", "privacy"].includes(action);

      if (!user.settings) {
        await prisma.userSettings.create({
          data: {
            userId: user.id,
            hideAmountsLinePersonal: newSetting,
            enableCheckInReminders: true,
            enableCheckOutReminders: true,
            enableHolidayNotifications: false,
            timezone: "Asia/Bangkok",
            language: isEnglish ? "en" : "th",
          },
        });
      } else {
        await prisma.userSettings.update({
          where: { userId: user.id },
          data: { hideAmountsLinePersonal: newSetting },
        });
      }

      const emoji = newSetting ? "🙈" : "👁️";
      const successMessage = {
        type: "text",
        text: isEnglish
          ? `${emoji} ${newSetting ? "Enabled" : "Disabled"} hide amounts in personal chat.\n\n${newSetting ? "Amounts will show as •••••• in 1:1 chat." : "Amounts will now be visible in 1:1 chat."}`
          : `${emoji} ${newSetting ? "เปิด" : "ปิด"}ซ่อนจำนวนเงินในแชทส่วนตัวแล้ว\n\n${newSetting ? "จำนวนเงินจะแสดงเป็น •••••• ในแชท 1:1" : "จำนวนเงินจะแสดงปกติในแชท 1:1"}`,
      };
      await sendMessage(req, [successMessage]);
      return;
    }

    // Toggle privacy — ซ่อนเงิน LINE กลุ่ม
    if (
      ["ซ่อนเงินกลุ่ม", "hide-money-group", "privacy-group"].includes(action)
    ) {
      const currentSetting = user.settings?.hideAmountsLineGroup ?? false;
      const newSetting = !currentSetting;

      const isEnglish = ["hide-money-group", "privacy-group"].includes(action);

      if (!user.settings) {
        await prisma.userSettings.create({
          data: {
            userId: user.id,
            hideAmountsLineGroup: newSetting,
            enableCheckInReminders: true,
            enableCheckOutReminders: true,
            enableHolidayNotifications: false,
            timezone: "Asia/Bangkok",
            language: isEnglish ? "en" : "th",
          },
        });
      } else {
        await prisma.userSettings.update({
          where: { userId: user.id },
          data: { hideAmountsLineGroup: newSetting },
        });
      }

      const emoji = newSetting ? "🙈" : "👁️";
      const successMessage = {
        type: "text",
        text: isEnglish
          ? `${emoji} ${newSetting ? "Enabled" : "Disabled"} hide amounts in group chat.\n\n${newSetting ? "Amounts will show as •••••• in group chat." : "Amounts will now be visible in group chat."}`
          : `${emoji} ${newSetting ? "เปิด" : "ปิด"}ซ่อนจำนวนเงินในกลุ่มแล้ว\n\n${newSetting ? "จำนวนเงินจะแสดงเป็น •••••• ในกลุ่ม LINE" : "จำนวนเงินจะแสดงปกติในกลุ่ม LINE"}`,
      };
      await sendMessage(req, [successMessage]);
      return;
    }

    // Show current settings (default — no action specified)
    const currentSettings = user.settings;
    const checkInStatus = currentSettings?.enableCheckInReminders ?? true;
    const checkOutStatus = currentSettings?.enableCheckOutReminders ?? true;
    const holidayStatus = currentSettings?.enableHolidayNotifications ?? false;
    const hidePersonalStatus = currentSettings?.hideAmountsLinePersonal ?? false;
    const hideGroupStatus = currentSettings?.hideAmountsLineGroup ?? false;

    // Detect language from user's previous language setting or command
    const isEnglish =
      currentSettings?.language === "en" ||
      ["settings", "setting", "config", "preferences", "pref"].includes(
        command,
      );

    const checkInEmoji = checkInStatus ? "🔔" : "🔕";
    const checkInText = isEnglish
      ? checkInStatus
        ? "ON"
        : "OFF"
      : checkInStatus
        ? "เปิด"
        : "ปิด";
    const checkOutEmoji = checkOutStatus ? "🔔" : "🔕";
    const checkOutText = isEnglish
      ? checkOutStatus
        ? "ON"
        : "OFF"
      : checkOutStatus
        ? "เปิด"
        : "ปิด";
    const holidayEmoji = holidayStatus ? "🔔" : "🔕";
    const holidayText = isEnglish
      ? holidayStatus
        ? "ON"
        : "OFF"
      : holidayStatus
        ? "เปิด"
        : "ปิด";
    const hidePersonalEmoji = hidePersonalStatus ? "🙈" : "👁️";
    const hidePersonalText = isEnglish
      ? hidePersonalStatus
        ? "ON"
        : "OFF"
      : hidePersonalStatus
        ? "เปิด"
        : "ปิด";
    const hideGroupEmoji = hideGroupStatus ? "🙈" : "👁️";
    const hideGroupText = isEnglish
      ? hideGroupStatus
        ? "ON"
        : "OFF"
      : hideGroupStatus
        ? "เปิด"
        : "ปิด";

    const settingsMessage = {
      type: "template",
      altText: isEnglish ? "Your Settings" : "การตั้งค่าของคุณ",
      template: {
        type: "buttons",
        text: isEnglish
          ? `⚙️ Settings\n\n📢 Notifications\n${checkInEmoji} Check-in: ${checkInText}\n${checkOutEmoji} Check-out: ${checkOutText}\n${holidayEmoji} Holiday: ${holidayText}\n\n🔒 Privacy\n${hidePersonalEmoji} Hide amounts (1:1): ${hidePersonalText}\n${hideGroupEmoji} Hide amounts (Group): ${hideGroupText}`
          : `⚙️ การตั้งค่า\n\n📢 การแจ้งเตือน\n${checkInEmoji} เข้างาน: ${checkInText}\n${checkOutEmoji} เลิกงาน: ${checkOutText}\n${holidayEmoji} วันหยุด: ${holidayText}\n\n🔒 ความเป็นส่วนตัว\n${hidePersonalEmoji} ซ่อนเงิน (1:1): ${hidePersonalText}\n${hideGroupEmoji} ซ่อนเงิน (กลุ่ม): ${hideGroupText}`,
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
              ? `${hidePersonalStatus ? "Show" : "Hide"} Amounts (1:1)`
              : `${hidePersonalStatus ? "แสดง" : "ซ่อน"}เงิน (แชทส่วนตัว)`,
            text: isEnglish ? "/settings hide-money" : "/ตั้งค่า ซ่อนเงิน",
          },
          {
            type: "message",
            label: isEnglish
              ? `${hideGroupStatus ? "Show" : "Hide"} Amounts (Group)`
              : `${hideGroupStatus ? "แสดง" : "ซ่อน"}เงิน (กลุ่ม)`,
            text: isEnglish
              ? "/settings hide-money-group"
              : "/ตั้งค่า ซ่อนเงินกลุ่ม",
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

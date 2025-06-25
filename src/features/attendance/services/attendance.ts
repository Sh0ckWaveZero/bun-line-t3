import { db } from "../../../lib/database/db";
import { selectRandomElement } from "../../../lib/crypto-random";
import {
  roundToTwoDecimals,
  roundToOneDecimal,
  calculatePercentage,
  calculateAverage,
} from "../../../lib/utils/number";
import {
  getCurrentUTCTime,
  getCurrentBangkokTime,
  convertUTCToBangkok,
  getTodayDateString,
  formatThaiTime,
  formatThaiTimeOnly,
} from "../../../lib/utils/datetime";
import {
  isWorkingDay,
  isPublicHoliday,
  isValidCheckInTime,
  calculateExpectedCheckOutTime,
  getWorkingHoursInfo,
  getWorkingDaysInMonth,
  getUsersWithPendingCheckout,
  calculateUserReminderTime,
  shouldReceive10MinReminder,
  shouldReceiveFinalReminder,
  getUsersNeedingDynamicReminder,
} from "../helpers";
import { WORKPLACE_POLICIES } from "../constants/workplace-policies";
import type {
  CheckInResult,
  MonthlyAttendanceReport,
  AttendanceRecord,
} from "../types/attendance";
import { AttendanceStatusType } from "@prisma/client";

const checkIn = async (userId: string): Promise<CheckInResult> => {
  try {
    const todayDate = getTodayDateString();
    const utcCheckInTime = getCurrentUTCTime();
    const bangkokCheckInTime = convertUTCToBangkok(utcCheckInTime);

    console.log("=== Check-in Debug ===");
    console.log("User ID:", userId);
    console.log("Today Date:", todayDate);
    console.log("Bangkok Check-in Time:", formatThaiTime(bangkokCheckInTime));
    console.log("UTC Check-in Time:", utcCheckInTime.toISOString());
    console.log(
      "Hour (Bangkok):",
      bangkokCheckInTime.getHours(),
      "Minute:",
      bangkokCheckInTime.getMinutes(),
    );

    const isWorking = await isWorkingDay(bangkokCheckInTime);
    console.log("Is Working Day:", isWorking);

    if (!isWorking) {
      const dayName = bangkokCheckInTime.toLocaleDateString("th-TH", {
        weekday: "long",
        timeZone: "Asia/Bangkok",
      });

      const isHoliday = await isPublicHoliday(bangkokCheckInTime);
      if (isHoliday) {
        const holidayMessages = [
          `วันนี้วันหยุดนักขัตฤกษ์ ไม่ต้องมาทำงานครับ 🎉 พักผ่อนได้เลย`,
          `เฮ้ย! วันนี้วันหยุดใหญ่นะ ไปเที่ยวเลย 🏖️ อย่ามาทำงาน`,
          `วันนี้หยุดยาวๆ นอนดึกได้ แล้วไปกินข้าวอร่อยๆ 😴🍜`,
          `เป็นวันหยุดแล้วยังมาทำงาน? พักบ้างสิคะ 😅 ไปผ่อนคลายได้`,
          `อิอิ วันนี้หยุดนะจ๊ะ ไปเที่ยวกับครอบครัวดีกว่า 👨‍👩‍👧‍👦✨`,
          `หยุดแล้วหยุดแล้ว! เก็บโน๊ตบุ๊คไว้ ไปทำกิจกรรมสนุกๆ 🎮🎨`,
          `วันนี้วันพักผ่อน อย่าเครียดกับงานนะ ไปออกกำลังกายมั้ย? 🏃‍♂️💪`,
        ] as const;
        const randomMessage = selectRandomElement(holidayMessages);
        return {
          success: false,
          message: randomMessage,
        };
      }

      const weekendMessages = [
        `วันนี้${dayName}หยุดนะครับ 😴 มาทำงานวันจันทร์-ศุกร์เท่านั้น`,
        `เอ่อ... วันนี้${dayName}แล้วนะ 🤔 ไปนอนต่อดีกว่า หรือไปเที่ยว!`,
        `${dayName}แล้วยังมาทำงาน? แรงมากเลย 💪 แต่ว่าไปพักดีกว่า`,
        `ปกติ${dayName}นี่นอนดึกได้นะ 😆 ไปทำอะไรสนุกๆ มาเถอะ`,
        `${dayName}หยุดจ้า ไปกินข้าวเที่ยงอร่อยๆ แล้วไปดูหนัง 🍽️🎬`,
        `วันหยุด${dayName} ไปช็อปปิ้งหรือไปตลาดนัดมั้ย? 🛍️✨`,
        `${dayName}นี้พักเบรกๆ ไปออกกำลังกายหรือไปสปาก็ได้ 🧘‍♀️💆‍♂️`,
      ] as const;
      const randomMessage = selectRandomElement(weekendMessages);
      return {
        success: false,
        message: randomMessage,
      };
    }

    const timeValidation = isValidCheckInTime(bangkokCheckInTime);
    console.log("Time Validation:", timeValidation);

    if (!timeValidation.valid) {
      return {
        success: false,
        message: timeValidation.message || "เวลาเข้างานไม่ถูกต้อง",
      };
    }

    let recordedCheckInTimeUTC = utcCheckInTime;
    let calculatedExpectedCheckOutTimeUTC: Date;
    let attendanceStatus: AttendanceStatusType =
      AttendanceStatusType.CHECKED_IN_ON_TIME;

    if (timeValidation.isEarlyCheckIn) {
      recordedCheckInTimeUTC = utcCheckInTime;
      const year = bangkokCheckInTime.getFullYear();
      const month = bangkokCheckInTime.getMonth();
      const date = bangkokCheckInTime.getDate();
      const bangkokCheckout = new Date(year, month, date, 17, 0, 0, 0);
      calculatedExpectedCheckOutTimeUTC = new Date(
        bangkokCheckout.getTime() - 7 * 60 * 60 * 1000,
      );
    } else if (timeValidation.isLateCheckIn) {
      // สำหรับกรณีเข้างานสาย คำนวณเวลาเลิกงานโดยบวกเวลาจากเวลาเข้างานจริงไป 9 ชม.
      calculatedExpectedCheckOutTimeUTC = calculateExpectedCheckOutTime(
        recordedCheckInTimeUTC,
      );
      attendanceStatus = AttendanceStatusType.CHECKED_IN_LATE;
    } else {
      calculatedExpectedCheckOutTimeUTC = calculateExpectedCheckOutTime(
        recordedCheckInTimeUTC,
      );
    }

    const existingAttendance = await db.workAttendance.findUnique({
      where: {
        userId_workDate: {
          userId: userId,
          workDate: todayDate,
        },
      },
    });

    if (existingAttendance) {
      // 🔍 ตรวจสอบว่าออกงานแล้วหรือไม่ (รวมทั้ง manual checkout และ auto checkout)
      if (
        existingAttendance.status === AttendanceStatusType.CHECKED_OUT ||
        existingAttendance.status ===
          AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT
      ) {
        await db.workAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            checkInTime: recordedCheckInTimeUTC,
            checkOutTime: null,
            status: AttendanceStatusType.CHECKED_IN_ON_TIME, // Updated to use AttendanceStatusType
          },
        });

        const afternoonMessages = [
          "ยิ้มๆ กลับมาแล้ว! (ครึ่งวันหลัง) 🌇",
          "ยินดีต้อนรับกลับ! 🌇 เข้างานช่วงบ่ายแล้ว",
          "กลับมาแล้ว! 😊 เข้างานช่วงบ่าย",
          "เริ่มงานช่วงบ่ายกันเลย! ☀️",
          "ช่วงบ่ายมาแล้ว 🕐 เริ่มทำงานต่อ",
          "เข้างานครึ่งวันหลังเรียบร้อย! 👌",
        ] as const;
        const randomMessage = selectRandomElement(afternoonMessages);

        return {
          success: true,
          message: randomMessage,
          checkInTime: recordedCheckInTimeUTC,
          expectedCheckOutTime: calculatedExpectedCheckOutTimeUTC,
        };
      }

      const alreadyCheckedInMessages = [
        "คุณได้ลงชื่อเข้างานวันนี้แล้ว",
        "เฮ้ย! เข้างานไปแล้วนะ 🤔 จำไม่ได้เหรอ?",
        "มาแล้วค่ะ มาแล้ว! 😄 เข้างานไปตั้งแต่เช้าแล้ว",
        "อิอิ ลืมแล้วเหรอ? เช็คอินไปแล้วนะจ๊ะ ✅",
        "เอ๊ะ? เข้างานไปแล้วนี่นา 🙃 ความจำไม่ดีแล้วเหรอ",
        "มาเก็บข้าวแกงมั้ย? เพราะเข้างานไปแล้ว 😂🍱",
        "ระวังหลงทางในออฟฟิศนะ เข้างานไปแล้วน้า 🗺️",
      ] as const;
      const randomMessage = selectRandomElement(alreadyCheckedInMessages);
      return {
        success: false,
        message: randomMessage,
        alreadyCheckedIn: true,
        checkInTime: existingAttendance.checkInTime,
        expectedCheckOutTime: calculateExpectedCheckOutTime(
          existingAttendance.checkInTime,
        ),
      };
    }

    await db.workAttendance.create({
      data: {
        userId: userId,
        checkInTime: recordedCheckInTimeUTC,
        workDate: todayDate,
        status: attendanceStatus, // Updated to use the new status
      },
    });

    const bangkokCheckInForDisplay = convertUTCToBangkok(
      recordedCheckInTimeUTC,
    );
    const bangkokCheckOutForDisplay = convertUTCToBangkok(
      calculatedExpectedCheckOutTimeUTC,
    );

    const checkInTimeStr = formatThaiTimeOnly(bangkokCheckInForDisplay);
    const expectedCheckOutStr = formatThaiTimeOnly(bangkokCheckOutForDisplay);
    const successMessages = [
      `เยี่ยม! เข้างานแล้ว 🌟 ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
      `เย่! เข้างานแล้ว 🎉 ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
      `ยินดีต้อนรับสู่ออฟฟิศ! ⭐ ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
      `สู้ๆ วันนี้นะ! 💪 เข้างาน ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
      `เริ่มต้นวันใหม่แล้ว ✨ ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
      `มาแล้วจ้า! 😊 เข้างาน ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
      `พร้อมทำงานแล้ว! 🚀 ${checkInTimeStr} น. (เลิกงาน ${expectedCheckOutStr} น.)`,
    ] as const;

    let message = selectRandomElement(successMessages);

    if (timeValidation.isEarlyCheckIn) {
      const hour = bangkokCheckInForDisplay.getHours();
      const checkInStr = checkInTimeStr;
      const checkOutStr = "17:00 น.";

      const earlyMessages = [
        `\n⏰ มาถึงสำนักงานตั้งแต่ ${checkInStr} น. (เลิกงาน ${checkOutStr})`,
        `\n🌅 มาเช้ามากเลย! ${checkInStr} น. (เลิกงาน ${checkOutStr})`,
        `\n⭐ ขยันจัง! มาตั้งแต่ ${checkInStr} น. (เลิกงาน ${checkOutStr})`,
        `\n🐓 ไก่ยังไม่ขัน! ${checkInStr} น. (เลิกงาน ${checkOutStr})`,
      ] as const;

      if (hour < 1) {
        message += `\n🌙 มาถึงสำนักงานหลังเที่ยงคืน ${checkInStr} น. (เลิกงาน ${checkOutStr})`;
      } else {
        message += selectRandomElement(earlyMessages);
      }
    } else if (timeValidation.isLateCheckIn) {
      const checkInStr = checkInTimeStr;
      const checkOutStr = expectedCheckOutStr;

      const lateMessages = [
        `\n⏰ ฮั่นแน่!! มาสายอีกแล้ววววว ${checkInStr} น. นอนล่ะสิ นอนจนหมีพาไป!! แต่อึนๆ ไม่เป็นไร บันทึกให้แล้ว (เลิกงาน ${checkOutStr})`,
        `\n🌞 เห้ยยยยย!! มาละมาละๆ ดีกว่าขี้เกียจตื่น! ${checkInStr} น. สายมากกกกก แต่ไม่โดนหักเงินนะจ๊ะ ครั้งนี้ไว้ก่อน! (เลิกงาน ${checkOutStr})`,
        `\n⭐ โอ้โห!! มาแบบสายแซ่บเว่อร์!! ${checkInStr} น. เลทบัท เก๊ทททททท! มาแล้วก็ถือว่ามานะ มาได้ก็ดีแล้ว อิอิ (เลิกงาน ${checkOutStr})`,
        `\n😅 โอ้ยยยยย นาฬิกาปลุกพังหรือคนพัง!! ${checkInStr} น. รถติด? ฝนตก? ตื่นไม่ไหว? อ้างได้! ระบบอนุโลมให้ก็แล้วกัน! (เลิกงาน ${checkOutStr})`,
        `\n🚨 อรุณสวัสดิ์.....บ่าย 3 โมงงงง! ตื่นหรือยังงงง! ${checkInStr} น. มาช้าแบบ VIP! แต่มาแล้ว! ยังดีที่ไม่เบี้ยว! (เลิกงาน ${checkOutStr})`,
        `\n😎 แหมมมม คนดีเค้ารอได้ค่าาา! มาแบบสายสุดติ่ง ${checkInStr} น. แต่ไม่ว่ากันนะ!! เค้ารักเธออออ (เลิกงาน ${checkOutStr})`,
        `\n🐢 มาแบบ สาย สาย ซุปเปอร์สายยย! ${checkInStr} น. (เลิกงาน ${checkOutStr}) - บอสใจดีเว่อร์!! วันหลังตื่นเร็วๆหน่อยนะจ๊ะ คนขี้สายจุงเบย!!`,
        `\n🔥 เฮ้ยยย! ไฟไหม้ที่ไหนนน มาช้าขนาดนี้!! ${checkInStr} น. ตื่นมาคงงงๆ แต่ไม่สายเกินรักเรานะ! (เลิกงาน ${checkOutStr})`,
        `\n🐣 ไข่ยังไม่ฟักเลยมาป่านนี้!! ${checkInStr} น. แต่เราให้อภัย เพราะอย่างน้อยก็มา! (เลิกงาน ${checkOutStr})`,
      ] as const;

      message += selectRandomElement(lateMessages);
    }

    return {
      success: true,
      message: message,
      checkInTime: recordedCheckInTimeUTC,
      expectedCheckOutTime: calculatedExpectedCheckOutTimeUTC,
      isEarlyCheckIn: timeValidation.isEarlyCheckIn,
      isLateCheckIn: timeValidation.isLateCheckIn,
      actualCheckInTime: timeValidation.isEarlyCheckIn
        ? recordedCheckInTimeUTC
        : undefined,
    };
  } catch (error) {
    console.error("Error during check-in:", error);
    const gentleErrorMessages = [
      "อุ๊ปส์ ระบบมีอาการงัวเงียนิดหน่อย 🌸 รอซักครู่แล้วลองใหม่นะคะ",
      "เอ๊ะ มีอะไรผิดปกติเล็กน้อย 🦋 ช่วยลองใหม่อีกครั้งได้มั้ยคะ",
      "โทษทีนะคะ ระบบกำลังหลับในค่ะ 😴💤 ลองกดใหม่ดูนะ",
      "อ่าว มีบางอย่างไม่ค่อยเรียบร้อย 🌺 ขอโทษด้วยนะ ลองใหม่ได้เลย",
      "โอ้โห ระบบงงๆ นิดหน่อย 🌙✨ รอหน่อยแล้วลองใหม่ดูนะคะ",
      "ขออภัยค่ะ มีเรื่องไม่คาดฝันเกิดขึ้น 🌿 ลองอีกครั้งได้มั้ยคะ",
      "เสียใจด้วยนะ ระบบค้างซักหน่อย 🕊️ ช่วยรอแป้บแล้วลองใหม่ค่ะ",
    ] as const;
    const randomMessage = selectRandomElement(gentleErrorMessages);
    return {
      success: false,
      message: randomMessage,
    };
  }
};

const checkOut = async (userId: string): Promise<CheckInResult> => {
  try {
    const todayDate = getTodayDateString();
    const checkOutTime = getCurrentUTCTime();
    const attendance = await db.workAttendance.findUnique({
      where: {
        userId_workDate: {
          userId: userId,
          workDate: todayDate,
        },
      },
    });

    if (!attendance) {
      const gentleNotFoundMessages = [
        "หืม... ดูเหมือนว่าวันนี้ยังไม่ได้เข้างานเลยนะ 🌸 ลองเข้างานก่อนไหมคะ",
        "อ่าว ไม่เจอการลงชื่อเข้างานวันนี้เลย 🦋 เข้างานก่อนแล้วค่อยออกนะ",
        "เอ๊ะ วันนี้ยังไม่ได้เซ็นชื่อเข้างานเหรอคะ 😴 ลองเข้างานก่อนดูนะ",
        "โอ้โห ยังไม่เจอรอยเท้าการเข้างานวันนี้เลย 🌺 เข้างานก่อนไหมคะ",
        "ดูสิ ยังไม่มีการเข้างานวันนี้เลย 🌙 ลองเข้างานก่อนแล้วค่อยออกนะ",
        "อุ๊ปส์ วันนี้ยังไม่ได้เริ่มงานเหรอคะ 🌿 เข้างานก่อนแล้วค่อยออกนะ",
        "เฮ้ย ยังไม่เจอข้อมูลการเข้างานวันนี้เลย 🕊️ ลองเข้างานก่อนดูไหม",
      ] as const;
      const randomMessage = selectRandomElement(gentleNotFoundMessages);
      return {
        success: false,
        message: randomMessage,
      };
    }

    // 🔍 ตรวจสอบว่าออกงานแล้วหรือไม่ (รวมทั้ง manual checkout และ auto checkout)
    if (
      attendance.status === AttendanceStatusType.CHECKED_OUT ||
      attendance.status === AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT
    ) {
      const storedCheckOutTime = attendance.checkOutTime || checkOutTime;
      const workingHoursMs =
        storedCheckOutTime.getTime() - attendance.checkInTime.getTime();
      const workingHours = workingHoursMs / (1000 * 60 * 60);
      const workHours = roundToOneDecimal(workingHours);

      const alreadyCheckedOutMessages = [
        `เฮ้ย ออกงานไปแล้วนะ 😄 ทำงานมา ${workHours} ชม. เก่งมาก!`,
        `อ่าว ลงชื่อออกไปแล้วจ้า 🎉 วันนี้ทำงาน ${workHours} ชม. เลย`,
        `โอ้โห ออกงานไปแล้วหรอ 😊 ทำงานครบ ${workHours} ชม. แล้วนะ`,
        `เออ ออกงานไปแล้วแหละ ✨ วันนี้ทำงาน ${workHours} ชม. เหนื่อยมั้ย`,
        `เฮ้ อ๊ากกก ออกไปแล้วจ้า 💪 ทำงานมา ${workHours} ชม. เก่งสุดๆ`,
        `หืม... ออกงานไปแล้วนะคะ 🚀 วันนี้ทำงาน ${workHours} ชม.`,
        `อุ๊ปส์ ออกไปแล้วแหละ 😌 ทำงานได้ ${workHours} ชม. ดีมาก!`,
      ] as const;
      const randomMessage = selectRandomElement(alreadyCheckedOutMessages);
      return {
        success: false,
        message: randomMessage,
        checkInTime: attendance.checkInTime,
        expectedCheckOutTime: storedCheckOutTime,
      };
    }

    const workingHoursMs =
      checkOutTime.getTime() - attendance.checkInTime.getTime();
    const workingHours = workingHoursMs / (1000 * 60 * 60);
    const isCompleteWorkDay =
      workingHours >= WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY;
    await db.workAttendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        checkOutTime: checkOutTime,
        status: AttendanceStatusType.CHECKED_OUT,
      },
    });

    const bangkokCheckInTime = convertUTCToBangkok(attendance.checkInTime);
    const bangkokCheckOutTime = convertUTCToBangkok(checkOutTime);
    const checkInTimeStr = formatThaiTimeOnly(bangkokCheckInTime);
    const checkOutTimeStr = formatThaiTimeOnly(bangkokCheckOutTime);

    const successCheckoutMessages = [
      "ยิ้มๆ เสร็จงานเรียบร้อยแล้ว! 🎉",
      "ออกงานแล้วจ้า ดีมากก! ✨",
      "เก่งมาก! ทำงานจบแล้ว 💪",
      "สุดยอด! วันนี้ทำงานเสร็จแล้ว 😊",
      "โอเค! ออกงานเรียบร้อย 🚀",
      "ได้แล้ว! เลิกงานแล้วจ้า 😌",
      "เยี่ยม! ลงชื่อออกงานสำเร็จ 🌟",
    ] as const;
    const randomSuccessMessage = selectRandomElement(successCheckoutMessages);

    const workHours = roundToOneDecimal(workingHours);
    let message = `${randomSuccessMessage}\nเข้างาน: ${checkInTimeStr} น.\nออกงาน: ${checkOutTimeStr} น.\nรวม: ${workHours} ชม.`;

    if (!isCompleteWorkDay) {
      const shortHours = WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY - workingHours;
      const shortHoursStr = roundToOneDecimal(shortHours);
      const shortWorkMessages = [
        `💭 วันนี้ทำงานเร็วไปนิดนึง (ขาด ${shortHoursStr} ชม.)`,
        `🤔 อ่าว เลิกเร็วไปหน่อยนะ (ขาด ${shortHoursStr} ชม.)`,
        `😊 วันนี้เลิกงานเร็วนะ (ขาด ${shortHoursStr} ชม.)`,
        `🌸 ทำงานสั้นไปนิดหน่อย (ขาด ${shortHoursStr} ชม.)`,
      ] as const;
      const randomShortMessage = selectRandomElement(shortWorkMessages);
      message += `\n${randomShortMessage}`;
    } else {
      const completeWorkMessages = [
        "✨ ทำงานครบตามนโยบาย เก่งมาก!",
        "🎯 สุดยอด! ทำงานครบแล้ว",
        "💪 เยี่ยม! ทำงานครบ 8 ชม.",
        "🌟 ดีมาก! ครบตามนโยบาย",
        "🎉 เก่งจัง! ทำงานครบเวลา",
      ] as const;
      const randomCompleteMessage = selectRandomElement(completeWorkMessages);
      message += `\n${randomCompleteMessage}`;
    }

    return {
      success: true,
      message: message,
      checkInTime: attendance.checkInTime,
      expectedCheckOutTime: checkOutTime,
    };
  } catch (error) {
    console.error("Error during check-out:", error);
    const gentleErrorMessages = [
      "อุ๊ปส์ ระบบมีอาการงัวเงียนิดหน่อย 🌸 รอซักครู่แล้วลองใหม่นะคะ",
      "เอ๊ะ มีอะไรผิดปกติเล็กน้อย 🦋 ช่วยลองใหม่อีกครั้งได้มั้ยคะ",
      "โทษทีนะคะ ระบบกำลังหลับในค่ะ 😴💤 ลองกดใหม่ดูนะ",
      "อ่าว มีบางอย่างไม่ค่อยเรียบร้อย 🌺 ขอโทษด้วยนะ ลองใหม่ได้เลย",
      "โอ้โห ระบบงงๆ นิดหน่อย 🌙✨ รอหน่อยแล้วลองใหม่ดูนะคะ",
      "ขออภัยค่ะ มีเรื่องไม่คาดฝันเกิดขึ้น 🌿 ลองอีกครั้งได้มั้ยคะ",
      "เสียใจด้วยนะ ระบบค้างซักหน่อย 🕊️ ช่วยรอแป้บแล้วลองใหม่ค่ะ",
    ] as const;
    const randomMessage = selectRandomElement(gentleErrorMessages);
    return {
      success: false,
      message: randomMessage,
    };
  }
};

const getTodayAttendance = async (userId: string) => {
  try {
    const todayDate = getTodayDateString();

    const attendance = await db.workAttendance.findUnique({
      where: {
        userId_workDate: {
          userId: userId,
          workDate: todayDate,
        },
      },
    });

    return attendance;
  } catch (error) {
    console.error("Error getting today attendance:", error);
    return null;
  }
};

const getMonthlyAttendanceReport = async (
  userId: string,
  month: string,
): Promise<MonthlyAttendanceReport | null> => {
  try {
    const [year, monthNum] = month.split("-");
    if (!year || !monthNum) {
      throw new Error("Invalid month format. Use YYYY-MM");
    }
    const firstDay = `${year}-${monthNum.padStart(2, "0")}-01`;
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const lastDayStr = `${year}-${monthNum.padStart(2, "0")}-${lastDay.toString().padStart(2, "0")}`;

    const attendanceRecords = await db.workAttendance.findMany({
      where: {
        userId: userId,
        workDate: {
          gte: firstDay,
          lte: lastDayStr,
        },
      },
      orderBy: {
        workDate: "asc",
      },
    });

    const workingDaysInMonth = await getWorkingDaysInMonth(
      parseInt(year),
      parseInt(monthNum) - 1,
    );
    const processedRecords: AttendanceRecord[] = attendanceRecords.map(
      (record) => {
        let hoursWorked: number | null = null;

        if (record.checkInTime && record.checkOutTime) {
          const timeDiff =
            record.checkOutTime.getTime() - record.checkInTime.getTime();
          hoursWorked = timeDiff / (1000 * 60 * 60);
        }

        return {
          id: record.id,
          workDate: record.workDate,
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          status: record.status,
          hoursWorked: hoursWorked,
        };
      },
    );

    const totalDaysWorked = processedRecords.length;
    const totalHoursWorked = processedRecords.reduce((total, record) => {
      return total + (record.hoursWorked || 0);
    }, 0);
    const attendanceRate = calculatePercentage(
      totalDaysWorked,
      workingDaysInMonth,
    );

    const completeDays = processedRecords.filter(
      (record) =>
        record.hoursWorked &&
        record.hoursWorked >= WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY,
    ).length;
    const complianceRate = calculatePercentage(completeDays, totalDaysWorked);
    const averageHoursPerDay = calculateAverage(
      totalHoursWorked,
      totalDaysWorked,
    );
    const roundedTotalHours = roundToTwoDecimals(totalHoursWorked);
    const roundedAttendanceRate = roundToTwoDecimals(attendanceRate);
    const roundedComplianceRate = roundToTwoDecimals(complianceRate);
    const roundedAverageHours = roundToTwoDecimals(averageHoursPerDay);

    return {
      userId,
      month,
      totalDaysWorked,
      totalHoursWorked: roundedTotalHours,
      attendanceRecords: processedRecords,
      workingDaysInMonth,
      attendanceRate: roundedAttendanceRate,
      complianceRate: roundedComplianceRate,
      averageHoursPerDay: roundedAverageHours,
      completeDays,
    };
  } catch (error) {
    console.error("Error getting monthly attendance report:", error);
    return null;
  }
};

// Debug function to check current time and validation
const debugTimeValidation = () => {
  const currentBangkokTime = getCurrentBangkokTime();
  const currentUTCTime = getCurrentUTCTime();
  const timeValidation = isValidCheckInTime(currentBangkokTime);
  const todayDate = getTodayDateString();

  console.log("=== Debug Time Validation ===");
  console.log("Current Bangkok Time:", formatThaiTime(currentBangkokTime));
  console.log("Current UTC Time:", currentUTCTime.toISOString());
  console.log("Current Hour (Bangkok):", currentBangkokTime.getHours());
  console.log("Current Minute (Bangkok):", currentBangkokTime.getMinutes());
  console.log("Today Date String:", todayDate);
  console.log("Time Validation:", timeValidation);
  console.log("Is Early Check-in:", timeValidation.isEarlyCheckIn);
  console.log("Is Late Check-in:", timeValidation.isLateCheckIn);
  console.log("============================");

  return {
    currentBangkokTime,
    currentUTCTime,
    timeValidation,
    todayDate,
    formattedTime: formatThaiTime(currentBangkokTime),
  };
};

export const attendanceService = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMonthlyAttendanceReport,
  debugTimeValidation,
  WORKPLACE_POLICIES,

  isWorkingDay,
  isPublicHoliday,
  isValidCheckInTime,
  calculateExpectedCheckOutTime,
  getWorkingHoursInfo,
  getWorkingDaysInMonth,
  getUsersWithPendingCheckout,
  calculateUserReminderTime,
  shouldReceive10MinReminder,
  shouldReceiveFinalReminder,
  getUsersNeedingDynamicReminder,

  getCurrentBangkokTime,
  getCurrentUTCTime,
  convertUTCToBangkok,
  formatThaiTime,
  formatThaiTimeOnly,
};

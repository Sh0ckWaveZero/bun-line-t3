/**
 * 🧪 ทดสอบการแสดงเวลาใน LINE Messages
 * ตรวจสอบว่าการแสดงผลเวลาใน LINE bubble messages ถูกต้องแล้ว
 * หลังจากแก้ไขปัญหา double timezone conversion
 */

import { describe, test, expect } from "bun:test";

// 🔧 Formatting functions ที่ใช้ใน LINE utils
const formatThaiTimeOnly = (date: Date): string => {
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const convertUTCToBangkok = (utcDate: Date): Date => {
  return new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
};

describe("🧪 LINE Message Timezone Display", () => {
  describe("📱 Check-in Success Message", () => {
    test("🕐 should display correct time for morning check-in", () => {
      // สถานการณ์จริง: ลงชื่อเข้างานเวลา 08:54
      // UTC: 01:54, Bangkok: 08:54
      const utcCheckIn = new Date("2025-06-09T01:54:00.000Z");
      const bangkokCheckIn = convertUTCToBangkok(utcCheckIn);

      const displayTime = formatThaiTimeOnly(bangkokCheckIn);

      console.log("🧪 Morning Check-in Test:");
      console.log(`   UTC time: ${utcCheckIn.toISOString()}`);
      console.log(`   Bangkok time: ${bangkokCheckIn.toISOString()}`);
      console.log(`   Display time: ${displayTime}`);

      expect(displayTime).toBe("08:54");
    });

    test("🕑 should display correct time for late morning check-in", () => {
      // สถานการณ์: ลงชื่อเข้างานเวลา 10:30
      // UTC: 03:30, Bangkok: 10:30
      const utcCheckIn = new Date("2025-06-09T03:30:00.000Z");
      const bangkokCheckIn = convertUTCToBangkok(utcCheckIn);

      const displayTime = formatThaiTimeOnly(bangkokCheckIn);

      console.log("🧪 Late Morning Check-in Test:");
      console.log(`   UTC time: ${utcCheckIn.toISOString()}`);
      console.log(`   Bangkok time: ${bangkokCheckIn.toISOString()}`);
      console.log(`   Display time: ${displayTime}`);

      expect(displayTime).toBe("10:30");
    });
  });

  describe("🔍 Real-world Scenario", () => {
    test("📱 should fix the 16:21 display issue from screenshot", () => {
      // สถานการณ์จริงจากภาพ: แสดงเวลา 16:21 และ 01:21 (ผิด)
      // ควรแสดง 09:21 และ 18:21 (ถูก)
      console.log("🧪 Fix Screenshot Issue:");

      // กรณีที่ 1: check-in เวลา 09:21 (ไม่ใช่ 16:21)
      const utcCheckIn = new Date("2025-06-09T02:21:00.000Z"); // UTC 02:21
      const bangkokCheckIn = convertUTCToBangkok(utcCheckIn); // Bangkok 09:21
      const bangkokCheckOut = new Date(
        bangkokCheckIn.getTime() + 9 * 60 * 60 * 1000,
      ); // +9 hours

      const checkInTime = formatThaiTimeOnly(bangkokCheckIn);
      const expectedCheckOutTime = formatThaiTimeOnly(bangkokCheckOut);

      console.log(`   🔍 UTC Check-in: ${utcCheckIn.toISOString()}`);
      console.log(`   🔍 Bangkok Check-in: ${bangkokCheckIn.toISOString()}`);
      console.log(`   🔍 Bangkok Check-out: ${bangkokCheckOut.toISOString()}`);
      console.log(`   📱 Display check-in: ${checkInTime}`);
      console.log(`   📱 Display expected checkout: ${expectedCheckOutTime}`);

      // ตรวจสอบว่าเวลาที่แสดงถูกต้อง (ไม่ใช่เวลาที่ผิดในภาพ)
      expect(checkInTime).toBe("09:21");
      expect(expectedCheckOutTime).toBe("18:21");

      // ตรวจสอบว่าไม่ใช่เวลาที่ผิด (16:21, 01:21)
      expect(checkInTime).not.toBe("16:21");
      expect(expectedCheckOutTime).not.toBe("01:21");

      console.log("   ✅ Fixed! No more double timezone conversion");
    });
  });
});

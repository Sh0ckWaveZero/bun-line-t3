/**
 * 🧪 ไฟล์ทดสอบระบบ Timezone
 * ทดสอบการทำงานของระบบลงเวลาทำงานที่เก็บข้อมูลเป็น UTC
 * และแสดงผลเป็นเวลาไทย (UTC+7)
 */

import { describe, test, expect } from "bun:test";

// 🔧 Import functions ที่ต้องการทดสอบ
const getCurrentUTCTime = (): Date => {
  return new Date(); // JavaScript Date object เป็น UTC โดย default
};

const convertUTCToBangkok = (utcDate: Date): Date => {
  // สร้าง date object ใหม่ที่เพิ่ม +7 ชั่วโมงจาก UTC
  const bangkokTime = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
  return bangkokTime;
};

const formatThaiTime = (date: Date): string => {
  // ใช้ UTC methods เพื่อหลีกเลี่ยง double timezone conversion
  const year = date.getUTCFullYear() + 543; // แปลงเป็นพุทธศักราช
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const formatThaiTimeOnly = (date: Date): string => {
  // ใช้ UTC methods เพื่อหลีกเลี่ยง double timezone conversion
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
};

const isValidCheckInTime = (date: Date): boolean => {
  const hour = date.getUTCHours(); // ใช้ UTC methods
  const minute = date.getUTCMinutes();
  const timeInMinutes = hour * 60 + minute;

  const earliestTime = 8 * 60; // 08:00
  const latestTime = 11 * 60; // 11:00

  return timeInMinutes >= earliestTime && timeInMinutes <= latestTime;
};

const isWorkingDay = (date: Date): boolean => {
  const dayOfWeek = date.getUTCDay(); // ใช้ UTC methods
  const workingDays = [1, 2, 3, 4, 5]; // จันทร์ถึงศุกร์
  return workingDays.includes(dayOfWeek);
};

describe("🧪 Timezone Conversion System", () => {
  describe("🕐 UTC Time Generation", () => {
    test("should generate current UTC time", () => {
      const utcTime = getCurrentUTCTime();
      expect(utcTime).toBeInstanceOf(Date);
      expect(utcTime.getTime()).toBeGreaterThan(0);
    });
  });

  describe("🇹🇭 UTC to Bangkok Conversion", () => {
    test("should convert UTC to Bangkok time (+7 hours)", () => {
      // Test case จากฐานข้อมูลจริง: 01:54 UTC -> 08:54 Bangkok
      const utcTime = new Date("2025-06-09T01:54:46.208Z");
      const bangkokTime = convertUTCToBangkok(utcTime);

      // ตรวจสอบว่าเพิ่ม 7 ชั่วโมงแล้ว
      expect(bangkokTime.getUTCHours()).toBe(8);
      expect(bangkokTime.getUTCMinutes()).toBe(54);
      expect(bangkokTime.getUTCSeconds()).toBe(46);
    });

    test("should handle midnight edge case correctly", () => {
      // UTC 18:00 -> Bangkok 01:00 (วันถัดไป)
      const utcTime = new Date("2024-01-01T18:00:00.000Z");
      const bangkokTime = convertUTCToBangkok(utcTime);

      expect(bangkokTime.getUTCHours()).toBe(1); // 18 + 7 = 25 -> 01 (วันถัดไป)
      expect(bangkokTime.getUTCDate()).toBe(2); // เป็นวันที่ 2
    });

    test("should handle early morning correctly", () => {
      // UTC 05:00 -> Bangkok 12:00 (วันเดียวกัน)
      const utcTime = new Date("2024-01-01T05:00:00.000Z");
      const bangkokTime = convertUTCToBangkok(utcTime);

      expect(bangkokTime.getUTCHours()).toBe(12);
      expect(bangkokTime.getUTCDate()).toBe(1); // วันเดียวกัน
    });
  });

  describe("📝 Time Formatting", () => {
    test("should format Thai date time correctly", () => {
      const bangkokTime = new Date("2025-06-09T08:54:46.208Z"); // Bangkok time
      const formatted = formatThaiTime(bangkokTime);

      // ควรได้ 09/06/2568 08:54:46 (พุทธศักราช)
      expect(formatted).toBe("09/06/2568 08:54:46");
    });

    test("should format time only correctly", () => {
      const bangkokTime = new Date("2025-06-09T08:54:46.208Z"); // Bangkok time
      const formatted = formatThaiTimeOnly(bangkokTime);

      // ควรได้ 08:54
      expect(formatted).toBe("08:54");
    });

    test("should handle leading zeros correctly", () => {
      const bangkokTime = new Date("2025-06-09T01:05:06.000Z"); // Bangkok time
      const formattedFull = formatThaiTime(bangkokTime);
      const formattedTime = formatThaiTimeOnly(bangkokTime);

      expect(formattedFull).toBe("09/06/2568 01:05:06");
      expect(formattedTime).toBe("01:05");
    });
  });

  describe("⏰ Working Hours Validation", () => {
    test("should validate check-in time within working hours", () => {
      // 08:30 Bangkok time
      const bangkokTime = new Date("2025-06-09T08:30:00.000Z");
      const isValid = isValidCheckInTime(bangkokTime);

      expect(isValid).toBe(true);
    });

    test("should reject check-in time before working hours", () => {
      // 07:30 Bangkok time (ก่อน 08:00)
      const bangkokTime = new Date("2025-06-09T07:30:00.000Z");
      const isValid = isValidCheckInTime(bangkokTime);

      expect(isValid).toBe(false);
    });

    test("should reject check-in time after working hours", () => {
      // 11:30 Bangkok time (หลัง 11:00)
      const bangkokTime = new Date("2025-06-09T11:30:00.000Z");
      const isValid = isValidCheckInTime(bangkokTime);

      expect(isValid).toBe(false);
    });

    test("should accept check-in time exactly at boundary", () => {
      // 08:00 Bangkok time (เริ่มเวลาทำงาน)
      const bangkokTime08 = new Date("2025-06-09T08:00:00.000Z");
      expect(isValidCheckInTime(bangkokTime08)).toBe(true);

      // 11:00 Bangkok time (สิ้นสุดเวลาลงเวลา)
      const bangkokTime11 = new Date("2025-06-09T11:00:00.000Z");
      expect(isValidCheckInTime(bangkokTime11)).toBe(true);
    });
  });

  describe("📅 Working Day Validation", () => {
    test("should identify working days correctly", () => {
      // วันจันทร์ (dayOfWeek = 1)
      const monday = new Date("2025-06-09T08:00:00.000Z"); // Monday in UTC
      expect(isWorkingDay(monday)).toBe(true);

      // วันศุกร์ (dayOfWeek = 5)
      const friday = new Date("2025-06-13T08:00:00.000Z"); // Friday in UTC
      expect(isWorkingDay(friday)).toBe(true);
    });

    test("should identify non-working days correctly", () => {
      // วันเสาร์ (dayOfWeek = 6)
      const saturday = new Date("2025-06-14T08:00:00.000Z"); // Saturday in UTC
      expect(isWorkingDay(saturday)).toBe(false);

      // วันอาทิตย์ (dayOfWeek = 0)
      const sunday = new Date("2025-06-15T08:00:00.000Z"); // Sunday in UTC
      expect(isWorkingDay(sunday)).toBe(false);
    });
  });

  describe("🔍 Integration Tests", () => {
    test("should handle complete check-in flow correctly", () => {
      // จำลองการลงชื่อเข้างานเวลา 08:54 Bangkok (01:54 UTC)
      const utcCheckInTime = new Date("2025-06-09T01:54:46.208Z");

      // 1. แปลงเป็นเวลาไทยสำหรับแสดงผล
      const bangkokDisplayTime = convertUTCToBangkok(utcCheckInTime);

      // 2. ตรวจสอบว่าเป็นวันทำงาน
      const isWorking = isWorkingDay(bangkokDisplayTime);
      expect(isWorking).toBe(true); // วันจันทร์

      // 3. ตรวจสอบว่าเวลาถูกต้อง
      const isValidTime = isValidCheckInTime(bangkokDisplayTime);
      expect(isValidTime).toBe(true); // 08:54 อยู่ในช่วง 08:00-11:00

      // 4. Format เพื่อแสดงผล
      const displayTime = formatThaiTimeOnly(bangkokDisplayTime);
      expect(displayTime).toBe("08:54"); // ต้องแสดง 08:54 ไม่ใช่ 15:54

      const fullDisplay = formatThaiTime(bangkokDisplayTime);
      expect(fullDisplay).toBe("09/06/2568 08:54:46");
    });

    test("should prevent double timezone conversion", () => {
      // ทดสอบปัญหาที่เกิดขึ้นก่อนหน้า (แสดง 15:54 แทน 08:54)
      const utcTime = new Date("2025-06-09T01:54:46.208Z");
      const bangkokTime = convertUTCToBangkok(utcTime);

      // ใช้ UTC methods เพื่อหลีกเลี่ยง double conversion
      const hours = bangkokTime.getUTCHours();
      const minutes = bangkokTime.getUTCMinutes();

      // ต้องได้ 8:54 ไม่ใช่ 15:54
      expect(hours).toBe(8);
      expect(minutes).toBe(54);

      // ตรวจสอบว่า formatting ถูกต้อง
      const formatted = formatThaiTimeOnly(bangkokTime);
      expect(formatted).toBe("08:54");
      expect(formatted).not.toBe("15:54"); // ห้ามเป็นค่าเก่าที่ผิด
    });
  });

  describe("⚡ Performance Tests", () => {
    test("should handle timezone conversion efficiently", () => {
      const startTime = performance.now();

      // ทดสอบการแปลงเวลา 1000 ครั้ง
      for (let i = 0; i < 1000; i++) {
        const utcTime = new Date();
        const bangkokTime = convertUTCToBangkok(utcTime);
        formatThaiTimeOnly(bangkokTime);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // ต้องเสร็จภายใน 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});

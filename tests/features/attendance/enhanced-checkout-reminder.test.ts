import { describe, test, expect } from "bun:test";
import {
  calculateUserReminderTime,
  shouldReceiveReminderNow,
} from "../../../src/features/attendance/helpers/utils";
import { convertUTCToBangkok } from "../../../src/lib/utils/datetime";

describe("Enhanced Checkout Reminder Tests", () => {
  describe("calculateUserReminderTime", () => {
    test("should calculate correct reminder time for 08:43 check-in", () => {
      // Test case จากปัญหาที่พบ
      // เข้างาน 08:43 น. (Bangkok) = 01:43 น. (UTC)
      const checkInTimeUTC = new Date("2025-06-17T01:43:00.000Z");

      // คำนวณเวลาแจ้งเตือน (ลบ 30 นาที)
      const reminderTime = calculateUserReminderTime(checkInTimeUTC, 30);
      const reminderBangkok = convertUTCToBangkok(reminderTime);

      // ควรได้เวลาแจ้งเตือน = 17:13 น. (08:43 + 9 ชม. - 30 นาที)
      expect(reminderBangkok.getHours()).toBe(17);
      expect(reminderBangkok.getMinutes()).toBe(13);
    });

    test("should calculate correct reminder time for 09:00 check-in", () => {
      // เข้างาน 09:00 น. (Bangkok) = 02:00 น. (UTC)
      const checkInTimeUTC = new Date("2025-06-17T02:00:00.000Z");

      // คำนวณเวลาแจ้งเตือน (ลบ 30 นาที)
      const reminderTime = calculateUserReminderTime(checkInTimeUTC, 30);
      const reminderBangkok = convertUTCToBangkok(reminderTime);

      // ควรได้เวลาแจ้งเตือน = 17:30 น. (09:00 + 9 ชม. - 30 นาที)
      expect(reminderBangkok.getHours()).toBe(17);
      expect(reminderBangkok.getMinutes()).toBe(30);
    });

    test("should calculate correct reminder time for late check-in", () => {
      // เข้างานสาย 10:30 น. (Bangkok) = 03:30 น. (UTC)
      const checkInTimeUTC = new Date("2025-06-17T03:30:00.000Z");

      // คำนวณเวลาแจ้งเตือน (ลบ 30 นาที)
      const reminderTime = calculateUserReminderTime(checkInTimeUTC, 30);
      const reminderBangkok = convertUTCToBangkok(reminderTime);

      // ควรได้เวลาแจ้งเตือน = 19:00 น. (10:30 + 9 ชม. - 30 นาที)
      expect(reminderBangkok.getHours()).toBe(19);
      expect(reminderBangkok.getMinutes()).toBe(0);
    });

    test("should handle early morning check-in correctly", () => {
      // เข้างานเช้าตรู่ 07:00 น. (Bangkok) = 00:00 น. (UTC)
      const checkInTimeUTC = new Date("2025-06-17T00:00:00.000Z");

      // คำนวณเวลาแจ้งเตือน (ลบ 30 นาที)
      const reminderTime = calculateUserReminderTime(checkInTimeUTC, 30);
      const reminderBangkok = convertUTCToBangkok(reminderTime);

      // ควรได้เวลาแจ้งเตือน = 15:30 น. (07:00 + 9 ชม. - 30 นาที)
      expect(reminderBangkok.getHours()).toBe(15);
      expect(reminderBangkok.getMinutes()).toBe(30);
    });
  });

  describe("shouldReceiveReminderNow", () => {
    test("should return true when current time matches reminder time", () => {
      // เข้างาน 08:43, แจ้งเตือนที่ 17:13
      const checkInTimeUTC = new Date("2025-06-17T01:43:00.000Z");
      // เวลาปัจจุบัน 17:13 Bangkok time = 10:13 UTC
      const currentTimeBangkok = new Date("2025-06-17T10:13:00.000Z");

      const shouldRemind = shouldReceiveReminderNow(
        checkInTimeUTC,
        currentTimeBangkok,
        2,
        30,
      );

      expect(shouldRemind).toBe(true);
    });

    test("should return true when current time is within tolerance", () => {
      // เข้างาน 08:43, แจ้งเตือนที่ 17:13, เวลาปัจจุบัน 17:15 (ห่าง 2 นาที)
      const checkInTimeUTC = new Date("2025-06-17T01:43:00.000Z");
      // เวลาปัจจุบัน 17:15 Bangkok time = 10:15 UTC
      const currentTimeBangkok = new Date("2025-06-17T10:15:00.000Z");

      const shouldRemind = shouldReceiveReminderNow(
        checkInTimeUTC,
        currentTimeBangkok,
        2,
        30,
      );

      expect(shouldRemind).toBe(true);
    });

    test("should return false when current time is outside tolerance", () => {
      // เข้างาน 08:43, แจ้งเตือนที่ 17:13, เวลาปัจจุบัน 17:20 (ห่าง 7 นาที)
      const checkInTimeUTC = new Date("2025-06-17T01:43:00.000Z");
      // เวลาปัจจุบัน 17:20 Bangkok time
      const currentTimeBangkok = new Date(2025, 5, 17, 17, 20, 0);

      const shouldRemind = shouldReceiveReminderNow(
        checkInTimeUTC,
        currentTimeBangkok,
        5,
        30,
      );

      expect(shouldRemind).toBe(false);
    });

    test("should return false when current time is too early", () => {
      // เข้างาน 08:43, แจ้งเตือนที่ 17:13, เวลาปัจจุบัน 16:00
      const checkInTimeUTC = new Date("2025-06-17T01:43:00.000Z");
      // เวลาปัจจุบัน 16:00 Bangkok time
      const currentTimeBangkok = new Date(2025, 5, 17, 16, 0, 0);

      const shouldRemind = shouldReceiveReminderNow(
        checkInTimeUTC,
        currentTimeBangkok,
      );

      expect(shouldRemind).toBe(false);
    });
  });

  describe("Timezone Conversion Tests", () => {
    test("should correctly convert UTC to Bangkok time", () => {
      // 01:43 UTC = 08:43 Bangkok (UTC+7)
      const utcTime = new Date("2025-06-17T01:43:00.000Z");
      const bangkokTime = convertUTCToBangkok(utcTime);

      expect(bangkokTime.getHours()).toBe(8);
      expect(bangkokTime.getMinutes()).toBe(43);
    });

    test("should handle midnight UTC correctly", () => {
      // 00:00 UTC = 07:00 Bangkok
      const utcTime = new Date("2025-06-17T00:00:00.000Z");
      const bangkokTime = convertUTCToBangkok(utcTime);

      expect(bangkokTime.getHours()).toBe(7);
      expect(bangkokTime.getMinutes()).toBe(0);
    });

    test("should handle late evening UTC correctly", () => {
      // 17:00 UTC = 00:00 Bangkok (next day)
      const utcTime = new Date("2025-06-17T17:00:00.000Z");
      const bangkokTime = convertUTCToBangkok(utcTime);

      expect(bangkokTime.getHours()).toBe(0);
      expect(bangkokTime.getMinutes()).toBe(0);
      expect(bangkokTime.getDate()).toBe(18); // Next day
    });
  });

  describe("Real World Scenarios", () => {
    test("should handle the exact scenario from the bug report", () => {
      // เข้างาน 08:43 น. (Bangkok) ตามภาพที่ user ส่งมา
      const checkInTimeUTC = new Date("2025-06-17T01:43:00.000Z");

      // คำนวณเวลาแจ้งเตือน (ลบ 30 นาที)
      const reminderTime = calculateUserReminderTime(checkInTimeUTC, 30);
      const reminderBangkok = convertUTCToBangkok(reminderTime);

      // ตรวจสอบว่าแจ้งเตือนที่ 17:13 (ไม่ใช่ 16:13)
      expect(reminderBangkok.getUTCHours()).toBe(17);
      expect(reminderBangkok.getUTCMinutes()).toBe(13);

      // ตรวจสอบว่าเวลาปัจจุบัน 17:13 จะได้รับแจ้งเตือน
      const currentTime = new Date("2025-06-17T10:13:00.000Z"); // 17:13 Bangkok time = 10:13 UTC
      const shouldRemind = shouldReceiveReminderNow(
        checkInTimeUTC,
        currentTime,
        2,
        30,
      );

      expect(shouldRemind).toBe(true);
    });

    test("should calculate working hours correctly", () => {
      // เข้างาน 08:43, เลิกงาน 17:43 = 9 ชั่วโมง
      const checkInTimeUTC = new Date("2025-06-17T01:43:00.000Z"); // 08:43 Bangkok
      const checkOutTimeUTC = new Date("2025-06-17T10:43:00.000Z"); // 17:43 Bangkok

      const workingHours =
        (checkOutTimeUTC.getTime() - checkInTimeUTC.getTime()) /
        (1000 * 60 * 60);

      expect(workingHours).toBe(9);
    });

    test("should validate 8 working hours + 1 lunch break = 9 total hours", () => {
      // ตรวจสอบ business logic ที่ใช้ 9 ชั่วโมงรวมพักเที่ยง
      const checkInTimeUTC = new Date("2025-06-17T01:43:00.000Z"); // 08:43 Bangkok

      // หลังทำงาน 9 ชั่วโมง (รวมพัก 1 ชม.) = 17:43
      const expectedCheckOutTime = new Date(checkInTimeUTC);
      expectedCheckOutTime.setHours(expectedCheckOutTime.getHours() + 9);

      const bangkokCheckOut = convertUTCToBangkok(expectedCheckOutTime);

      expect(bangkokCheckOut.getHours()).toBe(17);
      expect(bangkokCheckOut.getMinutes()).toBe(43);
    });
  });

  describe("Edge Cases", () => {
    test("should handle day boundary crossing", () => {
      // เข้างานสาย 23:00 น.
      const lateCheckInUTC = new Date("2025-06-17T16:00:00.000Z"); // 23:00 Bangkok

      // คำนวณเวลาแจ้งเตือน (ลบ 30 นาที)
      const reminderTime = calculateUserReminderTime(lateCheckInUTC, 30);
      const reminderBangkok = convertUTCToBangkok(reminderTime);

      // แจ้งเตือนควรเป็นวันถัดไป 07:30 น.
      expect(reminderBangkok.getHours()).toBe(7);
      expect(reminderBangkok.getMinutes()).toBe(30);
      expect(reminderBangkok.getDate()).toBe(18); // Next day
    });

    test("should handle leap year and month boundaries", () => {
      // ทดสอบการข้ามเดือน
      const endOfMonthCheckIn = new Date("2025-06-30T16:00:00.000Z"); // 23:00 Bangkok

      const reminderTime = calculateUserReminderTime(endOfMonthCheckIn, 30);
      const reminderBangkok = convertUTCToBangkok(reminderTime);

      // แจ้งเตือนควลเป็นเดือนถัดไป
      expect(reminderBangkok.getMonth()).toBe(6); // July (0-indexed)
      expect(reminderBangkok.getDate()).toBe(1);
    });
  });
});

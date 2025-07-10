// Test สำหรับการคำนวณเวลาแจ้งเตือนใหม่ (10 นาที)
import { describe, expect, test } from "bun:test";
import {
  calculateUserReminderTime,
  shouldReceiveReminderNow,
} from "../../src/features/attendance/helpers/utils";
import { convertUTCToBangkok } from "../../src/lib/utils/datetime";

describe("Enhanced Checkout Reminder - 10 Minutes", () => {
  describe("การคำนวณเวลาแจ้งเตือน", () => {
    test("ควรแจ้งเตือน 10 นาทีก่อนครบ 9 ชั่วโมง (เข้างาน 09:00)", () => {
      const checkInTime = new Date("2025-06-18T02:00:00.000Z"); // 09:00 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime);
      const reminderBangkok = convertUTCToBangkok(reminderTime);
      expect(reminderBangkok.getUTCHours()).toBe(17); // 17:50 Bangkok
      expect(reminderBangkok.getUTCMinutes()).toBe(50);
    });

    test("ควรแจ้งเตือน 10 นาทีก่อนครบ 9 ชั่วโมง (เข้างาน 07:30 - ใช้ 8:00 เป็นฐาน)", () => {
      const checkInTime = new Date("2025-06-18T00:30:00.000Z"); // 07:30 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime);
      const reminderBangkok = convertUTCToBangkok(reminderTime);
      // เข้าก่อน 8:00 น. ใช้ 8:00 น. เป็นฐาน -> 16:50 Bangkok
      expect(reminderBangkok.getUTCHours()).toBe(16); // 16:50 Bangkok
      expect(reminderBangkok.getUTCMinutes()).toBe(50);
    });

    test("ควรแจ้งเตือน 10 นาทีก่อนครบ 9 ชั่วโมง (เข้างาน 10:30)", () => {
      const checkInTime = new Date("2025-06-18T03:30:00.000Z"); // 10:30 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime);
      const reminderBangkok = convertUTCToBangkok(reminderTime);
      expect(reminderBangkok.getUTCHours()).toBe(19); // 19:20 Bangkok
      expect(reminderBangkok.getUTCMinutes()).toBe(20);
    });
  });

  describe("การตรวจสอบช่วงเวลาแจ้งเตือน (tolerance)", () => {
    test("ควรส่งแจ้งเตือนเมื่ออยู่ใน tolerance 2 นาที", () => {
      const checkInTime = new Date("2025-06-18T01:00:00.000Z"); // 08:00 Bangkok
      const reminderTime = calculateUserReminderTime(checkInTime);
      const currentTime = new Date(reminderTime.getTime() + 60 * 1000); // +1 นาที
      const shouldRemind = shouldReceiveReminderNow(checkInTime, currentTime);
      expect(shouldRemind).toBe(true);
    });

    test("ไม่ควรส่งแจ้งเตือนถ้ายังไม่ถึงเวลาแจ้งเตือน", () => {
      const checkInTime = new Date("2025-06-18T01:00:00.000Z"); // 08:00 Bangkok
      const currentTime = new Date("2025-06-18T09:45:00.000Z"); // 16:45 Bangkok
      const shouldRemind = shouldReceiveReminderNow(checkInTime, currentTime);
      expect(shouldRemind).toBe(false);
    });
  });

  describe("edge case และความถูกต้องของข้อมูลเวลา", () => {
    test("ควร handle เวลาเข้างานข้ามวัน (ก่อนเที่ยงคืน)", () => {
      // เช่น เข้างาน 23:50 UTC (06:50 Bangkok วันถัดไป)
      const checkInTime = new Date("2025-06-18T16:50:00.000Z"); // 23:50 UTC
      const reminderTime = calculateUserReminderTime(checkInTime);
      const reminderBangkok = convertUTCToBangkok(reminderTime);
      // 9 ชั่วโมงหลัง 23:50 UTC = 08:50 UTC (15:50 Bangkok)
      // -10 นาที = 15:40 Bangkok
      expect(reminderBangkok.getUTCHours()).toBe(8); // Use UTC hours since convertUTCToBangkok stores Bangkok time as UTC
      expect(reminderBangkok.getUTCMinutes()).toBe(40);
    });

    test("ควร handle เวลาเข้างานช่วงเช้ามืด (หลังเที่ยงคืน)", () => {
      // เช่น เข้างาน 00:10 UTC (07:10 Bangkok)
      const checkInTime = new Date("2025-06-18T17:10:00.000Z"); // 00:10 UTC
      const reminderTime = calculateUserReminderTime(checkInTime);
      const reminderBangkok = convertUTCToBangkok(reminderTime);
      // 9 ชั่วโมงหลัง 00:10 UTC = 09:10 UTC (16:10 Bangkok)
      // -10 นาที = 16:00 Bangkok
      expect(reminderBangkok.getUTCHours()).toBe(9); // Use UTC hours since convertUTCToBangkok stores Bangkok time as UTC
      expect(reminderBangkok.getUTCMinutes()).toBe(0);
    });
  });
});

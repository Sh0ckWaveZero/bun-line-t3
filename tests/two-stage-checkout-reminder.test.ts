// Test สำหรับระบบแจ้งเตือน 2 ครั้งต่อคน
import { describe, test, expect } from "bun:test";
import {
  calculateUserCompletionTime,
  calculateUserReminderTime,
  shouldReceive10MinReminder,
  shouldReceiveFinalReminder,
} from "../src/features/attendance/helpers";
import { convertUTCToBangkok } from "../src/lib/utils/datetime";

describe("Two-Stage Checkout Reminder System", () => {
  test("should calculate both 10min and final reminder times correctly", () => {
    // กรณีทดสอบ: เข้างาน 09:00
    const checkInTime = new Date("2025-06-18T02:00:00.000Z"); // 09:00 Bangkok time

    const reminderTime = calculateUserReminderTime(checkInTime); // 17:50
    const completionTime = calculateUserCompletionTime(checkInTime); // 18:00
    const reminderBangkok = convertUTCToBangkok(reminderTime);
    const completionBangkok = convertUTCToBangkok(completionTime);

    expect(reminderBangkok.getHours()).toBe(17); // 17:50 Bangkok
    expect(reminderBangkok.getMinutes()).toBe(50);

    expect(completionBangkok.getHours()).toBe(18); // 18:00 Bangkok
    expect(completionBangkok.getMinutes()).toBe(0);

    // ความต่างควรเป็น 10 นาที
    const diffMinutes =
      (completionTime.getTime() - reminderTime.getTime()) / (1000 * 60);
    expect(diffMinutes).toBe(10);
  });

  test("should trigger 10min reminder at correct time", () => {
    // เข้างาน 08:00 Bangkok (01:00 UTC), reminder ที่ 09:50 UTC (18:50 Bangkok)
    const checkInTime = new Date("2025-06-18T01:00:00.000Z"); // 08:00 Bangkok
    const currentTime = new Date("2025-06-18T09:50:00.000Z"); // 18:50 Bangkok

    const should10Min = shouldReceive10MinReminder(checkInTime, currentTime);
    const shouldFinal = shouldReceiveFinalReminder(checkInTime, currentTime);

    expect(should10Min).toBe(true);
    expect(shouldFinal).toBe(false);
  });

  test("should trigger final reminder at completion time", () => {
    // เข้างาน 08:00 Bangkok (01:00 UTC), completion ที่ 10:00 UTC (19:00 Bangkok)
    const checkInTime = new Date("2025-06-18T01:00:00.000Z"); // 08:00 Bangkok
    const currentTime = new Date("2025-06-18T10:00:00.000Z"); // 19:00 Bangkok

    const should10Min = shouldReceive10MinReminder(checkInTime, currentTime);
    const shouldFinal = shouldReceiveFinalReminder(checkInTime, currentTime);

    expect(should10Min).toBe(false); // ผ่านเวลาแล้ว
    expect(shouldFinal).toBe(true);
  });

  test("should not trigger any reminder outside time windows", () => {
    // เข้างาน 08:00, ตรวจสอบที่ 16:30 (ยังไม่ถึงเวลา)
    const checkInTime = new Date("2025-06-18T01:00:00.000Z"); // 08:00 Bangkok
    const currentTime = new Date("2025-06-18T09:30:00.000Z"); // 16:30 Bangkok

    const should10Min = shouldReceive10MinReminder(checkInTime, currentTime);
    const shouldFinal = shouldReceiveFinalReminder(checkInTime, currentTime);

    expect(should10Min).toBe(false);
    expect(shouldFinal).toBe(false);
  });

  test("should handle late check-in users correctly", () => {
    // เข้างาน 10:30, ควรแจ้งเตือนที่ 19:20 และ 19:30
    const checkInTime = new Date("2025-06-18T03:30:00.000Z"); // 10:30 Bangkok

    const reminderTime = calculateUserReminderTime(checkInTime);
    const completionTime = calculateUserCompletionTime(checkInTime);
    const reminderBangkok = convertUTCToBangkok(reminderTime);
    const completionBangkok = convertUTCToBangkok(completionTime);

    expect(reminderBangkok.getHours()).toBe(19); // 19:20 Bangkok
    expect(reminderBangkok.getMinutes()).toBe(20);

    expect(completionBangkok.getHours()).toBe(19); // 19:30 Bangkok
    expect(completionBangkok.getMinutes()).toBe(30);
  });

  test("should work with 2-minute tolerance window", () => {
    // ทดสอบ tolerance 2 นาที (ค่า default)
    const checkInTime = new Date("2025-06-18T01:00:00.000Z"); // 08:00 Bangkok

    // ทดสอบขอบเขต tolerance สำหรับ 10min reminder (09:48-09:52 UTC = 18:48-18:52 Bangkok)
    const earlyTime = new Date("2025-06-18T09:48:00.000Z"); // 18:48 Bangkok
    const onTime = new Date("2025-06-18T09:50:00.000Z"); // 18:50 Bangkok
    const lateTime = new Date("2025-06-18T09:52:00.000Z"); // 18:52 Bangkok
    const tooLate = new Date("2025-06-18T09:54:00.000Z"); // 18:54 Bangkok

    expect(shouldReceive10MinReminder(checkInTime, earlyTime)).toBe(true);
    expect(shouldReceive10MinReminder(checkInTime, onTime)).toBe(true);
    expect(shouldReceive10MinReminder(checkInTime, lateTime)).toBe(true);
    expect(shouldReceive10MinReminder(checkInTime, tooLate)).toBe(false);
  });
});

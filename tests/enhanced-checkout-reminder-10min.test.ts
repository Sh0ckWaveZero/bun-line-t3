// Test สำหรับการคำนวณเวลาแจ้งเตือนใหม่ (10 นาที)
import {
  calculateUserReminderTime,
  shouldReceiveReminderNow,
} from "@/features/attendance/helpers/utils";

describe("Enhanced Checkout Reminder - 10 Minutes", () => {
  test("should calculate reminder time 10 minutes before 9-hour completion", () => {
    // กรณีทดสอบ: เข้างาน 09:00
    const checkInTime = new Date("2025-06-18T02:00:00.000Z"); // 09:00 Bangkok time
    const reminderTime = calculateUserReminderTime(checkInTime);

    // ควรได้เวลาแจ้งเตือน 17:50 (9 ชั่วโมงหลังจาก 09:00 - 10 นาที)
    const expectedHour = 17;
    const expectedMinute = 50;

    expect(reminderTime.getHours()).toBe(expectedHour);
    expect(reminderTime.getMinutes()).toBe(expectedMinute);
  });

  test("should calculate reminder time for early check-in", () => {
    // กรณีทดสอบ: เข้างาน 07:30
    const checkInTime = new Date("2025-06-18T00:30:00.000Z"); // 07:30 Bangkok time
    const reminderTime = calculateUserReminderTime(checkInTime);

    // ควรได้เวลาแจ้งเตือน 16:20 (9 ชั่วโมงหลังจาก 07:30 - 10 นาที)
    const expectedHour = 16;
    const expectedMinute = 20;

    expect(reminderTime.getHours()).toBe(expectedHour);
    expect(reminderTime.getMinutes()).toBe(expectedMinute);
  });

  test("should determine if user needs reminder now with 2-minute tolerance", () => {
    // กรณีทดสอบ: เข้างาน 08:00, เวลาปัจจุบัน 16:50 (ควรส่งแจ้งเตือน)
    const checkInTime = new Date("2025-06-18T01:00:00.000Z"); // 08:00 Bangkok time
    const reminderTime = calculateUserReminderTime(checkInTime); // คำนวณเวลาแจ้งเตือนจริง

    // สร้างเวลาปัจจุบันที่ใกล้เคียงกับเวลาแจ้งเตือน (ในช่วง tolerance 2 นาที)
    const currentTime = new Date(reminderTime.getTime() + 60 * 1000); // +1 นาทีจากเวลาแจ้งเตือน

    const shouldRemind = shouldReceiveReminderNow(checkInTime, currentTime);
    expect(shouldRemind).toBe(true);
  });

  test("should not send reminder too early", () => {
    // กรณีทดสอบ: เข้างาน 08:00, เวลาปัจจุบัน 16:45 (ยังไม่ถึงเวลา)
    const checkInTime = new Date("2025-06-18T01:00:00.000Z"); // 08:00 Bangkok time
    const currentTime = new Date("2025-06-18T09:45:00.000Z"); // 16:45 Bangkok time

    const shouldRemind = shouldReceiveReminderNow(checkInTime, currentTime);
    expect(shouldRemind).toBe(false);
  });

  test("should handle late check-in users", () => {
    // กรณีทดสอบ: เข้างาน 10:30, ควรแจ้งเตือนที่ 19:20
    const checkInTime = new Date("2025-06-18T03:30:00.000Z"); // 10:30 Bangkok time
    const reminderTime = calculateUserReminderTime(checkInTime);

    expect(reminderTime.getHours()).toBe(19);
    expect(reminderTime.getMinutes()).toBe(20);
  });
});

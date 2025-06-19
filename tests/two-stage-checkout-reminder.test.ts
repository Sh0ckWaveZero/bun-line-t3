// Test สำหรับระบบแจ้งเตือน 2 ครั้งต่อคน
import { 
  shouldReceive10MinReminder, 
  shouldReceiveFinalReminder,
  calculateUserReminderTime,
  calculateUserCompletionTime 
} from '@/features/attendance/helpers/utils';

describe('Two-Stage Checkout Reminder System', () => {
  test('should calculate both 10min and final reminder times correctly', () => {
    // กรณีทดสอบ: เข้างาน 09:00
    const checkInTime = new Date('2025-06-18T02:00:00.000Z'); // 09:00 Bangkok time
    
    const reminderTime = calculateUserReminderTime(checkInTime); // 17:50
    const completionTime = calculateUserCompletionTime(checkInTime); // 18:00
    
    expect(reminderTime.getHours()).toBe(17);
    expect(reminderTime.getMinutes()).toBe(50);
    
    expect(completionTime.getHours()).toBe(18);
    expect(completionTime.getMinutes()).toBe(0);
    
    // ความต่างควรเป็น 10 นาที
    const diffMinutes = (completionTime.getTime() - reminderTime.getTime()) / (1000 * 60);
    expect(diffMinutes).toBe(10);
  });

  test('should trigger 10min reminder at correct time', () => {
    // เข้างาน 08:00, ตรวจสอบที่ 16:50 (10 นาทีก่อนครบ 9 ชั่วโมง)
    const checkInTime = new Date('2025-06-18T01:00:00.000Z'); // 08:00 Bangkok
    const currentTime = new Date('2025-06-18T09:50:00.000Z'); // 16:50 Bangkok
    
    const should10Min = shouldReceive10MinReminder(checkInTime, currentTime);
    const shouldFinal = shouldReceiveFinalReminder(checkInTime, currentTime);
    
    expect(should10Min).toBe(true);
    expect(shouldFinal).toBe(false);
  });

  test('should trigger final reminder at completion time', () => {
    // เข้างาน 08:00, ตรวจสอบที่ 17:00 (ครบ 9 ชั่วโมงพอดี)
    const checkInTime = new Date('2025-06-18T01:00:00.000Z'); // 08:00 Bangkok
    const currentTime = new Date('2025-06-18T10:00:00.000Z'); // 17:00 Bangkok
    
    const should10Min = shouldReceive10MinReminder(checkInTime, currentTime);
    const shouldFinal = shouldReceiveFinalReminder(checkInTime, currentTime);
    
    expect(should10Min).toBe(false); // ผ่านเวลาแล้ว
    expect(shouldFinal).toBe(true);
  });

  test('should not trigger any reminder outside time windows', () => {
    // เข้างาน 08:00, ตรวจสอบที่ 16:30 (ยังไม่ถึงเวลา)
    const checkInTime = new Date('2025-06-18T01:00:00.000Z'); // 08:00 Bangkok
    const currentTime = new Date('2025-06-18T09:30:00.000Z'); // 16:30 Bangkok
    
    const should10Min = shouldReceive10MinReminder(checkInTime, currentTime);
    const shouldFinal = shouldReceiveFinalReminder(checkInTime, currentTime);
    
    expect(should10Min).toBe(false);
    expect(shouldFinal).toBe(false);
  });

  test('should handle late check-in users correctly', () => {
    // เข้างาน 10:30, ควรแจ้งเตือนที่ 19:20 และ 19:30
    const checkInTime = new Date('2025-06-18T03:30:00.000Z'); // 10:30 Bangkok
    
    const reminderTime = calculateUserReminderTime(checkInTime);
    const completionTime = calculateUserCompletionTime(checkInTime);
    
    expect(reminderTime.getHours()).toBe(19);
    expect(reminderTime.getMinutes()).toBe(20);
    
    expect(completionTime.getHours()).toBe(19);
    expect(completionTime.getMinutes()).toBe(30);
  });

  test('should work with 2-minute tolerance window', () => {
    // ทดสอบ tolerance 2 นาที (ค่า default)
    const checkInTime = new Date('2025-06-18T01:00:00.000Z'); // 08:00 Bangkok
    
    // ทดสอบขอบเขต tolerance สำหรับ 10min reminder (16:48-16:52)
    const earlyTime = new Date('2025-06-18T09:48:00.000Z'); // 16:48
    const onTime = new Date('2025-06-18T09:50:00.000Z'); // 16:50
    const lateTime = new Date('2025-06-18T09:52:00.000Z'); // 16:52
    const tooLate = new Date('2025-06-18T09:54:00.000Z'); // 16:54
    
    expect(shouldReceive10MinReminder(checkInTime, earlyTime)).toBe(true);
    expect(shouldReceive10MinReminder(checkInTime, onTime)).toBe(true);
    expect(shouldReceive10MinReminder(checkInTime, lateTime)).toBe(true);
    expect(shouldReceive10MinReminder(checkInTime, tooLate)).toBe(false);
  });
});

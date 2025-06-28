import { describe, it, expect } from "bun:test";
import { combineOriginalDateWithNewTime } from "../../src/lib/utils/date-time";

describe("Date Bug Fix - Checkout Time", () => {
  it("should use checkInTime as base date for both checkIn and checkOut", () => {
    // Arrange: มีข้อมูลที่ checkOut อยู่วันถัดไป (midnight shift scenario)
    const editingRecord = {
      id: "test-id",
      checkInTime: "2025-06-06T08:00:00.000Z", // วันที่ 6
      checkOutTime: "2025-06-07T17:00:00.000Z", // วันที่ 7 (วันถัดไป)
    };

    const editData = {
      checkInTime: "09:00", // เปลี่ยนเวลาเข้า
      checkOutTime: "18:00", // เปลี่ยนเวลาออก
    };

    // Act: เรียกใช้ logic การอัปเดต (ส่วนที่เราแก้ไข)
    const newCheckInDateTime = combineOriginalDateWithNewTime(
      new Date(editingRecord.checkInTime),
      editData.checkInTime,
    );

    const newCheckOutDateTime = combineOriginalDateWithNewTime(
      new Date(editingRecord.checkInTime), // ใช้ checkInTime แทน checkOutTime
      editData.checkOutTime,
    );

    // Assert: ตรวจสอบว่าผลลัพธ์ถูกต้อง
    expect(newCheckInDateTime).not.toBeNull();
    expect(newCheckOutDateTime).not.toBeNull();

    // ผลลัพธ์: ทั้งคู่ควรอยู่วันเดียวกัน (6 มิถุนายน)
    expect(newCheckInDateTime!.toISOString()).toMatch(/^2025-06-06T09:00/);
    expect(newCheckOutDateTime!.toISOString()).toMatch(/^2025-06-06T18:00/);

    // ตรวจสอบว่าทั้งคู่อยู่วันเดียวกัน
    expect(newCheckInDateTime!.getDate()).toBe(6);
    expect(newCheckOutDateTime!.getDate()).toBe(6);
  });

  it("should handle normal same-day scenario correctly", () => {
    // Arrange: ข้อมูลปกติที่อยู่วันเดียวกัน
    const editingRecord = {
      id: "test-id",
      checkInTime: "2025-06-06T08:00:00.000Z", // วันที่ 6
      checkOutTime: "2025-06-06T17:00:00.000Z", // วันที่ 6 (วันเดียวกัน)
    };

    const editData = {
      checkInTime: "08:30",
      checkOutTime: "17:30",
    };

    // Act
    const newCheckInDateTime = combineOriginalDateWithNewTime(
      new Date(editingRecord.checkInTime),
      editData.checkInTime,
    );

    const newCheckOutDateTime = combineOriginalDateWithNewTime(
      new Date(editingRecord.checkInTime), // ยังคงใช้ checkInTime เป็น base
      editData.checkOutTime,
    );

    // Assert: ทั้งคู่ยังคงอยู่วันเดียวกัน
    expect(newCheckInDateTime).not.toBeNull();
    expect(newCheckOutDateTime).not.toBeNull();
    expect(newCheckInDateTime!.toISOString()).toMatch(/^2025-06-06T08:30/);
    expect(newCheckOutDateTime!.toISOString()).toMatch(/^2025-06-06T17:30/);
  });
});

import { describe, test, expect } from "bun:test";

/**
 * 🔧 Timezone Conversion Test Script
 * ทดสอบการแปลงเวลาระหว่าง Bangkok Time และ UTC
 */

// ฟังก์ชันแปลง UTC เป็น Bangkok time สำหรับการแสดงผล (เหมือนใน openEditModal)
function formatForInput(utcDateString) {
  const utcDate = new Date(utcDateString);

  // แปลงเป็น Bangkok timezone สำหรับการแสดงผล
  const bangkokTime = new Date(
    utcDate.toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    }),
  );

  const year = bangkokTime.getFullYear();
  const month = (bangkokTime.getMonth() + 1).toString().padStart(2, "0");
  const day = bangkokTime.getDate().toString().padStart(2, "0");
  const hours = bangkokTime.getHours().toString().padStart(2, "0");
  const minutes = bangkokTime.getMinutes().toString().padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ฟังก์ชันแปลง Bangkok time input เป็น ISO string พร้อม timezone (เหมือนใน updateAttendance)
function convertToISOWithTimezone(bangkokTimeString) {
  if (!bangkokTimeString) return null;

  // เพิ่ม timezone offset ของ Bangkok (+07:00) ใน datetime string
  return `${bangkokTimeString}:00+07:00`;
}

describe("ทดสอบการแปลงเวลา UTC <-> Bangkok Time", () => {
  test("Case 1: เวลาเช้า (9:00 AM Bangkok = 2:00 AM UTC)", () => {
    const utcMorning = "2025-06-11T02:00:00.000Z";
    const bangkokMorning = formatForInput(utcMorning);
    const backToISO = convertToISOWithTimezone(bangkokMorning);
    expect(backToISO).not.toBeNull(); // ตรวจสอบว่าค่าไม่เป็น null
    const finalUTC = new Date(backToISO ?? "").toISOString();
    expect(finalUTC).toBe(utcMorning);
  });

  test("Case 2: เวลาเย็น (6:00 PM Bangkok = 11:00 AM UTC)", () => {
    const utcEvening = "2025-06-11T11:00:00.000Z";
    const bangkokEvening = formatForInput(utcEvening);
    const backToISOEvening = convertToISOWithTimezone(bangkokEvening);
    expect(backToISOEvening).not.toBeNull(); // ตรวจสอบว่าค่าไม่เป็น null
    const finalUTCEvening = new Date(backToISOEvening ?? "").toISOString();
    expect(finalUTCEvening).toBe(utcEvening);
  });

  test("Case 3: เวลาปัจจุบัน (ควรแปลงกลับได้ใกล้เคียงเดิม)", () => {
    const now = new Date();
    const nowUTC = now.toISOString();
    const nowBangkok = formatForInput(nowUTC);
    const nowBackToISO = convertToISOWithTimezone(nowBangkok);
    expect(nowBackToISO).not.toBeNull(); // ตรวจสอบว่าค่าไม่เป็น null
    const nowFinalUTC = new Date(nowBackToISO ?? "").toISOString();
    // ความต่างเวลาควรน้อยกว่า 60 วินาที (1 นาที)
    const timeDiff = Math.abs(
      new Date(nowUTC).getTime() - new Date(nowFinalUTC).getTime(),
    );
    expect(timeDiff).toBeLessThan(60000);
  });
});

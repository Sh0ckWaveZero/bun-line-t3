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

// ทดสอบการแปลงเวลา
console.log("🔧 Testing Timezone Conversion");
console.log("================================");

// Case 1: เวลาเข้างานตอนเช้า (9:00 AM Bangkok = 2:00 AM UTC)
const utcMorning = "2025-06-11T02:00:00.000Z";
console.log("\n📅 Case 1: เวลาเช้า");
console.log("UTC Time (from DB):", utcMorning);

const bangkokMorning = formatForInput(utcMorning);
console.log("Bangkok Time (for input):", bangkokMorning);

const backToISO = convertToISOWithTimezone(bangkokMorning);
console.log("ISO with timezone (to API):", backToISO);

const finalUTC = new Date(backToISO).toISOString();
console.log("Final UTC (in DB):", finalUTC);
console.log("Match original?", utcMorning === finalUTC);

// Case 2: เวลาออกงานตอนเย็น (6:00 PM Bangkok = 11:00 AM UTC)
const utcEvening = "2025-06-11T11:00:00.000Z";
console.log("\n📅 Case 2: เวลาเย็น");
console.log("UTC Time (from DB):", utcEvening);

const bangkokEvening = formatForInput(utcEvening);
console.log("Bangkok Time (for input):", bangkokEvening);

const backToISOEvening = convertToISOWithTimezone(bangkokEvening);
console.log("ISO with timezone (to API):", backToISOEvening);

const finalUTCEvening = new Date(backToISOEvening).toISOString();
console.log("Final UTC (in DB):", finalUTCEvening);
console.log("Match original?", utcEvening === finalUTCEvening);

// Case 3: ทดสอบกับเวลาปัจจุบัน
console.log("\n📅 Case 3: เวลาปัจจุบัน");
const now = new Date();
const nowUTC = now.toISOString();
console.log("Current UTC:", nowUTC);

const nowBangkok = formatForInput(nowUTC);
console.log("Bangkok Time (for input):", nowBangkok);

const nowBackToISO = convertToISOWithTimezone(nowBangkok);
console.log("Back to ISO:", nowBackToISO);

const nowFinalUTC = new Date(nowBackToISO).toISOString();
console.log("Final UTC:", nowFinalUTC);

// คำนวณความต่างเวลา (ควรเป็น 0 หรือใกล้เคียง)
const timeDiff = Math.abs(
  new Date(nowUTC).getTime() - new Date(nowFinalUTC).getTime(),
);
console.log("Time difference (ms):", timeDiff);
console.log("Time difference (seconds):", timeDiff / 1000);

console.log("\n✅ Test completed!");
console.log("กรุณาตรวจสอบว่าเวลาแปลงถูกต้องและ Final UTC ตรงกับ Original UTC");

#!/usr/bin/env bun

/**
 * สคริปต์ทดสอบเวลาและแจ้งเตือน
 * ใช้สำหรับตรวจสอบว่า timezone และเวลาทำงานถูกต้อง
 */

console.log('🕐 การตรวจสอบเวลาสำหรับ Cron Job')
console.log('='.repeat(50))

// เวลาปัจจุบันใน timezone ต่างๆ
const currentTime = new Date()

// UTC
console.log(`UTC:           ${currentTime.toISOString()}`)

// Asia/Bangkok
console.log(`Asia/Bangkok:  ${currentTime.toLocaleString('th-TH', { 
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})}`)

// America/New_York (เพื่อเปรียบเทียบ)
console.log(`New York:      ${currentTime.toLocaleString('en-US', { 
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})}`)

console.log('\n📅 การตั้งค่า Cron Job')
console.log('='.repeat(50))

const cronExpressions = [
  { time: '30 17 * * 1-5', desc: 'แจ้งเตือนออกงาน (17:30 วันจันทร์-ศุกร์)' },
  { time: '0 9 * * 1', desc: 'รายงานสัปดาหิก (09:00 วันจันทร์)' },
  { time: '30 0 * * *', desc: 'สำรองข้อมูลรายวัน (00:30 ทุกวัน)' }
]

cronExpressions.forEach(({ time, desc }) => {
  console.log(`${time.padEnd(15)} → ${desc}`)
})

console.log('\n🚨 เวลาที่ไม่เหมาะสม')
console.log('='.repeat(50))

const badTimes = [
  { time: '30 23 * * 1-5', desc: 'แจ้งเตือนออกงาน (23:30) - ดึกเกินไป!' },
  { time: '0 5 * * *', desc: 'แจ้งเตือนทั่วไป (05:00) - เช้าเกินไป!' },
  { time: '0 22 * * *', desc: 'ส่งรายงาน (22:00) - ค่ำเกินไป!' }
]

badTimes.forEach(({ time, desc }) => {
  console.log(`❌ ${time.padEnd(15)} → ${desc}`)
})

console.log('\n✅ เวลาที่เหมาะสม')
console.log('='.repeat(50))

const goodTimes = [
  { time: '30 17 * * 1-5', desc: 'แจ้งเตือนออกงาน (17:30) - ก่อนเลิกงาน' },
  { time: '0 9 * * 1', desc: 'ส่งรายงาน (09:00) - เริ่มต้นสัปดาห์' },
  { time: '0 12 * * *', desc: 'ตรวจสอบระบบ (12:00) - พักเที่ยง' }
]

goodTimes.forEach(({ time, desc }) => {
  console.log(`✅ ${time.padEnd(15)} → ${desc}`)
})

console.log('\n⏰ การคำนวณเวลาครั้งต่อไป')
console.log('='.repeat(50))

// คำนวณว่า cron job 17:30 จะทำงานครั้งต่อไปเมื่อไหร่
const calculateNextRun = (hour: number, minute: number) => {
  const bangkokNow = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const today = new Date(bangkokNow)
  today.setHours(hour, minute, 0, 0)
  
  // ถ้าเวลาผ่านไปแล้ววันนี้ ให้ใช้วันถัดไป
  if (today <= bangkokNow) {
    today.setDate(today.getDate() + 1)
  }
  
  // หาวันจันทร์-ศุกร์ถัดไป
  while (today.getDay() === 0 || today.getDay() === 6) { // 0=อาทิตย์, 6=เสาร์
    today.setDate(today.getDate() + 1)
  }
  
  return today
}

const nextCheckoutReminder = calculateNextRun(17, 30)
console.log(`Checkout reminder ครั้งต่อไป: ${nextCheckoutReminder.toLocaleString('th-TH', { 
  timeZone: 'Asia/Bangkok',
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}`)

console.log('\n📝 หมายเหตุ')
console.log('='.repeat(50))
console.log('- เวลาทั้งหมดแสดงตาม timezone Asia/Bangkok')
console.log('- Cron job จะทำงานตามเวลาที่ตั้งไว้ใน container')
console.log('- ควรทดสอบหลังจากแก้ไขเวลา')
console.log('- ตรวจสอบ logs เพื่อยืนยันการทำงาน')

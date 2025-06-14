#!/usr/bin/env bun

/**
 * สคริปต์ทดสอบการลงชื่อออกงานอัตโนมัติ
 * ใช้สำหรับทดสอบ API endpoint ก่อนนำไปใช้งานจริง
 */

import { env } from '../src/env.mjs';

const API_URL = `${env.FRONTEND_URL}/api/cron/auto-checkout`;

const currentTime = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
console.log(`[${currentTime}] ทดสอบระบบลงชื่อออกงานอัตโนมัติ...`);

// ตรวจสอบว่ามี INTERNAL_API_KEY หรือไม่
if (!env.INTERNAL_API_KEY) {
  console.error('❌ Error: INTERNAL_API_KEY is not set in environment variables');
  console.log('Please set INTERNAL_API_KEY in your .env file.');
  process.exit(1);
}

try {
  console.log(`📞 เรียก API endpoint: ${API_URL}`);
  console.log(`🔑 ใช้ API Key: ${env.INTERNAL_API_KEY.substring(0, 8)}...`);
  
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.INTERNAL_API_KEY
    }
  });

  const result = await response.json();
  
  if (response.ok) {
    console.log(`✅ Success: ${result.message}`);
    
    if (result.summary) {
      console.log('\n📊 สรุปผลการดำเนินการ:');
      console.log(`   - ประมวลผลทั้งหมด: ${result.summary.processed} คน`);
      console.log(`   - สำเร็จ: ${result.summary.successful} คน`);
      console.log(`   - ล้มเหลว: ${result.summary.failed} คน`);
      console.log(`   - ข้าม: ${result.summary.skipped} คน`);
    }
    
    if (result.results && result.results.length > 0) {
      console.log('\n📋 รายละเอียดผลการดำเนินการ:');
      
      result.results.forEach((item: any, index: number) => {
        console.log(`\n${index + 1}. User ID: ${item.userId}`);
        console.log(`   Status: ${item.status}`);
        
        if (item.status === 'success') {
          console.log(`   ⏰ เข้างาน: ${new Date(item.checkInTime).toLocaleString('th-TH')}`);
          console.log(`   🕛 ออกงานอัตโนมัติ: ${new Date(item.autoCheckoutTime).toLocaleString('th-TH')}`);
          console.log(`   📊 ชั่วโมงทำงาน: ${item.workingHours} ชั่วโมง`);
        } else if (item.status === 'failed') {
          console.log(`   ❌ ข้อผิดพลาด: ${item.error}`);
        } else if (item.status === 'skipped') {
          console.log(`   ⏭️ เหตุผล: ${item.reason}`);
        }
      });
    }
    
  } else {
    console.error(`❌ Error: HTTP ${response.status}`);
    console.error('Response:', result);
  }
  
} catch (error: any) {
  console.error('❌ Network Error:', error.message);
  console.error('กรุณาตรวจสอบ:');
  console.error('  1. เซิร์ฟเวอร์ทำงานอยู่หรือไม่');
  console.error('  2. URL และ API key ถูกต้องหรือไม่');
  console.error('  3. การเชื่อมต่อเครือข่าย');
}

console.log('\n🏁 การทดสอบเสร็จสิ้น');
console.log(`⏰ เวลาเสร็จสิ้น: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);

// คำแนะนำการใช้งาน
console.log('\n💡 คำแนะนำ:');
console.log('  - ระบบจะทำงานอัตโนมัติตอนเที่ยงคืน (00:00) ทุกวัน');
console.log('  - สำหรับพนักงานที่ลืมลงชื่อออกงาน');
console.log('  - ตรวจสอบ logs ใน production เพื่อติดตามการทำงาน');
console.log('  - หากมีปัญหา สามารถแก้ไข attendance record ผ่าน admin panel');

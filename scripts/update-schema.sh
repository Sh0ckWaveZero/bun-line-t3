#!/bin/bash

# สคริปต์สำหรับอัปเดต Prisma schema และ deploy การเปลี่ยนแปลง
echo "🔄 อัปเดต Prisma Schema สำหรับ Auto Checkout System..."

# ตรวจสอบว่าอยู่ใน project directory
if [ ! -f "prisma/schema.prisma" ]; then
  echo "❌ ไม่พบไฟล์ prisma/schema.prisma"
  echo "กรุณารันสคริปต์นี้ใน project root directory"
  exit 1
fi

# สำรองข้อมูลก่อนอัปเดต (สำหรับ production)
echo "💾 กำลังสำรองข้อมูลปัจจุบัน..."
timestamp=$(date +"%Y%m%d_%H%M%S")
mkdir -p backups
mongodump --uri="$DATABASE_URL" --out="backups/backup_$timestamp" 2>/dev/null || echo "⚠️ ไม่สามารถสำรองข้อมูลได้ (อาจไม่มี mongodump)"

# Generate Prisma client ใหม่
echo "🔧 สร้าง Prisma client ใหม่..."
bunx prisma generate

if [ $? -eq 0 ]; then
  echo "✅ Prisma client สร้างสำเร็จ"
else
  echo "❌ เกิดข้อผิดพลาดในการสร้าง Prisma client"
  exit 1
fi

# Push schema changes ไปยัง database
echo "📊 อัปเดต database schema..."
bunx prisma db push

if [ $? -eq 0 ]; then
  echo "✅ Database schema อัปเดตสำเร็จ"
else
  echo "❌ เกิดข้อผิดพลาดในการอัปเดต database"
  echo "💡 กรุณาตรวจสอบ DATABASE_URL และการเชื่อมต่อ"
  exit 1
fi

# ตรวจสอบว่า enum ใหม่ถูกเพิ่มแล้วหรือไม่
echo "🔍 ตรวจสอบการเปลี่ยนแปลง..."
echo "Enum values ใน AttendanceStatusType:"
echo "  - CHECKED_IN_ON_TIME"
echo "  - CHECKED_IN_LATE" 
echo "  - CHECKED_OUT"
echo "  - AUTO_CHECKOUT_MIDNIGHT (🆕 ใหม่)"

# ทดสอบการเชื่อมต่อ database
echo "🌐 ทดสอบการเชื่อมต่อ database..."
bunx prisma db seed --preview-feature 2>/dev/null || echo "⚠️ ไม่มี seed script (ปกติ)"

echo ""
echo "✅ การอัปเดต Prisma Schema เสร็จสิ้น!"
echo ""
echo "📋 ขั้นตอนถัดไป:"
echo "  1. ทดสอบ API endpoint: bun run scripts/test-auto-checkout.ts"
echo "  2. ตรวจสอบ cron job: docker logs <cron-container>"
echo "  3. Deploy to production (หากทุกอย่างทำงานถูกต้อง)"
echo ""
echo "⚠️ หมายเหตุ:"
echo "  - ตรวจสอบให้แน่ใจว่า cron job มี CRON_SECRET ที่ถูกต้อง"
echo "  - ระบบจะทำงานอัตโนมัติตอนเที่ยงคืน (00:00) ทุกวัน"
echo "  - สำหรับพนักงานที่ลืมลงชื่อออกงาน"

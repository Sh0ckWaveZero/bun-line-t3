#!/bin/bash

# สคริปต์สำหรับตรวจสอบ LINE OAuth URL ที่ถูกสร้างขึ้น
echo "🔍 เริ่มตรวจสอบ LINE OAuth URL..."

# ตรวจสอบว่า curl และ jq ติดตั้งแล้วหรือไม่
if ! command -v curl &> /dev/null || ! command -v jq &> /dev/null; then
  echo "❌ จำเป็นต้องติดตั้ง curl และ jq ก่อนใช้สคริปต์นี้"
  exit 1
fi

# เช็คว่าเซิร์ฟเวอร์กำลังทำงานอยู่
if ! curl -s http://localhost:4325 > /dev/null; then
  echo "❌ เซิร์ฟเวอร์ไม่ได้ทำงานอยู่ กรุณาเริ่มเซิร์ฟเวอร์ก่อน"
  exit 1
fi

# รับข้อมูลจาก debug endpoint
echo "📊 กำลังตรวจสอบการตั้งค่า..."
CONFIG=$(curl -s http://localhost:4325/api/debug/line-oauth)

# แสดงข้อมูลสำคัญ
echo "🌐 NEXTAUTH_URL: $(echo $CONFIG | jq -r '.nextAuthUrl')"
echo "🔗 Calculated Callback URL: $(echo $CONFIG | jq -r '.calculatedCallbackUrl')"
echo "📝 LINE OAuth URL ที่สร้าง:"
echo $(echo $CONFIG | jq -r '.oauthUrl')

# ตรวจสอบว่า URL มี localhost หรือไม่
if echo "$CONFIG" | jq -r '.oauthUrl' | grep -q "localhost"; then
  echo "❌ พบ 'localhost' ใน LINE OAuth URL โปรดตรวจสอบการตั้งค่า"
  exit 1
else
  echo "✅ ไม่พบ 'localhost' ใน LINE OAuth URL"
fi

# ตรวจสอบว่า redirect_uri ถูกต้องหรือไม่
REDIRECT_URI=$(echo $CONFIG | jq -r '.oauthUrl' | grep -o 'redirect_uri=[^&]*' | cut -d= -f2)
DECODED_URI=$(printf '%b' "${REDIRECT_URI//%/\\x}")

if [[ "$DECODED_URI" == "https://your-app.example.com/api/auth/callback/line" ]]; then
  echo "✅ redirect_uri ถูกต้อง: $DECODED_URI"
else
  echo "❌ redirect_uri ไม่ถูกต้อง: $DECODED_URI"
  echo "   ควรเป็น: https://your-app.example.com/api/auth/callback/line"
  exit 1
fi

echo "✅ การตรวจสอบเสร็จสิ้น: LINE OAuth URL ถูกต้อง"

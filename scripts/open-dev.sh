#!/bin/bash

# 🚀 Quick Development Access Script
# สคริปต์สำหรับเปิด browser ไปยัง localhost development server

DEV_URL="http://localhost:4325"
PORT=4325

echo "🔍 ตรวจสอบ Development Server..."

# ตรวจสอบว่า development server กำลังทำงานหรือไม่
if curl -s "$DEV_URL" > /dev/null 2>&1; then
    echo "✅ Development server กำลังทำงานที่ $DEV_URL"
else
    echo "❌ Development server ไม่ทำงาน"
    echo "🚀 เริ่ม development server..."
    
    # เริ่ม development server ใน background
    npm run dev:local &
    
    echo "⏳ รอ server เริ่มทำงาน..."
    sleep 5
    
    # ตรวจสอบอีกครั้ง
    if curl -s "$DEV_URL" > /dev/null 2>&1; then
        echo "✅ Development server เริ่มทำงานแล้ว"
    else
        echo "❌ ไม่สามารถเริ่ม development server ได้"
        echo "💡 กรุณาเรียกใช้: npm run dev:local ด้วยตนเอง"
        exit 1
    fi
fi

echo ""
echo "🌐 Development URLs:"
echo "   หน้าหลัก:        $DEV_URL"
echo "   Debug Console:   $DEV_URL/debug"
echo "   Hydration Test:  $DEV_URL/hydration-test"
echo "   Dev Redirect:    $DEV_URL/dev-redirect.html"
echo ""

# เปิด browser (macOS)
if command -v open &> /dev/null; then
    echo "🚀 เปิด browser..."
    open "$DEV_URL"
elif command -v xdg-open &> /dev/null; then
    # Linux
    echo "🚀 เปิด browser..."
    xdg-open "$DEV_URL"
else
    echo "💡 กรุณาเปิด browser และไปที่: $DEV_URL"
fi

echo ""
echo "⚠️  สำคัญ: ใช้เฉพาะ localhost URLs สำหรับ development"
echo "❌ อย่าใช้: https://line-login.midseelee.com"
echo "✅ ใช้: $DEV_URL"

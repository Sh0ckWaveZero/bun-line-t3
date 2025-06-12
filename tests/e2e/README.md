# 🎭 End-to-End Tests

ทดสอบ user journeys แบบครบวงจร

## 📁 โครงสร้าง

E2E tests สำหรับทดสอบ:
- Complete user workflows
- Cross-browser compatibility  
- Mobile responsiveness
- Real-world scenarios

## 🧪 การรัน Test

```bash
# รัน E2E tests ทั้งหมด
bun test tests/e2e

# รัน test บน browser เฉพาะ
bun test tests/e2e --browser=chromium
```

## 🎯 Testing Scenarios

- **Attendance Workflow**: ลงเวลาเข้า-ออกงานผ่าน LINE Bot
- **Report Generation**: สร้างและดูรายงานการทำงาน
- **Admin Operations**: การจัดการผู้ใช้และข้อมูล
- **Error Scenarios**: การจัดการ error และ edge cases
- **Security Flows**: ทดสอบ authentication และ authorization

## 🛠️ Tools

- **Playwright**: สำหรับ browser automation
- **Puppeteer**: สำหรับ advanced scenarios
- **Accessibility**: ทดสอบ WCAG compliance

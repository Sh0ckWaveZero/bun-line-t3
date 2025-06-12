# ⚛️ Components Tests

ทดสอบ React components และ UI elements

## 📁 โครงสร้าง

- `attendance/` - ทดสอบ components เกี่ยวกับการลงเวลา
- `common/` - ทดสอบ shared components (เช่น Rings.tsx)
- `ui/` - ทดสอบ UI library components (Shadcn UI)

## 🧪 การรัน Test

```bash
# รัน component tests ทั้งหมด
bun test tests/components

# รัน test เฉพาะหมวด
bun test tests/components/attendance
bun test tests/components/ui
```

## 🎨 Testing Approach

- **Unit Tests**: ทดสอบ component behavior แยกส่วน
- **Integration Tests**: ทดสอบการทำงานร่วมกันของ components
- **Accessibility Tests**: ทดสอบ WCAG 2.1 AA compliance
- **Security Tests**: ทดสอบ XSS protection และ input sanitization

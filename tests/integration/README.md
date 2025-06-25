# 🔗 Integration Tests

ทดสอบการทำงานร่วมกันของระบบหลายส่วน

## 📁 โครงสร้าง

Integration tests สำหรับทดสอบ:

- API endpoints integration
- Database operations
- External services (LINE API)
- Authentication flows
- End-to-end user workflows

## 🧪 การรัน Test

```bash
# รัน integration tests ทั้งหมด
bun test tests/integration

# รัน test เฉพาะไฟล์
bun test tests/integration/api-integration.test.ts
```

## 🎯 Testing Scope

- **API Integration**: ทดสอบการทำงานของ API endpoints แบบครบวงจร
- **Database Integration**: ทดสอบ CRUD operations กับ MongoDB
- **Third-party Integration**: ทดสอบการเชื่อมต่อกับ LINE API
- **Authentication Flow**: ทดสอบ login/logout และ session management
- **Security Integration**: ทดสอบ end-to-end security measures

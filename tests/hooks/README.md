# 🎣 Hooks Tests

ทดสอบ custom React hooks

## 📁 โครงสร้าง

Custom hooks จะถูกจัดกลุ่มตามฟีเจอร์ที่เกี่ยวข้อง

## 🧪 การรัน Test

```bash
# รัน hooks tests ทั้งหมด
bun test tests/hooks
```

## 🔍 Testing Strategy

- **Behavior Testing**: ทดสอบ hook behavior ด้วย @testing-library/react-hooks
- **State Management**: ทดสอบการจัดการ state และ side effects
- **Error Handling**: ทดสอบการจัดการ error cases
- **Performance**: ทดสอบ memory leaks และ optimization

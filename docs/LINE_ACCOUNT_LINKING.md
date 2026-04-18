# LINE Account Linking - 1 LINE ต่อ 1 User

## Overview

ระบบรองรับการเชื่อมโยง LINE Login account และ LINE Messaging API account เข้าด้วยกัน เพื่อให้แน่ใจว่า 1 LINE user จะมี 1 user account เท่านั้น

## Architecture

### LINE User IDs

LINE ออก userId คนละตัวต่อ channel ดังนั้น:

- **LINE Login user ID**: User ID จาก LINE Login channel (ใช้สำหรับ web authentication)
- **LINE Messaging API user ID**: User ID จาก LINE Messaging API / Bot channel (ใช้สำหรับส่งข้อความ)

### Database Schema

```prisma
model Account {
  id                        String    @id @default(cuid())
  accountId                 String    // LINE Login user ID
  providerId                String    // "line"
  userId                    String    // User ID
  lineMessagingApiUserId    String?   @unique // LINE Messaging API user ID (แยก)
  ...
}
```

- `accountId`: เก็บ LINE Login user ID (unique constraint: `providerId + accountId`)
- `lineMessagingApiUserId`: เก็บ LINE Messaging API user ID (unique constraint: ตัวเดียว)

### LineApprovalRequest Table

```prisma
model LineApprovalRequest {
  lineUserId      String    @unique  // LINE Messaging API user ID
  loginLineUserId String?   @unique  // LINE Login user ID (linked)
  ...
}
```

## Workflow

### 1. User Login ด้วย LINE Login

เมื่อ user ลงชื่อเข้าใช้ด้วย LINE Login:

1. Better Auth สร้าง `Account` record ใหม่:
   - `accountId` = LINE Login user ID
   - `providerId` = "line"

2. Database hook (`syncLineApprovalRequest`) ทำงาน:
   - ค้นหา `LineApprovalRequest` ที่มี `loginLineUserId` = LINE Login user ID
   - ถ้าพบและ approved → อัปเดต `lineMessagingApiUserId` ใน `Account` table

3. Account linking check:
   - ตรวจสอบว่า `lineMessagingApiUserId` ซ้ำกับ account อื่นหรือไม่
   - ถ้าซ้ำ → log warning และควร merge accounts

### 2. Auto-Linking Accounts

หากพบว่า 1 LINE user มีหลาย accounts:

1. ใช้ helper function `findAndMergeDuplicateLineAccounts()`:
   ```typescript
   import { findAndMergeDuplicateLineAccounts } from "@/lib/auth/account-linking";

   const primaryAccount = await findAndMergeDuplicateLineAccounts(
     lineMessagingApiUserId
   );
   ```

2. Function นี้จะ:
   - ค้นหา accounts ทั้งหมดที่มี `lineMessagingApiUserId` เดียวกัน
   - เลือก account ที่เก่าสุดเป็น primary
   - ย้าย sessions, attendances, leaves ไปยัง primary user
   - ลบ duplicate accounts และ orphan users

## Usage Examples

### ตรวจสอบ Account โดย LINE Messaging API ID

```typescript
import { findAccountByLineMessagingApiId } from "@/lib/auth/account-linking";

const account = await findAccountByLineMessagingApiId("U1234567890");
if (account) {
  console.log(`Found account for user: ${account.user.name}`);
}
```

### Manual Merge Duplicate Accounts

```typescript
import { findAndMergeDuplicateLineAccounts } from "@/lib/auth/account-linking";

// Merge accounts ที่มี LINE Messaging API ID เดียวกัน
const primaryAccount = await findAndMergeDuplicateLineAccounts("U1234567890");
if (primaryAccount) {
  console.log(`Merged to primary user: ${primaryAccount.user.email}`);
}
```

## Important Notes

### 1. LINE Profile Sync

LINE profile sync ทำงานใน 2 ขั้นตอน:
- **Before**: ไม่มี (ลบออกแล้ว)
- **After**: Sync profile และ link `lineMessagingApiUserId`

### 2. Account Linking

Better Auth มี built-in account linking:
```typescript
account: {
  accountLinking: {
    enabled: true,
    allowDifferentProviders: true,
    trustedProviders: ["line"],
  },
}
```

แต่ไม่รองรับ LINE Messaging API ID โดยตรง จึงต้องใช้ custom logic:

### 3. Constraint Violations

ระบบใช้ unique constraint บน `lineMessagingApiUserId`:
- ห้ามมี 2 accounts ที่มี `lineMessagingApiUserId` เดียวกัน
- ถ้าเกิด → ต้อง merge accounts ด้วย `findAndMergeDuplicateLineAccounts()`

## Troubleshooting

### Issue: User มีหลาย accounts

**Symptoms**:
- User login แล้วได้ session คนละตัว
- ข้อมูล attendances, leaves ไม่ตรงกัน

**Solution**:
```typescript
// 1. หา LINE Messaging API user ID จาก DcaOrder หรือข้อความ
const lineMessagingApiUserId = "U1234567890";

// 2. Merge accounts
await findAndMergeDuplicateLineAccounts(lineMessagingApiUserId);
```

### Issue: Unique constraint violation

**Symptoms**:
```
Unique constraint failed on the fields: (line_messaging_api_user_id)
```

**Solution**:
```typescript
// 1. หา duplicate accounts
const accounts = await db.account.findMany({
  where: { lineMessagingApiUserId: "U1234567890" }
});

// 2. Merge
await findAndMergeDuplicateLineAccounts("U1234567890");
```

## Migration

ถ้า migrate จากระบบเก่า:

1. **Backup database** ก่อน
2. **Run migration**: `npx prisma migrate deploy`
3. **Sync existing accounts**:
   ```typescript
   // สำหรับ account ที่มีอยู่แล้ว ให้ sync lineMessagingApiUserId
   const accounts = await db.account.findMany({
     where: { providerId: "line" }
   });

   for (const account of accounts) {
     await syncLineApprovalRequest(account);
   }
   ```
4. **Merge duplicates**:
   ```typescript
   const uniqueIds = [...new Set(accounts.map(a => a.lineMessagingApiUserId))];
   for (const id of uniqueIds) {
     if (id) await findAndMergeDuplicateLineAccounts(id);
   }
   ```

## Testing

ทดสอบระบบ:

1. **Test case 1**: User login ใหม่
   - ต้องสร้าง account และ user ใหม่
   - `lineMessagingApiUserId` ต้องถูก sync หลัง login

2. **Test case 2**: User login ซ้ำ
   - ต้องใช้ account และ user เดิม
   - ไม่ต้องสร้างใหม่

3. **Test case 3**: 1 LINE user, 2 accounts
   - ระบบต้อง detect duplicate
   - ควร merge accounts อัตโนมัติ

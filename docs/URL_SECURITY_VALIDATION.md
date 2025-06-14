# 🛡️ URL Security Validation System

> **ระบบป้องกัน Malicious Redirections และ Request Forgeries**

## 📋 ภาพรวม | Overview

ระบบ URL Security Validation ได้รับการออกแบบมาเพื่อป้องกันการโจมตีทางความปลอดภัยที่เกี่ยวข้องกับ URL manipulation รวมถึง:

- **Open Redirect Attacks** - การเปลี่ยนเส้นทางไปยังเว็บไซต์ที่เป็นอันตราย
- **Request Forgery (CSRF)** - การปลอมแปลง request จากแหล่งที่ไม่น่าเชื่อถือ
- **Subdomain Hijacking** - การแย่งชิง subdomain
- **Host Header Injection** - การฉีด header ที่เป็นอันตราย

## 🔧 การใช้งาน | Usage

### ✅ การตรวจสอบ URL พื้นฐาน

```typescript
import { validateUrl, isSafeUrl, getSafeRedirectUrl } from '@/lib/security/url-validator'

// ตรวจสอบ URL ว่าปลอดภัยหรือไม่
const isOk = isSafeUrl('https://line-login.midseelee.com/callback')
// ผลลัพธ์: true

// ตรวจสอบ URL พร้อมรายละเอียด
const validation = validateUrl('https://evil.com/steal-data', 'production')
console.log(validation)
// ผลลัพธ์: { isValid: false, hostname: 'evil.com', error: 'Host "evil.com" is not in the allowed list...' }

// รับ URL ที่ปลอดภัย (พร้อม fallback)
const safeUrl = getSafeRedirectUrl('https://malicious.com', '/dashboard')
// ผลลัพธ์: '/dashboard' (เพราะ URL แรกไม่ปลอดภัย)
```

### 🔒 การตรวจสอบ NextAuth URLs

```typescript
import { validateNextAuthUrl } from '@/lib/security/url-validator'

const authValidation = validateNextAuthUrl('https://line-login.midseelee.com')
console.log(authValidation)
// ผลลัพธ์:
// {
//   isValid: true,
//   isDevelopment: false,
//   isProduction: true,
//   hostname: 'line-login.midseelee.com'
// }
```

### 🧹 การทำความสะอาด URL

```typescript
import { sanitizeUrl } from '@/lib/security/url-validator'

const cleanUrl = sanitizeUrl('https://example.com/page?safe=ok&javascript:alert(1)=bad')
// ผลลัพธ์: 'https://example.com/page?safe=ok' (พารามิเตอร์อันตรายถูกลบออก)
```

## 🏛️ สถาปัตยกรรม | Architecture

### 📝 Allowed Hosts Configuration

```typescript
const ALLOWED_HOSTS = {
  development: ['localhost', '127.0.0.1'] as const,
  production: ['line-login.midseelee.com', 'midseelee.com'] as const,
} as const
```

### 🔍 การตรวจสอบหลายระดับ | Multi-layer Validation

1. **URL Format Validation** - ตรวจสอบรูปแบบ URL
2. **Protocol Validation** - อนุญาตเฉพาะ HTTP/HTTPS
3. **Hostname Validation** - ตรวจสอบกับรายการที่อนุญาต
4. **Subdomain Support** - รองรับ subdomain ใน production
5. **Parameter Sanitization** - ลบพารามิเตอร์ที่อันตราย

## 🚨 Security Features | คุณสมบัติด้านความปลอดภัย

### ✅ การป้องกันการโจมตี

| ประเภทการโจมตี | การป้องกัน | ตัวอย่าง |
|---|---|---|
| **Open Redirect** | Hostname whitelist | `https://evil.com` → ❌ |
| **Subdomain Hijacking** | Exact + subdomain match | `evil.midseelee.com` → ❌ |
| **Protocol Injection** | HTTP/HTTPS only | `javascript:alert(1)` → ❌ |
| **Parameter Injection** | Query param sanitization | `?onload=evil` → 🧹 ลบออก |
| **Host Header Injection** | Host validation | `evil.com.localhost` → ❌ |

### 🔒 Environment-Aware Security

```typescript
// Development Environment
isAllowedHost('localhost', 'development') // ✅ true
isAllowedHost('evil.com', 'development')  // ❌ false

// Production Environment  
isAllowedHost('line-login.midseelee.com', 'production') // ✅ true
isAllowedHost('api.midseelee.com', 'production')        // ✅ true (subdomain)
isAllowedHost('fake-midseelee.com', 'production')       // ❌ false
```

## 🧪 การทดสอบ | Testing

### 🔧 รันการทดสอบ

```bash
# รันการทดสอบทั้งหมด
bun test tests/lib/security/url-validator.test.ts

# รันการทดสอบด้วย watch mode
bun test --watch tests/lib/security/url-validator.test.ts
```

### 📊 Test Coverage

- ✅ **Basic URL Validation** - การตรวจสอบพื้นฐาน
- ✅ **Hostname Whitelist** - การตรวจสอบ hostname
- ✅ **Attack Prevention** - การป้องกันการโจมตี
- ✅ **Edge Cases** - กรณีพิเศษ
- ✅ **NextAuth Integration** - การรวมกับ NextAuth

## 🔄 การใช้งานใน Production | Production Usage

### 🌐 API Route Integration

```typescript
// src/app/api/auth/callback/route.ts
import { validateNextAuthUrl, getSafeRedirectUrl } from '@/lib/security/url-validator'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectTo = url.searchParams.get('callbackUrl') || '/'
  
  // 🛡️ ตรวจสอบ redirect URL ก่อนใช้งาน
  const safeRedirect = getSafeRedirectUrl(redirectTo, '/dashboard')
  
  // ... authentication logic ...
  
  return NextResponse.redirect(safeRedirect)
}
```

### 🎯 Component Integration

```typescript
// ใน React Component
import { validateNextAuthUrl } from '@/lib/security/url-validator'

function LoginButton({ callbackUrl }: { callbackUrl: string }) {
  const validation = validateNextAuthUrl(callbackUrl)
  
  if (!validation.isValid) {
    console.warn(`🚨 Unsafe callback URL: ${validation.error}`)
    callbackUrl = '/dashboard' // fallback
  }
  
  return (
    <button onClick={() => signIn('line', { callbackUrl })}>
      เข้าสู่ระบบด้วย LINE
    </button>
  )
}
```

## 📋 Best Practices | แนวทางปฏิบัติที่ดี

### ✅ DO - สิ่งที่ควรทำ

- ✅ **ตรวจสอบ URL ทุกครั้ง** ก่อนใช้งาน
- ✅ **ใช้ getSafeRedirectUrl** สำหรับ redirect operations
- ✅ **Log security events** เพื่อการตรวจสอบ
- ✅ **Update allowed hosts** เมื่อมี domain ใหม่
- ✅ **Test security functions** อย่างสม่ำเสมอ

### ❌ DON'T - สิ่งที่ไม่ควรทำ

- ❌ **อย่าไว้ใจ user input** โดยไม่ตรวจสอบ
- ❌ **อย่า hardcode domain lists** ใช้ configuration
- ❌ **อย่าข้ามการตรวจสอบ** เพื่อความสะดวก
- ❌ **อย่าเปิดเผยข้อมูลสำคัญ** ใน error messages

## 🔧 Configuration | การกำหนดค่า

### 🌍 Environment Variables

```bash
# Development
NEXTAUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Production
NEXTAUTH_URL=https://line-login.midseelee.com
FRONTEND_URL=https://line-login.midseelee.com
```

### 📝 การเพิ่ม Domain ใหม่

```typescript
// เพิ่มใน src/lib/security/url-validator.ts
const ALLOWED_HOSTS = {
  development: ['localhost', '127.0.0.1'] as const,
  production: [
    'line-login.midseelee.com', 
    'midseelee.com',
    'new-domain.com' // 🆕 เพิ่ม domain ใหม่
  ] as const,
} as const
```

## 🚨 Incident Response | การตอบสนองเหตุการณ์

### 📊 Security Monitoring

```typescript
// การ log security events
function logSecurityEvent(event: string, details: any) {
  console.warn(`🚨 Security Event: ${event}`, {
    timestamp: new Date().toISOString(),
    userAgent: details.userAgent,
    ip: details.ip,
    attemptedUrl: details.url,
    // ห้าม log ข้อมูลสำคัญ
  })
}
```

### 🔧 การแก้ไขเมื่อพบปัญหา

1. **ตรวจสอบ logs** หาการโจมตีที่เป็นไปได้
2. **Update allowed hosts** หากจำเป็น
3. **แจ้งทีมรักษาความปลอดภัย** ถึงการโจมตี
4. **Monitor increased attempts** หลังจากแก้ไข

---

## 📚 เอกสารอ้างอิง | References

- [OWASP: Unvalidated Redirects and Forwards](https://owasp.org/www-project-top-ten/2017/A10_2017-Unvalidated_Redirects_and_Forwards)
- [NextAuth.js Security Guidelines](https://next-auth.js.org/configuration/options#nextauth_url)
- [MDN: URL Security](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**🛡️ Security First**: Remember that every URL in your application is a potential attack vector. Always validate, always sanitize, always be suspicious of user input.

**การรักษาความปลอดภัยเป็นอันดับแรก**: จำไว้ว่า URL ทุกตัวในแอปพลิเคชันของคุณเป็นจุดที่อาจถูกโจมตีได้ ตรวจสอบเสมอ ทำความสะอาดเสมอ และระแวงผู้ใช้งานเสมอ

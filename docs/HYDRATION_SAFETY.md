# 🛡️ Hydration Safety Guide

## 🎯 ภาพรวม | Overview

Hydration mismatch เป็นปัญหาที่เกิดขึ้นเมื่อ HTML ที่ React สร้างบน server ไม่ตรงกับสิ่งที่ React คาดหวังบน client การจัดการปัญหานี้อย่างถูกต้องเป็นสิ่งสำคัญสำหรับ UX และ performance

## 🚨 สาเหตุหลักของ Hydration Mismatch

### 1. 📅 Dynamic Timestamps
```typescript
// ❌ ผิด - จะทำให้เกิด hydration mismatch
function CurrentTime() {
  return <div>{new Date().toLocaleString()}</div>
}

// ✅ ถูกต้อง - ใช้ SafeTimestamp component
import { SafeTimestamp } from '~/components/common/SafeHydration'

function CurrentTime() {
  return <SafeTimestamp format="full" />
}
```

### 2. 🎲 Random Values
```typescript
// ❌ ผิด - Math.random() ให้ค่าต่างกันระหว่าง server/client
function RandomMessage() {
  const messages = ['Hello', 'Hi', 'Hey']
  const random = messages[Math.floor(Math.random() * messages.length)]
  return <div>{random}</div>
}

// ✅ ถูกต้อง - ใช้ SafeRandomContent component
import { SafeRandomContent } from '~/components/common/SafeHydration'

function RandomMessage() {
  const messages = ['Hello', 'Hi', 'Hey']
  return <SafeRandomContent items={messages} fallback="Loading..." />
}
```

### 3. 🌐 Browser-Only APIs
```typescript
// ❌ ผิด - window object ไม่มีบน server
function UserAgent() {
  return <div>{window.navigator.userAgent}</div>
}

// ✅ ถูกต้อง - ใช้ ClientOnlyWrapper
import { ClientOnlyWrapper } from '~/components/common/SafeHydration'

function UserAgent() {
  return (
    <ClientOnlyWrapper fallback={<div>Loading...</div>}>
      <div>{window.navigator.userAgent}</div>
    </ClientOnlyWrapper>
  )
}
```

## 🔧 วิธีการแก้ไข | Solutions

### 1. 🎯 suppressHydrationWarning={true}

ใช้เมื่อ hydration mismatch หลีกเลี่ยงไม่ได้:

```typescript
function UnavoidableMismatch() {
  return (
    <div suppressHydrationWarning={true}>
      {/* เนื้อหาที่แน่ใจว่าแตกต่างระหว่าง server/client */}
      {typeof window !== 'undefined' ? window.location.href : 'Server'}
    </div>
  )
}
```

### 2. 🎣 useEffect Pattern

```typescript
import { useState, useEffect } from 'react'

function SafeComponent() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <div>Loading...</div> // Server fallback
  }
  
  return <div>{window.location.href}</div> // Client content
}
```

### 3. 🛡️ Custom Hooks

ใช้ hooks ที่เราสร้างไว้:

```typescript
import { 
  useClientOnlyMounted, 
  useSafeHydration,
  useSuppressHydrationWarning 
} from '~/hooks/useHydrationSafe'

function SmartComponent() {
  const mounted = useClientOnlyMounted()
  const suppressWarning = useSuppressHydrationWarning(!mounted)
  
  const content = useSafeHydration(
    'Server Content',
    () => 'Client Content'
  )
  
  return (
    <div suppressHydrationWarning={suppressWarning}>
      {content}
    </div>
  )
}
```

## 🧪 Testing Hydration Safety

### 1. 🔍 Development Detection

```typescript
// ✅ Hook สำหรับตรวจจับ hydration issues
export function useHydrationWarningDetector() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error
      
      console.error = (...args) => {
        if (args[0]?.includes?.('Hydration')) {
          console.warn('🚨 Hydration Mismatch Detected:', ...args)
          // Optional: ส่งไปยัง error tracking service
        }
        originalError(...args)
      }
      
      return () => {
        console.error = originalError
      }
    }
  }, [])
}
```

### 2. 🧪 Test Cases

```typescript
import { render, screen } from '@testing-library/react'
import { SafeTimestamp } from '~/components/common/SafeHydration'

describe('SafeTimestamp', () => {
  test('should not cause hydration mismatch', () => {
    // Mock server environment
    Object.defineProperty(window, 'location', {
      value: undefined,
      writable: true
    })
    
    const { container } = render(<SafeTimestamp />)
    
    // Should render without hydration warnings
    expect(container.firstChild).toHaveAttribute('suppressHydrationWarning')
  })
})
```

## 📋 Best Practices | แนวทางปฏิบัติที่ดี

### ✅ ควรทำ

1. **ใช้ suppressHydrationWarning เฉพาะเมื่อจำเป็น**
2. **ใช้ useEffect สำหรับ browser-specific code**
3. **มี fallback content สำหรับ server**
4. **ทดสอบใน development mode เพื่อตรวจจับ warnings**
5. **ใช้ custom hooks ที่เราสร้างไว้**

### ❌ ไม่ควรทำ

1. **อย่าใช้ suppressHydrationWarning แบบมั่วซั่ว**
2. **อย่าเข้าถึง window/document โดยตรงใน render**
3. **อย่าใช้ Math.random() ใน server components**
4. **อย่าใช้ Date.now() หรือ new Date() ใน render**
5. **อย่าเพิกเฉยต่อ hydration warnings**

## 🔧 Advanced Patterns

### 1. 🎭 Conditional Hydration

```typescript
function ConditionalHydration({ condition, children, fallback }) {
  const mounted = useClientOnlyMounted()
  
  if (!mounted) {
    return fallback
  }
  
  return (
    <div suppressHydrationWarning={condition}>
      {children}
    </div>
  )
}
```

### 2. 🌊 Progressive Enhancement

```typescript
function ProgressiveComponent() {
  const [enhanced, setEnhanced] = useState(false)
  
  useEffect(() => {
    // เปิดใช้ features เพิ่มเติมหลัง hydration
    setEnhanced(true)
  }, [])
  
  return (
    <div>
      <div>Basic content (always visible)</div>
      {enhanced && (
        <div suppressHydrationWarning={true}>
          Enhanced features (client-only)
        </div>
      )}
    </div>
  )
}
```

### 3. 🎯 Smart Fallbacks

```typescript
function SmartFallback({ children, fallback, condition }) {
  const mounted = useClientOnlyMounted()
  const shouldSuppress = useSuppressHydrationWarning(condition)
  
  if (!mounted && fallback) {
    return <>{fallback}</>
  }
  
  return (
    <div suppressHydrationWarning={shouldSuppress}>
      {children}
    </div>
  )
}
```

## 🚀 Performance Considerations

1. **Minimize Client-Only Content**: ลดเนื้อหาที่แสดงเฉพาะ client
2. **Use Static Fallbacks**: ใช้ fallback ที่ static เมื่อเป็นไปได้
3. **Avoid Layout Shifts**: ป้องกันการเปลี่ยนแปลง layout หลัง hydration
4. **Cache Hydration State**: cache สถานะการ hydration เมื่อเป็นไปได้

## 🔍 Debugging Tools

### Chrome DevTools

1. เปิด Console และดู hydration warnings
2. ใช้ React DevTools เพื่อตรวจสอบ component tree
3. ใช้ Performance tab เพื่อดู hydration timing

### Development Tools

```typescript
// เพิ่มใน _app.tsx สำหรับ development
if (process.env.NODE_ENV === 'development') {
  React.useEffect(() => {
    import('~/components/common/HydrationDebugger').then(({ HydrationDebugger }) => {
      // Mount debugger
    })
  }, [])
}
```

## 📚 อ้างอิง | References

- [React Hydration Documentation](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Next.js Hydration Guide](https://nextjs.org/docs/messages/react-hydration-error)
- [Common Hydration Patterns](https://github.com/vercel/next.js/tree/canary/examples)

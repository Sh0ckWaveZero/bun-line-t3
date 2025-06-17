# ThemeToggle Component Documentation

## 📋 Overview | ภาพรวม

ThemeToggle component เป็น UI component สำหรับสลับระหว่าง light mode และ dark mode โดยใช้ next-themes และ Radix UI Switch พร้อมกับ Sun/Moon icons จาก Lucide React

## 🎯 Features | คุณสมบัติ

- ✅ **Theme Switching**: สลับระหว่าง light/dark mode
- ✅ **Visual Indicators**: Sun icon สำหรับ light mode, Moon icon สำหรับ dark mode  
- ✅ **Smooth Transition**: Switch animation ที่นุ่มนวล
- ✅ **Hydration Safe**: ป้องกัน hydration mismatch errors
- ✅ **Accessible**: รองรับ keyboard navigation และ screen readers
- ✅ **TypeScript**: Type safety เต็มรูปแบบ

## 🚀 Installation | การติดตั้ง

### Dependencies Required:
```bash
bun add next-themes @radix-ui/react-switch lucide-react
```

### Files Created:
- `src/components/ui/switch.tsx` - Radix UI Switch component
- `src/components/ui/theme-toggle.tsx` - Main ThemeToggle component
- Updated `src/app/providers.tsx` - ThemeProvider setup

## 💻 Usage | การใช้งาน

### 1. Basic Usage

```tsx
import { ThemeToggle } from "@/components/ui"

function Header() {
  return (
    <div className="flex justify-between items-center">
      <h1>My App</h1>
      <ThemeToggle />
    </div>
  )
}
```

### 2. In Attendance Report

```tsx
<div className="flex justify-between items-center mb-6">
  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
    รายงานการเข้างานรายเดือน
  </h1>
  <ThemeToggle />
</div>
```

## 🎨 Component Structure | โครงสร้าง Component

```tsx
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const isDark = theme === "dark";

  return (
    <div className="flex items-center space-x-3">
      <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        className="data-[state=checked]:bg-blue-600"
      />
      <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    </div>
  );
};
```

## 🎛️ Component Props | Props ของ Component

### ThemeToggle
ไม่มี props - component ใช้ `useTheme()` hook โดยตรง

### Switch (Radix UI)
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | สถานะของ switch |
| `onCheckedChange` | `(checked: boolean) => void` | - | Callback เมื่อเปลี่ยนสถานะ |
| `className` | `string` | - | CSS classes เพิ่มเติม |
| `disabled` | `boolean` | `false` | ปิดการใช้งาน |

## 🎨 Styling | การตกแต่ง

### Default Styling
```tsx
<div className="flex items-center space-x-3">
  {/* Icons with responsive colors */}
  <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
  
  {/* Switch with custom checked color */}
  <Switch 
    className="data-[state=checked]:bg-blue-600" 
  />
  
  <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
</div>
```

### Custom Styling
```tsx
<ThemeToggle className="custom-theme-toggle" />

/* CSS */
.custom-theme-toggle .switch {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
}
```

## 🔧 ThemeProvider Setup | การตั้งค่า ThemeProvider

### Required in app/providers.tsx:
```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={true}
        disableTransitionOnChange={false}
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
```

### ThemeProvider Options:
- `attribute="class"` - ใช้ class attribute สำหรับ styling
- `defaultTheme="light"` - theme เริ่มต้น
- `enableSystem={true}` - ตรวจจับ system theme preference
- `disableTransitionOnChange={false}` - เปิด transition animations

## 🌙 Dark Mode Implementation | การทำ Dark Mode

### CSS Classes Pattern:
```css
/* Light mode (default) */
.bg-white { background: white; }
.text-gray-900 { color: #111827; }

/* Dark mode */
.dark:bg-gray-800 { background: #1f2937; }
.dark:text-gray-100 { color: #f9fafb; }
```

### Common Dark Mode Classes:
```tsx
<div className="bg-white dark:bg-gray-800">
  <h1 className="text-gray-900 dark:text-gray-100">Title</h1>
  <p className="text-gray-600 dark:text-gray-400">Text</p>
  <button className="bg-blue-600 dark:bg-blue-500">Button</button>
</div>
```

## 🧪 Testing | การทดสอบ

### Test Coverage:
- ✅ Component structure validation
- ✅ Theme toggle logic
- ✅ isDark calculation
- ✅ Mounting behavior
- ✅ Callback functions

### Running Tests:
```bash
bun test tests/components/ui/theme-toggle.test.tsx
```

## 🎯 Best Practices | แนวทางปฏิบัติที่ดี

### 1. Hydration Safety
```tsx
// ✅ Always check mounted state
if (!mounted) {
  return null;
}
```

### 2. Consistent Dark Mode Classes
```tsx
// ✅ Add dark: variants for all colored elements
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
```

### 3. System Theme Support
```tsx
// ✅ Enable system theme detection
<ThemeProvider enableSystem={true}>
```

### 4. Smooth Transitions
```tsx
// ✅ Use transition classes
className="transition-colors duration-200"
```

## 🐛 Troubleshooting | การแก้ปัญหา

### Common Issues:

#### 1. Hydration Mismatch Error
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```
**Solution**: ตรวจสอบว่ามี `mounted` state check

#### 2. Theme Not Applying
**Solution**: ตรวจสอบว่า ThemeProvider ครอบ component ที่ใช้

#### 3. Switch Not Working  
**Solution**: ตรวจสอบ `onCheckedChange` callback และ `checked` prop

#### 4. Icons Not Showing
**Solution**: ตรวจสอบ lucide-react import และ icon names

## 📱 Example Integration | ตัวอย่างการใช้งาน

### Header Component
```tsx
function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Application
          </h1>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
```

### Mobile Menu
```tsx
function MobileMenu() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
        <ThemeToggle />
      </div>
    </div>
  )
}
```

## 🎉 Benefits | ประโยชน์

1. **👁️ Better UX**: ผู้ใช้เลือก theme ตามความชอบได้
2. **♿ Accessibility**: รองรับ screen readers และ keyboard navigation  
3. **🔋 Battery Saving**: Dark mode ช่วยประหยัดแบตเตอรี่ (OLED screens)
4. **😊 Eye Comfort**: ลดความเมื่อยล้าของสายตาในที่มืด
5. **⚡ Modern Feel**: ให้ความรู้สึกทันสมัยและ professional

ตอนนี้ ThemeToggle component พร้อมใช้งานแล้ว! 🌟

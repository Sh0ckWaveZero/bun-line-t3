# Calendar Component Usage Guide

## 📋 Overview | ภาพรวม

Calendar component ที่สร้างขึ้นด้วย `react-day-picker` และ Shadcn UI สำหรับการเลือกวันที่แบบโต้ตอบ รองรับธีมสว่าง/มืด และการแสดงผลภาษาไทย

## 🎯 Features | คุณสมบัติ

- ✅ เลือกวันที่เดี่ยวหรือหลายวัน
- ✅ รองรับ Buddhist Era (พุทธศักราช)
- ✅ ธีมสว่าง/มืด
- ✅ Accessibility ที่ดี
- ✅ Responsive design
- ✅ TypeScript support

## 🚀 Installation | การติดตั้ง

Dependencies ที่จำเป็น:
```bash
bun add react-day-picker lucide-react clsx tailwind-merge
bun add @radix-ui/react-slot @radix-ui/react-popover class-variance-authority
```

## 💻 Basic Usage | การใช้งานพื้นฐาน

### 1. Import Components

```typescript
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
```

### 2. Simple Calendar

```typescript
import { useState } from "react"

function SimpleCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border"
    />
  )
}
```

### 3. Calendar with Popover (แนะนำ)

```typescript
import { useState } from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function CalendarWithPopover() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Convert to Buddhist Era
  const formatBuddhistDate = (date: Date) => {
    const buddhistYear = date.getFullYear() + 543
    const monthNames = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ]
    const month = monthNames[date.getMonth()]
    return `${month} ${buddhistYear}`
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] h-12 justify-start text-left font-medium",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-3 h-5 w-5" />
          {selectedDate ? formatBuddhistDate(selectedDate) : "เลือกเดือน"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
```

## 🎨 Styling | การตกแต่ง

### Custom Styling

```typescript
<Calendar
  className="p-4 border rounded-lg"
  classNames={{
    day_selected: "bg-blue-500 text-white hover:bg-blue-600",
    day_today: "bg-yellow-100 text-yellow-900",
  }}
/>
```

### Dark Mode Support

Component รองรับ dark mode โดยอัตโนมัติผ่าน Tailwind CSS:

```css
/* globals.css */
.dark {
  /* Calendar จะปรับสีตาม dark mode โดยอัตโนมัติ */
}
```

## 🔧 API Reference | เอกสาร API

### Calendar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `"single" \| "multiple" \| "range"` | `"single"` | โหมดการเลือกวันที่ |
| `selected` | `Date \| Date[] \| DateRange` | `undefined` | วันที่ที่เลือก |
| `onSelect` | `(date: Date \| undefined) => void` | `undefined` | Callback เมื่อเลือกวันที่ |
| `showOutsideDays` | `boolean` | `true` | แสดงวันที่นอกเดือน |
| `className` | `string` | `undefined` | CSS class เพิ่มเติม |
| `classNames` | `object` | `undefined` | Custom class names |

### Button Variants

```typescript
type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type ButtonSize = "default" | "sm" | "lg" | "icon"
```

## 📱 Example Components | ตัวอย่าง Components

### Pre-built Example

```typescript
import { CalendarExample } from "@/components/ui/calendar-example"

function MyPage() {
  return <CalendarExample />
}
```

## 🧪 Testing | การทดสอบ

รันเทสสำหรับ Calendar component:

```bash
bun test tests/components/ui/calendar.test.tsx
```

## 🛡️ Security Notes | หมายเหตุความปลอดภัย

- Component นี้เป็น client-side UI เท่านั้น
- ไม่มีการเชื่อมต่อกับเซิร์ฟเวอร์
- ข้อมูลวันที่ควรผ่าน validation ก่อนส่งไปเซิร์ฟเวอร์

## 📚 Resources | แหล่งข้อมูล

- [React DayPicker Documentation](https://react-day-picker.js.org/)
- [Radix UI Popover](https://www.radix-ui.com/docs/primitives/components/popover)
- [Shadcn UI Components](https://ui.shadcn.com/)

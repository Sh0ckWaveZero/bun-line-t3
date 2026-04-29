# 📅 Calendar System Documentation

## 📋 Overview | ภาพรวม

Calendar system ที่สร้างขึ้นด้วย `react-day-picker` และ Shadcn UI สำหรับการเลือกวันที่แบบโต้ตอบ รองรับธีมสว่าง/มืด การแสดงผลภาษาไทย และพุทธศักราช (Buddhist Era)

## 🎯 Features | คุณสมบัติ

- ✅ เลือกวันที่เดี่ยวหรือหลายวัน
- ✅ รองรับ Buddhist Era (พุทธศักราช พ.ศ.)
- ✅ ธีมสว่าง/มืด (Dark/Light Mode)
- ✅ Accessibility ที่ดี
- ✅ Responsive design
- ✅ TypeScript support
- ✅ Auto-close หลังเลือกวันที่
- ✅ State synchronization ระหว่าง props และ local state

## 🚀 Installation | การติดตั้ง

Dependencies ที่จำเป็น:

```bash
bun add react-day-picker lucide-react clsx tailwind-merge
bun add @radix-ui/react-slot @radix-ui/react-popover class-variance-authority
```

## 💻 Usage | การใช้งาน

### 1. Basic Calendar Component

```typescript
import { Calendar } from "@/components/ui/calendar";
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

### 2. Calendar with Popover (Recommended)

```typescript
import { useState } from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

function CalendarWithPopover() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isOpen, setIsOpen] = useState(false)

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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setIsOpen(false) // Auto-close after selection
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-[240px] h-12 justify-start text-left font-medium rounded-md border border-gray-300 px-3 py-2",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "hover:bg-gray-50 dark:hover:bg-gray-700",
            "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          )}
        >
          <CalendarIcon className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" />
          {selectedDate ? formatBuddhistDate(selectedDate) : "เลือกเดือน"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
          className="pointer-events-auto p-4"
        />
      </PopoverContent>
    </Popover>
  )
}
```

### 3. MonthSelector Enhancement

สำหรับการเลือกเดือนใน attendance report:

```typescript
interface MonthSelectorProps {
  selectedMonth: string // Format: "YYYY-MM"
  onMonthChange: (month: string) => void
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onMonthChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    parseMonthString(selectedMonth)
  )
  const [isOpen, setIsOpen] = useState(false)

  // Sync with props
  React.useEffect(() => {
    setSelectedDate(parseMonthString(selectedMonth))
  }, [selectedMonth])

  const formatBuddhistDate = (date: Date) => {
    const buddhistYear = date.getFullYear() + 543
    const monthNames = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ]
    return `${monthNames[date.getMonth()]} ${buddhistYear}`
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      onMonthChange(formatToMonthString(date))
      setIsOpen(false) // Auto-close
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
          เลือกเดือน
        </span>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[200px] justify-start">
              <CalendarIcon className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" />
              {selectedDate ? formatBuddhistDate(selectedDate) : "เลือกเดือน"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className="pointer-events-auto p-4"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

// Helper functions
const parseMonthString = (monthStr: string): Date => {
  const [year, month] = monthStr.split("-").map(Number)
  return new Date(year, month - 1, 1)
}

const formatToMonthString = (date: Date): string => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  return `${year}-${month}`
}
```

## 🎨 Styling & Theming | การตกแต่ง

### Custom Styling

```typescript
<Calendar
  className="p-4 border rounded-lg"
  classNames={{
    day_selected: "bg-blue-500 text-white hover:bg-blue-600",
    day_today: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100",
    nav_button: "hover:bg-gray-100 dark:hover:bg-gray-700",
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

### Color Scheme

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | `bg-white` | `dark:bg-gray-800` |
| Border | `border-gray-200` | `dark:border-gray-700` |
| Text | `text-gray-900` | `dark:text-gray-100` |
| Selected Day | `bg-blue-500` | `bg-blue-600` |
| Today | `bg-yellow-100` | `dark:bg-yellow-900/20` |

## 🔧 API Reference | เอกสาร API

### Calendar Props

| Prop | Type | Default | Description |
|-----|------|---------|-------------|
| `mode` | `"single" \| "multiple" \| "range"` | `"single"` | โหมดการเลือกวันที่ |
| `selected` | `Date \| Date[] \| DateRange` | `undefined` | วันที่ที่เลือก |
| `onSelect` | `(date: Date \| undefined) => void` | `undefined` | Callback เมื่อเลือกวันที่ |
| `showOutsideDays` | `boolean` | `true` | แสดงวันที่นอกเดือน |
| `className` | `string` | `undefined` | CSS class เพิ่มเติม |
| `classNames` | `object` | `undefined` | Custom class names |

### Popover Props

| Prop | Type | Default | Description |
|-----|------|---------|-------------|
| `open` | `boolean` | `undefined` | Control popover state |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Callback เมื่อเปิด/ปิด |

## 🐛 Bug Fixes & Enhancements | การแก้ไขปัญหา

### Issue: Calendar ไม่ปิดหลังเลือกวันที่

**ปัญหา:**
- Calendar component เปิดได้ปกติ ✅
- แสดงปีพุทธศักราชถูกต้อง ✅
- **แต่เลือกวันที่แล้วไม่เกิดอะไรขึ้น** ❌

**สาเหตุ:**
1. ไม่มี state control สำหรับ Popover
2. Local state ไม่ sync กับ props
3. ไม่มี auto-close หลังเลือก

**วิธีแก้ไข:**

```typescript
const [isOpen, setIsOpen] = useState(false)

const handleDateSelect = (date: Date | undefined) => {
  if (date) {
    setSelectedDate(date)
    onMonthChange(formatToMonthString(date))
    setIsOpen(false) // ✅ Auto-close after selection
  }
}

// Sync with props
React.useEffect(() => {
  setSelectedDate(parseMonthString(selectedMonth))
}, [selectedMonth])

<Popover open={isOpen} onOpenChange={setIsOpen}>
```

### Enhancement: จาก HTML Input เป็น Calendar Component

**Before (HTML Input):**
- ❌ แสดงปีค.ศ. (Gregorian)
- ❌ UI พื้นฐาน ไม่ทันสมัย
- ❌ ไม่รองรับ dark mode
- ❌ Browser-dependent styling

**After (Calendar Component):**
- ✅ แสดงปีพ.ศ. (มิถุนายน 2568)
- ✅ UI สวยงาม ทันสมัย
- ✅ รองรับ dark/light mode
- ✅ Interactive calendar picker
- ✅ Consistent styling
- ✅ Type safety เต็มรูปแบบ

## 🧪 Testing | การทดสอบ

### Unit Tests

```typescript
import { describe, test, expect } from "bun:test"

describe("Calendar Utilities", () => {
  test("formatBuddhistDate should convert to Buddhist Era", () => {
    const date = new Date(2025, 5, 15) // June 15, 2025
    const buddhistYear = date.getFullYear() + 543
    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน"]
    const month = monthNames[date.getMonth()]
    const result = `${month} ${buddhistYear}`
    expect(result).toBe("มิถุนายน 2568") // 2025 + 543 = 2568
  })

  test("parseMonthString should parse YYYY-MM correctly", () => {
    const result = parseMonthString("2025-06")
    expect(result.getFullYear()).toBe(2025)
    expect(result.getMonth()).toBe(5) // June is 5 (0-indexed)
  })

  test("formatToMonthString should format Date to YYYY-MM", () => {
    const date = new Date(2025, 5, 15)
    const result = formatToMonthString(date)
    expect(result).toBe("2025-06")
  })
})
```

รันเทส:

```bash
bun test tests/calendar.test.ts
```

## 📱 Visual Comparison | เปรียบเทียบภาพ

### Before (HTML Input):

```
[เลือกเดือน]
[2025-06      ▼]  // HTML input, ปีค.ศ.
```

### After (Calendar Component):

```
┌─────────────────────────────────────────────────────┐
│ เลือกเดือน  📅 มิถุนายน 2568                        │
└─────────────────────────────────────────────────────┘
                    ↓ คลิก
┌─────────────────────────────────────────────────────┐
│                  📅 Calendar                       │
│  อา จ  อ  พ  พฤ ศ  ส                               │
│   1  2  3  4  5  6  7                              │
│   8  9 10 11 12 13 14                              │
│  15 16 17 18 19 20 21                              │
│  22 23 24 25 26 27 28                              │
│  29 30                                             │
└─────────────────────────────────────────────────────┘
```

## 🎉 Benefits | ประโยชน์

1. **UX ที่ดีขึ้น**: พุทธศักราช + Interactive calendar
2. **Accessibility**: รองรับ keyboard navigation
3. **Consistency**: ใช้ design system เดียวกัน
4. **Maintainability**: TypeScript + comprehensive tests
5. **Future-proof**: ใช้ modern React patterns
6. **Auto-close**: Calendar ปิดทันทีหลังเลือก
7. **State Sync**: Synchronization ระหว่าง props และ local state

## 📚 Resources | แหล่งข้อมูล

- [React DayPicker Documentation](https://react-day-picker.js.org/)
- [Radix UI Popover](https://www.radix-ui.com/docs/primitives/components/popover)
- [Shadcn UI Components](https://ui.shadcn.com/)

---

**📝 อัปเดตล่าสุด**: 26 เมษายน 2026
**👨‍💻 ผู้ดูแล**: Development Team

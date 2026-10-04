// src/features/attendance/constants/leave-form.ts
import { cn } from "@/lib/utils";
import { Cake, Palmtree, Stethoscope, User } from "lucide-react";

// ─── Leave type config ────────────────────────────────────────────────────────

export const LEAVE_TYPES = [
  { value: "personal", label: "ลากิจ", icon: User },
  { value: "sick", label: "ลาป่วย", icon: Stethoscope },
  { value: "vacation", label: "ลาพักร้อน", icon: Palmtree },
  { value: "birthday", label: "เดือนเกิด", icon: Cake },
] as const;

export type LeaveTypeValue = (typeof LEAVE_TYPES)[number]["value"];

export const LEAVE_TYPE_MAP = Object.fromEntries(
  LEAVE_TYPES.map((t) => [t.value, t]),
) as Record<string, (typeof LEAVE_TYPES)[number]>;

// ─── Calendar classNames (Tailwind override, bypasses default react-day-picker CSS) ───

export const CALENDAR_CLASSNAMES = {
  root: "p-3 select-none",
  months: "flex flex-col",
  // month เป็น relative parent ของ nav (absolute)
  month: "relative",
  month_caption: "flex h-9 w-full items-center justify-center",
  caption_label: "text-sm font-semibold text-foreground",
  // nav อยู่บน month_caption ด้วย z-10 เพื่อให้กดได้
  nav: "absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between",
  button_previous: cn(
    "flex h-7 w-7 items-center justify-center rounded-md",
    "border border-input bg-background text-foreground",
    "opacity-60 transition-opacity hover:opacity-100 active:scale-95",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ),
  button_next: cn(
    "flex h-7 w-7 items-center justify-center rounded-md",
    "border border-input bg-background text-foreground",
    "opacity-60 transition-opacity hover:opacity-100 active:scale-95",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ),
  month_grid: "mt-2 w-full border-collapse",
  weekdays: "flex",
  weekday:
    "w-9 py-1 text-center text-[0.75rem] font-normal text-muted-foreground",
  week: "mt-1 flex w-full",
  day: "relative p-0",
  // day_button: base styles + data-* state variants
  day_button: cn(
    "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-normal",
    "transition-colors",
    "hover:bg-accent hover:text-accent-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    // selected — primary fill (สูงกว่า today)
    "data-[selected]:bg-primary data-[selected]:text-primary-foreground",
    "data-[selected]:hover:bg-primary/90 data-[selected]:hover:text-primary-foreground",
    // outside month days
    "data-[outside]:text-muted-foreground data-[outside]:opacity-40",
    // disabled
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-30",
  ),
  // today: ring รอบวันปัจจุบัน (ถ้าเลือกแล้วจะถูก bg-primary ทับ แต่ ring ยังเห็น)
  today: "ring-2 ring-primary/70 font-bold rounded-full",
  // modifier ที่เหลือว่าง (handle ใน day_button ด้วย data-*)
  selected: "",
  outside: "",
  disabled: "",
  hidden: "invisible",
} as const;

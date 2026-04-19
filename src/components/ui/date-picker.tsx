import * as React from "react";
import { DayPicker as ThaiDayPicker } from "react-day-picker/buddhist";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const CALENDAR_CLASSNAMES = {
  root: "p-3 select-none",
  months: "flex flex-col",
  month: "relative",
  month_caption: "flex h-9 w-full items-center justify-center",
  caption_label: "text-sm font-semibold text-foreground",
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
  day_button: cn(
    "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-normal",
    "transition-colors",
    "hover:bg-accent hover:text-accent-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "data-[selected]:bg-primary data-[selected]:text-primary-foreground",
    "data-[selected]:hover:bg-primary/90 data-[selected]:hover:text-primary-foreground",
    "data-[outside]:text-muted-foreground data-[outside]:opacity-40",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-30",
  ),
  today: "ring-2 ring-primary/70 font-bold rounded-full",
  selected: "",
  outside: "",
  disabled: "",
  hidden: "invisible",
} as const;

const THAI_MONTHS_LONG = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const THAI_WEEKDAYS = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

function formatThaiFullDate(date?: Date) {
  if (!date) return "";
  const weekday = THAI_WEEKDAYS[date.getDay()] ?? "";
  const day = date.getDate();
  const month = THAI_MONTHS_LONG[date.getMonth()] ?? "";
  const buddhistYear = date.getFullYear() + 543;
  return `วัน${weekday}ที่ ${day} ${month} ${buddhistYear}`;
}

export interface DatePickerProps {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
  id?: string;
  className?: string;
}

export function DatePicker({
  date,
  onSelect,
  disabled,
  minDate,
  maxDate,
  id,
  className,
}: DatePickerProps) {
  return (
    <div id={id} className={cn("space-y-2", className)}>
      <ThaiDayPicker
        mode="single"
        selected={date}
        onSelect={onSelect}
        disabled={disabled}
        locale={th}
        month={date}
        fromMonth={minDate}
        toMonth={maxDate}
        classNames={CALENDAR_CLASSNAMES}
        numerals="latn"
      />
    </div>
  );
}

export interface PopoverDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
  id?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export function PopoverDatePicker({
  value,
  onChange,
  placeholder = "เลือกวันที่",
  disabled,
  minDate,
  maxDate,
  id,
  label,
  required,
  className,
}: PopoverDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const generatedId = React.useId();
  const inputId = id || `date-input-${generatedId}`;
  const labelId = `${inputId}-label`;
  const describedBy = `${inputId}-description`;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label
          id={labelId}
          htmlFor={inputId}
          className="block text-sm font-medium"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={inputId}
            type="button"
            aria-label={label || placeholder}
            aria-required={required}
            aria-describedby={describedBy}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              "border-border bg-background focus-visible:ring-foreground/30 flex h-12 w-full items-center gap-2.5 rounded-lg border px-4 text-left text-base font-medium",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              "hover:bg-accent hover:text-accent-foreground transition-colors",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon
              className="text-muted-foreground h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {value ? (
              <span className="text-foreground font-medium" aria-live="polite">
                {formatThaiFullDate(value)}
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DatePicker
            id={`${inputId}-picker`}
            date={value}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
            disabled={disabled}
            minDate={minDate}
            maxDate={maxDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

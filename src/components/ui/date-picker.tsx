import * as React from "react";
import {
  DayPicker as ThaiDayPicker,
  type DayButtonProps,
} from "react-day-picker";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

/**
 * react-day-picker (v10) ใส่ data-selected/data-today/data-outside ไว้บน Day cell ที่ครอบอยู่
 * ไม่ใช่บนปุ่ม — ทำให้ data-[selected]:* บน day_button ไม่มีวัน match
 * (ปุ่มจึงไม่ highlight วันที่เลือก) — override เพื่อส่ง state ลงบนปุ่มเอง
 */
function CalendarDayButton({
  day: _day,
  modifiers,
  ...buttonProps
}: DayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return (
    <button
      ref={ref}
      {...buttonProps}
      data-selected={modifiers.selected || undefined}
      data-today={modifiers.today || undefined}
      data-outside={modifiers.outside || undefined}
      data-disabled={modifiers.disabled || undefined}
    />
  );
}

const CALENDAR_CLASSNAMES = {
  root: "p-3 select-none",
  months: "flex flex-col",
  month: "relative",
  month_caption: "flex h-9 w-full items-center justify-center",
  caption_label: "text-sm font-semibold text-foreground",
  nav: "absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between",
  button_previous: cn(
    "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md",
    "border border-foreground/60 bg-background text-foreground",
    "transition-colors hover:bg-accent hover:text-accent-foreground active:scale-95",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ),
  button_next: cn(
    "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md",
    "border border-foreground/60 bg-background text-foreground",
    "transition-colors hover:bg-accent hover:text-accent-foreground active:scale-95",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ),
  month_grid: "mt-2 w-full border-collapse",
  weekdays: "flex",
  weekday: "w-9 py-1 text-center text-xs font-normal text-foreground",
  week: "mt-1 flex w-full",
  day: "relative p-0",
  day_button: cn(
    "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-sm font-normal",
    "transition-colors",
    "hover:bg-accent hover:text-accent-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "data-[selected]:bg-foreground data-[selected]:text-background",
    "data-[selected]:hover:bg-foreground/90 data-[selected]:hover:text-background",
    "data-[outside]:text-foreground/80",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-30",
  ),
  today: "ring-2 ring-primary font-bold rounded-full",
  selected: "",
  outside: "",
  disabled: "",
  hidden: "invisible",
} as const;

function formatThaiMonthCaption(month: Date): string {
  return new Intl.DateTimeFormat("th-TH-u-nu-latn", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(month);
}

function formatThaiFullDate(date?: Date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("th-TH-u-nu-latn", {
    dateStyle: "full",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

const bangkokDateKeyFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

function getBangkokDateKey(date: Date): string {
  const parts = bangkokDateKeyFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
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
        autoFocus
        selected={date}
        onSelect={onSelect}
        disabled={(day) => {
          const dayKey = getBangkokDateKey(day);
          return Boolean(
            (minDate && dayKey < getBangkokDateKey(minDate)) ||
            (maxDate && dayKey > getBangkokDateKey(maxDate)) ||
            disabled?.(day),
          );
        }}
        locale={th}
        timeZone="Asia/Bangkok"
        month={date}
        startMonth={minDate}
        endMonth={maxDate}
        classNames={CALENDAR_CLASSNAMES}
        components={{ DayButton: CalendarDayButton }}
        formatters={{ formatCaption: formatThaiMonthCaption }}
        labels={{
          labelGrid: (month) => formatThaiMonthCaption(month),
          labelNav: () => "นำทางปฏิทิน",
          labelNext: () => "ไปเดือนถัดไป",
          labelPrevious: () => "ไปเดือนก่อนหน้า",
          labelDayButton: (day, modifiers) => {
            const label = formatThaiFullDate(day);
            const withToday = modifiers.today ? `วันนี้ ${label}` : label;
            return modifiers.selected ? `${withToday} เลือกแล้ว` : withToday;
          },
        }}
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
  labelClassName?: string;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
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
  labelClassName,
  required,
  className,
  triggerClassName,
}: PopoverDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const generatedId = React.useId();
  const inputId = id || `date-input-${generatedId}`;
  const labelId = `${inputId}-label`;
  const valueId = `${inputId}-value`;
  const describedBy = `${inputId}-description`;
  const accessibleValue = value ? formatThaiFullDate(value) : placeholder;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label
          id={labelId}
          htmlFor={inputId}
          className={cn(
            "text-foreground block text-sm font-medium",
            labelClassName,
          )}
        >
          {label}{" "}
          {required && (
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={inputId}
            type="button"
            aria-labelledby={label ? `${labelId} ${valueId}` : undefined}
            aria-label={label ? undefined : accessibleValue}
            aria-describedby={required ? describedBy : undefined}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? `${inputId}-dialog` : undefined}
            className={cn(
              "border-foreground/60 bg-background text-foreground flex h-12 w-full cursor-pointer items-center gap-2.5 rounded-lg border px-4 text-left text-base font-medium",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              "hover:bg-accent hover:text-accent-foreground transition-colors",
              triggerClassName,
            )}
          >
            <CalendarIcon
              className="text-muted-foreground h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span className="font-medium" aria-hidden="true">
              {accessibleValue}
            </span>
            <span id={valueId} className="sr-only">
              {accessibleValue}
            </span>
          </button>
        </PopoverTrigger>
        {required && (
          <span id={describedBy} className="sr-only">
            จำเป็นต้องเลือกวันที่
          </span>
        )}
        <PopoverContent
          id={`${inputId}-dialog`}
          aria-label={label ? `ปฏิทิน${label}` : "ปฏิทินเลือกวันที่"}
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

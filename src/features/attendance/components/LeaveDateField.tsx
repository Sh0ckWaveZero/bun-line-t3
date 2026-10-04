// src/features/attendance/components/LeaveDateField.tsx
"use client";
import { DayPicker as ThaiDayPicker } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CALENDAR_CLASSNAMES } from "@/features/attendance/constants/leave-form";
import {
  formatDateToStr,
  formatThaiFullDate,
  formatThaiMonthCaption,
  parseDateStr,
} from "@/features/attendance/helpers/leave-date";

interface LeaveDateFieldProps {
  date: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDate: (dateStr: string) => void;
}

/** ฟิลด์เลือกวันที่ลา (Popover + ThaiDayPicker) */
export const LeaveDateField = ({
  date,
  open,
  onOpenChange,
  onSelectDate,
}: LeaveDateFieldProps) => {
  return (
    <div id="leave-date-field" className="space-y-1.5">
      <Label htmlFor="leave-date-trigger" className="text-sm font-medium">
        วันที่ลา
      </Label>

      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            id="leave-date-trigger"
            type="button"
            aria-label={`วันที่ลาที่เลือก: ${formatThaiFullDate(date)} กดเพื่อเปลี่ยน`}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-controls="leave-date-popover"
            className="border-input bg-background focus-visible:ring-ring flex h-10 w-full items-center gap-2.5 rounded-md border px-3 text-left text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <CalendarIcon
              className="text-muted-foreground h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span className="text-foreground font-medium">
              {formatThaiFullDate(date)}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          id="leave-date-popover"
          role="dialog"
          aria-label="เลือกวันที่ลา"
          className="w-auto p-0"
          align="start"
          sideOffset={4}
        >
          <ThaiDayPicker
            id="leave-date-calendar"
            mode="single"
            selected={parseDateStr(date)}
            onSelect={(day) => {
              if (day) {
                onSelectDate(formatDateToStr(day));
                onOpenChange(false);
              }
            }}
            classNames={CALENDAR_CLASSNAMES}
            formatters={{ formatCaption: formatThaiMonthCaption }}
            numerals="latn"
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

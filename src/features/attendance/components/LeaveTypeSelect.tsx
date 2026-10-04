// src/features/attendance/components/LeaveTypeSelect.tsx
"use client";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { LEAVE_TYPES } from "@/features/attendance/constants/leave-form";
import type { LeaveTypeValue } from "@/features/attendance/constants/leave-form";

interface LeaveTypeSelectProps {
  value: LeaveTypeValue;
  onChange: (value: LeaveTypeValue) => void;
}

/** ตัวเลือกประเภทวันลา (radiogroup) */
export const LeaveTypeSelect = ({ value, onChange }: LeaveTypeSelectProps) => {
  return (
    <div id="leave-type-field" className="space-y-2">
      <Label
        id="leave-type-label"
        htmlFor="leave-type-grid"
        className="text-sm font-medium"
      >
        ประเภทวันลา
      </Label>
      <div
        id="leave-type-grid"
        role="radiogroup"
        aria-labelledby="leave-type-label"
        className="grid grid-cols-2 gap-2"
      >
        {LEAVE_TYPES.map((lt) => {
          const Icon = lt.icon;
          const isActive = value === lt.value;
          return (
            <button
              key={lt.value}
              id={`leave-type-${lt.value}`}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(lt.value)}
              className={cn(
                "bg-muted/30 flex items-center gap-3 rounded-xl border-2 p-3 text-left",
                "transition-colors duration-150",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                isActive
                  ? "border-primary"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div
                className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                aria-hidden="true"
              >
                <Icon className="text-muted-foreground h-5 w-5" />
              </div>
              <span className="text-foreground text-sm font-medium">
                {lt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import type { RefObject } from "react";
import {
  Controller,
  type Control,
  type UseFormClearErrors,
} from "react-hook-form";
import { CalendarPlus, Clock, Home, MapPin } from "lucide-react";
import type {
  DayEventFormValues,
  DayEventType,
} from "@/features/calendar/lib/day-event-form";

const EVENT_TYPES: {
  value: DayEventType;
  label: string;
  icon: typeof Clock;
}[] = [
  { value: "leave", label: "ลางาน", icon: Clock },
  { value: "wfh", label: "WFH", icon: Home },
  { value: "onsite", label: "On Site", icon: MapPin },
  { value: "holiday", label: "วันหยุด", icon: CalendarPlus },
];

interface DayEventModalTabsProps {
  control: Control<DayEventFormValues, undefined, DayEventFormValues>;
  clearErrors: UseFormClearErrors<DayEventFormValues>;
  movePillTo: (tab: HTMLElement, animate: boolean) => void;
  snapPanelHeight: (type?: DayEventType) => void;
  tabsBarRef: RefObject<HTMLDivElement | null>;
  pillRef: RefObject<HTMLSpanElement | null>;
}

/** Type Switcher — pill เลื่อนตามแท็บ (transitions.dev tabs sliding) */
export function DayEventModalTabs({
  control,
  clearErrors,
  movePillTo,
  snapPanelHeight,
  tabsBarRef,
  pillRef,
}: DayEventModalTabsProps) {
  return (
    <Controller
      control={control}
      name="eventType"
      render={({ field }) => (
        <div
          ref={tabsBarRef}
          className="t-tabs mb-4"
          role="tablist"
          aria-label="เลือกประเภทกิจกรรม"
        >
          <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
          {EVENT_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = field.value === type.value;
            return (
              <button
                key={type.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={(e) => {
                  field.onChange(type.value);
                  clearErrors(["year", "nameThai", "nameEnglish"]);
                  movePillTo(e.currentTarget, true);
                  snapPanelHeight(type.value);
                }}
                className="t-tab"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {type.label}
              </button>
            );
          })}
        </div>
      )}
    />
  );
}

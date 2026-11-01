import type { ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  DayEventFormValues,
  DayEventType,
} from "@/features/calendar/lib/day-event-form";

const LEAVE_TYPE_OPTIONS = [
  { value: "personal", label: "ลากิจ" },
  { value: "sick", label: "ลาป่วย" },
  { value: "vacation", label: "ลาพักผ่อน" },
];

const HOLIDAY_TYPE_OPTIONS = [
  { value: "national", label: "วันหยุดราชการ" },
  { value: "royal", label: "วันหยุดเกี่ยวกับราชวงศ์" },
  { value: "religious", label: "วันหยุดศาสนาจาร" },
  { value: "special", label: "วันหยุดพิเศษ" },
];

const inputClass = cn(
  "w-full rounded-md border px-3 py-2",
  "border-input bg-background text-foreground",
  // focus = เปลี่ยนสีขอบเป็นสี ring เท่านั้น ไม่ใส่ ring เพื่อไม่ให้ขอบดูหนาทึบ
  // (input/textarea เป็น text-entry — :focus-visible match ตั้งแต่คลิกเมาส์ ใช้แยกเมาส์/คีย์บอร์ดไม่ได้)
  "focus:border-ring focus:outline-none",
);

type PanelControl = Control<DayEventFormValues, undefined, DayEventFormValues>;
type PanelRegister = UseFormRegister<DayEventFormValues>;
type PanelErrors = FieldErrors<DayEventFormValues>;

/** แผงของแท็บหนึ่งแท็บ — ทุกแท็บ mounted ค้างไว้ สลับด้วย data-active + inert */
function TabPanel({
  type,
  active,
  className,
  children,
}: {
  type: DayEventType;
  active: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("t-tabs-panel", className)}
      data-type={type}
      data-active={active}
      inert={!active}
    >
      {children}
    </div>
  );
}

export function DayEventLeavePanel({
  control,
  register,
  active,
}: {
  control: PanelControl;
  register: PanelRegister;
  active: boolean;
}) {
  return (
    <TabPanel type="leave" active={active} className="space-y-4">
      {/* Leave Type */}
      <div>
        <label
          htmlFor="day-event-leave-type"
          className="mb-1 block text-sm font-medium"
        >
          ประเภทวันลา <span className="text-destructive">*</span>
        </label>
        <Controller
          control={control}
          name="leaveType"
          render={({ field }) => (
            <Select
              id="day-event-leave-type"
              value={field.value}
              onValueChange={field.onChange}
              options={LEAVE_TYPE_OPTIONS}
            />
          )}
        />
      </div>

      {/* Reason */}
      <div>
        <label
          htmlFor="day-event-leave-reason"
          className="mb-1 block text-sm font-medium"
        >
          เหตุผล (ถ้ามี)
        </label>
        <textarea
          id="day-event-leave-reason"
          placeholder="ระบุเหตุผลการลางาน..."
          rows={3}
          {...register("reason")}
          className={cn(inputClass, "min-h-24 resize-none")}
        />
      </div>
    </TabPanel>
  );
}

export function DayEventWfhPanel({
  register,
  active,
}: {
  register: PanelRegister;
  active: boolean;
}) {
  return (
    <TabPanel type="wfh" active={active}>
      <label
        htmlFor="day-event-note-wfh"
        className="mb-1 block text-sm font-medium"
      >
        หมายเหตุ (ถ้ามี)
      </label>
      <textarea
        id="day-event-note-wfh"
        placeholder="ระบุหมายเหตุ เช่น ทำงานจากบ้าน..."
        rows={2}
        {...register("noteWfh")}
        className={cn(inputClass, "min-h-20 resize-none")}
      />
    </TabPanel>
  );
}

export function DayEventOnsitePanel({
  register,
  active,
}: {
  register: PanelRegister;
  active: boolean;
}) {
  return (
    <TabPanel type="onsite" active={active}>
      <label
        htmlFor="day-event-note-onsite"
        className="mb-1 block text-sm font-medium"
      >
        หมายเหตุ (ถ้ามี)
      </label>
      <textarea
        id="day-event-note-onsite"
        placeholder="ระบุหมายเหตุ เช่น ทำงานที่ออฟฟิศ/ไซต์ลูกค้า..."
        rows={2}
        {...register("noteOnsite")}
        className={cn(inputClass, "min-h-20 resize-none")}
      />
    </TabPanel>
  );
}

export function DayEventHolidayPanel({
  control,
  register,
  errors,
  yearValue,
  active,
}: {
  control: PanelControl;
  register: PanelRegister;
  errors: PanelErrors;
  yearValue: string | undefined;
  active: boolean;
}) {
  return (
    <TabPanel type="holiday" active={active} className="space-y-4">
      {/* Year */}
      <div>
        <label
          htmlFor="day-event-holiday-year"
          className="mb-1 block text-sm font-medium"
        >
          ปี ค.ศ. <span className="text-destructive">*</span>
        </label>
        <input
          id="day-event-holiday-year"
          type="number"
          inputMode="numeric"
          aria-invalid={Boolean(errors.year)}
          aria-describedby={
            errors.year ? "day-event-holiday-year-error" : undefined
          }
          className={cn(
            inputClass,
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          )}
          {...register("year")}
        />
        {errors.year && (
          <p
            id="day-event-holiday-year-error"
            role="alert"
            className="text-destructive mt-1 text-xs"
          >
            {errors.year.message}
          </p>
        )}
        <p className="text-muted-foreground mt-1 text-xs">
          ปี พ.ศ.{" "}
          {yearValue && !Number.isNaN(Number(yearValue))
            ? Number(yearValue) + 543
            : "—"}{" "}
          — ตั้งค่าจากวันที่ที่เลือกโดยอัตโนมัติ
        </p>
      </div>

      {/* Name Thai */}
      <div>
        <label
          htmlFor="day-event-holiday-name-thai"
          className="mb-1 block text-sm font-medium"
        >
          ชื่อวันหยุด (ไทย) <span className="text-destructive">*</span>
        </label>
        <input
          id="day-event-holiday-name-thai"
          type="text"
          placeholder="เช่น: วันขึ้นปีใหม่"
          aria-invalid={Boolean(errors.nameThai)}
          {...register("nameThai")}
          className={inputClass}
        />
        {errors.nameThai && (
          <p role="alert" className="text-destructive mt-1 text-xs">
            {errors.nameThai.message}
          </p>
        )}
      </div>

      {/* Name English */}
      <div>
        <label
          htmlFor="day-event-holiday-name-english"
          className="mb-1 block text-sm font-medium"
        >
          ชื่อวันหยุด (อังกฤษ){" "}
          <span className="text-destructive">*</span>
        </label>
        <input
          id="day-event-holiday-name-english"
          type="text"
          placeholder="E.g.: New Year's Day"
          aria-invalid={Boolean(errors.nameEnglish)}
          {...register("nameEnglish")}
          className={inputClass}
        />
        {errors.nameEnglish && (
          <p role="alert" className="text-destructive mt-1 text-xs">
            {errors.nameEnglish.message}
          </p>
        )}
      </div>

      {/* Holiday Type */}
      <div>
        <label
          htmlFor="day-event-holiday-type"
          className="mb-1 block text-sm font-medium"
        >
          ประเภท <span className="text-destructive">*</span>
        </label>
        <Controller
          control={control}
          name="holidayType"
          render={({ field }) => (
            <Select
              id="day-event-holiday-type"
              value={field.value}
              onValueChange={field.onChange}
              options={HOLIDAY_TYPE_OPTIONS}
            />
          )}
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="day-event-holiday-description"
          className="mb-1 block text-sm font-medium"
        >
          รายละเอียด (ถ้ามี)
        </label>
        <textarea
          id="day-event-holiday-description"
          placeholder="ระบุรายละเอียดเพิ่มเติม..."
          rows={2}
          {...register("description")}
          className={cn(inputClass, "min-h-20 resize-none")}
        />
      </div>
    </TabPanel>
  );
}

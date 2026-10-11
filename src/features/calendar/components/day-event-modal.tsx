import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid, parse as parseDateString } from "date-fns";
import {
  X,
  Clock,
  Home,
  MapPin,
  CalendarPlus,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PopoverDatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { useDialogExit } from "@/features/calendar/hooks/useDialogExit";
import {
  dayEventFormSchema,
  type DayEventFormValues,
  type DayEventSubmit,
  type DayEventType,
} from "@/features/calendar/lib/day-event-form";
import { cn } from "@/lib/utils";

export type {
  DayEventSubmit,
  DayEventType,
} from "@/features/calendar/lib/day-event-form";

interface DayEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DayEventSubmit) => void;
  selectedDate?: string;
  initialType?: DayEventType;
}

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

const TITLES: Record<DayEventType, string> = {
  leave: "แจ้งลางาน",
  wfh: "ทำงานจากที่บ้าน (WFH)",
  onsite: "ทำงานที่ไซต์ (On Site)",
  holiday: "เพิ่มวันหยุด",
};

const HELP_TEXTS: Record<DayEventType, string> = {
  leave: "วันลาจะแสดงในปฏิทินหลังจากบันทึกเรียบร้อย",
  wfh: "วันที่ทำ WFH จะแสดงในปฏิทิน และจะไม่ได้รับการแจ้งเตือนเช็คอินในวันนั้น",
  onsite:
    "วันที่ทำ On Site จะแสดงในปฏิทินเพื่อบอกว่าวันนั้นทำงานที่ออฟฟิศ/ไซต์",
  holiday: "วันหยุดจะแสดงในปฏิทินของทุกคน",
};

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

function parseDateStr(str: string): Date | undefined {
  if (!str) return undefined;
  const parsed = parseDateString(str, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

function formatDateToStr(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function DayEventModal({
  isOpen,
  onClose,
  onSubmit,
  selectedDate,
  initialType = "leave",
}: DayEventModalProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    clearErrors,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DayEventFormValues, undefined, DayEventFormValues>({
    resolver: zodResolver(dayEventFormSchema),
    defaultValues: {
      eventType: initialType,
      date: selectedDate ? (parseDateStr(selectedDate) ?? null) : null,
      leaveType: "personal",
      reason: "",
      noteWfh: "",
      noteOnsite: "",
      nameThai: "",
      nameEnglish: "",
      holidayType: "national",
      year: selectedDate ? (selectedDate.split("-")[0] ?? "") : "",
      description: "",
    },
  });

  const tabsBarRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLSpanElement | null>(null);
  const panelsRef = useRef<HTMLDivElement | null>(null);

  // tabs-sliding (transitions.dev) — JS เขียนตำแหน่งแท็บ active ลง pill inline, CSS เป็นคน tween
  const movePillTo = useCallback((tab: HTMLElement, animate: boolean) => {
    const pill = pillRef.current;
    if (!pill) return;
    if (!animate) {
      // snap ก่อนเฟรมแรก/หลัง resize — ระงับ transition ชั่วคราวกัน pill เลื่อนโผล่
      const prevTransition = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
      void pill.offsetWidth;
      pill.style.transition = prevTransition;
    } else {
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
    }
  }, []);

  const movePillToSelected = useCallback(
    (animate: boolean) => {
      const selected = tabsBarRef.current?.querySelector<HTMLButtonElement>(
        '.t-tab[aria-selected="true"]',
      );
      if (selected) movePillTo(selected, animate);
    },
    [movePillTo],
  );

  // วัดความสูงของแท็บที่ต้องการแล้วเขียน height ให้ container — CSS tween กันการ์ดเด้งขึ้นลง
  const snapPanelHeight = useCallback((type?: DayEventType) => {
    const container = panelsRef.current;
    if (!container) return;
    const panel = container.querySelector<HTMLElement>(
      type
        ? `.t-tabs-panel[data-type="${type}"]`
        : '.t-tabs-panel[data-active="true"]',
    );
    if (panel) {
      container.style.height = `${panel.offsetHeight}px`;
    }
  }, []);

  // ครั้งแรก snap ทันทีก่อน paint — การสลับแท็บเลื่อนแบบ animate ที่ click handler เลย
  useLayoutEffect(() => {
    movePillToSelected(false);
    snapPanelHeight();
  }, [movePillToSelected, snapPanelHeight]);

  useEffect(() => {
    const handleResize = () => {
      movePillToSelected(false);
      snapPanelHeight();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [movePillToSelected, snapPanelHeight]);

  const { isClosing, requestClose } = useDialogExit(onClose);

  const eventType = useWatch({ control, name: "eventType" });
  const yearValue = useWatch({ control, name: "year" });

  const submit = handleSubmit(async (values) => {
    clearErrors("root");
    if (!values.date) return;

    const dateStr = formatDateToStr(values.date);
    let payload: DayEventSubmit;
    if (values.eventType === "leave") {
      payload = {
        kind: "leave",
        date: dateStr,
        leaveType: values.leaveType,
        reason: values.reason || undefined,
      };
    } else if (values.eventType === "wfh") {
      payload = {
        kind: "wfh",
        date: dateStr,
        note: values.noteWfh || undefined,
      };
    } else if (values.eventType === "onsite") {
      payload = {
        kind: "onsite",
        date: dateStr,
        note: values.noteOnsite || undefined,
      };
    } else {
      payload = {
        kind: "holiday",
        date: dateStr,
        nameThai: values.nameThai.trim(),
        nameEnglish: values.nameEnglish.trim(),
        holidayType: values.holidayType,
        year: Number(values.year),
        description: values.description || undefined,
      };
    }

    try {
      await onSubmit(payload);
      reset();
      requestClose();
    } catch (err) {
      setError("root", {
        message:
          err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่",
      });
    }
  });

  if (!isOpen) return null;

  const inputClass = cn(
    "w-full rounded-md border px-3 py-2",
    "border-input bg-background text-foreground",
    // focus = เปลี่ยนสีขอบเป็นสี ring เท่านั้น ไม่ใส่ ring เพื่อไม่ให้ขอบดูหนาทึบ
    // (input/textarea เป็น text-entry — :focus-visible match ตั้งแต่คลิกเมาส์ ใช้แยกเมาส์/คีย์บอร์ดไม่ได้)
    "focus:border-ring focus:outline-none",
  );

  return (
    <dialog
      open
      className={cn(
        "t-modal-dialog fixed inset-0 z-50 m-0 flex max-h-none max-w-none items-center justify-center border-0 bg-black/50 p-4 text-inherit shadow-none",
        isClosing && "is-closing",
      )}
      style={{
        /* UA ของ <dialog> บังคับ width/height: fit-content — ต้องบังคับเต็มจอ
           ไม่งั้น overlay จะยึดมุมซ้ายบนขนาดเท่าเนื้อหา */
        width: "100%",
        height: "100%",
      }}
      aria-modal="true"
      aria-labelledby="day-event-modal-title"
    >
      <Card className="t-modal-card bg-card border-border max-h-[90vh] w-full max-w-md overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-primary h-5 w-5" aria-hidden="true" />
            <h2 id="day-event-modal-title" className="text-xl font-bold">
              {TITLES[eventType]}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={requestClose}
            aria-label="ปิดหน้าต่าง"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Type Switcher — pill เลื่อนตามแท็บ (transitions.dev tabs sliding) */}
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

        {/* noValidate — validate ด้วย zod ผ่าน RHF resolver แทน native constraint validation
            (ฟิลด์ทุกแท็บ mounted ค้างไว้ ฟิลด์ที่ซ่อนอยู่จะไม่ถูกเรียกต้องกรอก) */}
        <form onSubmit={submit} noValidate className="space-y-4">
          {/* Date Selection with DatePicker */}
          <div>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <PopoverDatePicker
                  id="day-event-date"
                  label="วันที่"
                  value={field.value ?? undefined}
                  onChange={(date) => {
                    field.onChange(date ?? null);
                    if (date) {
                      setValue("year", String(date.getFullYear()));
                    }
                  }}
                  placeholder="เลือกวันที่"
                />
              )}
            />
            {errors.date && (
              <p
                id="day-event-date-error"
                role="alert"
                className="text-destructive mt-1 text-xs"
              >
                {errors.date.message}
              </p>
            )}
          </div>

          {/* Panel content — ทุกแท็บ mounted ค้างไว้ สลับแบบ crossfade + animate ความสูง */}
          <div ref={panelsRef} className="t-tabs-panels">
            <div
              className="t-tabs-panel space-y-4"
              data-type="leave"
              data-active={eventType === "leave"}
              inert={eventType !== "leave"}
            >
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
            </div>

            <div
              className="t-tabs-panel"
              data-type="wfh"
              data-active={eventType === "wfh"}
              inert={eventType !== "wfh"}
            >
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
            </div>

            <div
              className="t-tabs-panel"
              data-type="onsite"
              data-active={eventType === "onsite"}
              inert={eventType !== "onsite"}
            >
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
            </div>

            <div
              className="t-tabs-panel space-y-4"
              data-type="holiday"
              data-active={eventType === "holiday"}
              inert={eventType !== "holiday"}
            >
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
            </div>
          </div>

          {/* Server error */}
          {errors.root?.message && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
            >
              {errors.root.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={requestClose}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-muted-foreground text-xs" role="note">
            💡 {HELP_TEXTS[eventType]}
          </div>
        </form>
      </Card>
    </dialog>
  );
}

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PopoverDatePicker } from "@/components/ui/date-picker";
import {
  DayEventHolidayPanel,
  DayEventLeavePanel,
  DayEventOnsitePanel,
  DayEventWfhPanel,
} from "@/features/calendar/components/day-event-modal-panels";
import { DayEventModalTabs } from "@/features/calendar/components/day-event-modal-tabs";
import { useDialogExit } from "@/features/calendar/hooks/useDialogExit";
import {
  dayEventFormSchema,
  type DayEventFormValues,
  type DayEventSubmit,
  type DayEventType,
} from "@/features/calendar/lib/day-event-form";
import {
  buildDayEventPayload,
  formatDateToStr,
  parseDateStr,
} from "@/features/calendar/lib/day-event-modal";
import { cn } from "@/lib/utils";

export type {
  DayEventSubmit,
  DayEventType,
} from "@/features/calendar/lib/day-event-form";

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

interface DayEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DayEventSubmit) => void;
  selectedDate?: string;
  initialType?: DayEventType;
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

  // handler ล่าสุดผ่าน ref — ผูก resize listener ครั้งเดียว ไม่ re-subscribe
  const resizeSyncRef = useRef<() => void>(() => {});
  useEffect(() => {
    resizeSyncRef.current = () => {
      movePillToSelected(false);
      snapPanelHeight();
    };
  });

  useEffect(() => {
    const handleResize = () => resizeSyncRef.current();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { isClosing, requestClose } = useDialogExit(onClose);

  const eventType = useWatch({ control, name: "eventType" });
  const yearValue = useWatch({ control, name: "year" });

  const submit = handleSubmit(async (values) => {
    clearErrors("root");
    if (!values.date) return;

    const dateStr = formatDateToStr(values.date);
    const payload = buildDayEventPayload(values, dateStr);

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

        <DayEventModalTabs
          control={control}
          clearErrors={clearErrors}
          movePillTo={movePillTo}
          snapPanelHeight={snapPanelHeight}
          tabsBarRef={tabsBarRef}
          pillRef={pillRef}
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
            <DayEventLeavePanel
              control={control}
              register={register}
              active={eventType === "leave"}
            />

            <DayEventWfhPanel register={register} active={eventType === "wfh"} />

            <DayEventOnsitePanel
              register={register}
              active={eventType === "onsite"}
            />

            <DayEventHolidayPanel
              control={control}
              register={register}
              errors={errors}
              yearValue={yearValue}
              active={eventType === "holiday"}
            />
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

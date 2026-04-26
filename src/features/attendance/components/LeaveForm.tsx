// src/components/attendance/LeaveForm.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { DayPicker as ThaiDayPicker } from "react-day-picker/buddhist";
import { useToast } from "@/components/common/ToastProvider";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  Cake,
  Palmtree,
  Stethoscope,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveRecord {
  id: string;
  date: string;
  type: string;
  reason?: string | null;
  createdAt: string;
}

interface LeaveFormProps {
  onSubmit?: () => void;
}

// ─── Leave type config ────────────────────────────────────────────────────────

const LEAVE_TYPES = [
  { value: "personal", label: "ลากิจ",    icon: User },
  { value: "sick",     label: "ลาป่วย",   icon: Stethoscope },
  { value: "vacation", label: "ลาพักร้อน", icon: Palmtree },
  { value: "birthday", label: "เดือนเกิด", icon: Cake },
] as const;

type LeaveTypeValue = (typeof LEAVE_TYPES)[number]["value"];

const LEAVE_TYPE_MAP = Object.fromEntries(
  LEAVE_TYPES.map((t) => [t.value, t]),
) as Record<string, (typeof LEAVE_TYPES)[number]>;

// ─── Calendar classNames (Tailwind override, bypasses default react-day-picker CSS) ───

const CALENDAR_CLASSNAMES = {
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

// ─── Date helpers ─────────────────────────────────────────────────────────────

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

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
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

/** แปลง "yyyy-mm-dd" → Date object (local time zone) */
function parseDateStr(str: string): Date | undefined {
  if (!str) return undefined;
  const [yearStr, monthStr, dayStr] = str.split("-");
  const year = parseInt(yearStr ?? "", 10);
  const month = parseInt(monthStr ?? "", 10);
  const day = parseInt(dayStr ?? "", 10);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

/** แปลง Date → "yyyy-mm-dd" */
function formatDateToStr(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** แสดงวันที่แบบเต็มภาษาไทย: "วันพฤหัสบดีที่ 18 เมษายน 2569" */
function formatThaiFullDate(dateStr: string): string {
  const d = parseDateStr(dateStr);
  if (!d) return "เลือกวันที่ลา";
  const weekday = THAI_WEEKDAYS[d.getDay()] ?? "";
  const day = d.getDate();
  const buddhistYear = d.getFullYear() + 543;
  return `วัน${weekday}ที่ ${day} ${THAI_MONTHS_LONG[d.getMonth()] ?? ""} ${buddhistYear}`;
}

/** แสดงเดือนปีภาษาไทยสำหรับ history navigation: "เมษายน 2569" */
function getThaiMonthLabel(yyyyMm: string): string {
  const [yearStr, monthStr] = yyyyMm.split("-");
  const year = parseInt(yearStr ?? "0", 10);
  const monthIndex = parseInt(monthStr ?? "1", 10) - 1;
  return `${THAI_MONTHS_LONG[monthIndex] ?? ""} ${year + 543}`;
}

/** แสดงวันที่ย่อภาษาไทยสำหรับ history list: "18 เม.ย. 2569" */
function formatThaiShortDate(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr ?? "0", 10);
  const monthIndex = parseInt(monthStr ?? "1", 10) - 1;
  return `${dayStr} ${THAI_MONTHS_SHORT[monthIndex] ?? ""} ${year + 543}`;
}

function getTodayStr(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function getCurrentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(yyyyMm: string, delta: number): string {
  const [yearStr, monthStr] = yyyyMm.split("-");
  const d = new Date(
    parseInt(yearStr ?? "0", 10),
    parseInt(monthStr ?? "1", 10) - 1 + delta,
    1,
  );
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LeaveForm = ({ onSubmit }: LeaveFormProps) => {
  const todayStr = getTodayStr();
  const currentMonthStr = getCurrentMonthStr();

  // Form state
  const [date, setDate] = useState(todayStr);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [type, setType] = useState<LeaveTypeValue>("personal");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // History state
  const [historyMonth, setHistoryMonth] = useState(currentMonthStr);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { showToast } = useToast();
  const { status } = useSession();

  // ─── Fetch leave history ──────────────────────────────────────────────────

  const fetchLeaves = useCallback(
    async (month: string) => {
      if (status !== "authenticated") return;
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/leave?month=${month}`);
        const data: { success: boolean; leaves?: LeaveRecord[] } =
          await res.json();
        if (data.success) setLeaves(data.leaves ?? []);
      } catch {
        // silent — ไม่กระทบ form หลัก
      } finally {
        setHistoryLoading(false);
      }
    },
    [status],
  );

  useEffect(() => {
    void fetchLeaves(historyMonth);
  }, [historyMonth, fetchLeaves]);

  // ─── Auth redirect ────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") {
      showToast({ title: "กรุณาเข้าสู่ระบบ", type: "error" });
      setTimeout(() => {
        if (typeof window !== "undefined") {
          const callbackUrl = window.location.pathname + window.location.search;
          window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        }
      }, 1200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "authenticated") {
      showToast({ title: "กรุณาเข้าสู่ระบบ", type: "error" });
      return;
    }
    if (!date) {
      showToast({ title: "กรุณาเลือกวันที่ลา", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, type, reason }),
      });
      const isJson = res.headers
        .get("content-type")
        ?.includes("application/json");
      const data: { success?: boolean; message?: string } = isJson
        ? await res.json().catch(() => ({}))
        : {};

      if (!res.ok || data?.success === false) {
        const msg =
          typeof data.message === "string"
            ? data.message
            : "ไม่สามารถบันทึกวันลาได้ กรุณาลองใหม่อีกครั้ง";
        showToast({ title: msg, type: "error" });
        return;
      }

      showToast({ title: "บันทึกวันลาสำเร็จ", type: "success" });
      setDate(todayStr);
      setType("personal");
      setReason("");

      const submittedMonth = date.slice(0, 7);
      if (submittedMonth !== historyMonth) {
        setHistoryMonth(submittedMonth);
      } else {
        void fetchLeaves(submittedMonth);
      }

      onSubmit?.();
    } catch {
      showToast({
        title: "ไม่สามารถบันทึกวันลาได้ กรุณาลองใหม่อีกครั้ง",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div id="leave-page" className="container mx-auto max-w-lg px-4 py-8">
      <div className="space-y-6">
        {/* ── Header ── */}
        <div id="leave-header">
          <h1
            id="leave-title"
            className="text-foreground text-2xl font-bold tracking-tight"
          >
            แจ้งวันลา
          </h1>
          <p id="leave-subtitle" className="text-muted-foreground mt-1 text-sm">
            ระบบจะสร้างบันทึกการทำงานให้อัตโนมัติเมื่อบันทึกวันลา
          </p>
        </div>

        {/* ── Form Card ── */}
        <Card id="leave-form-card" className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle
              id="leave-form-title"
              className="flex items-center gap-2 text-base"
            >
              <CalendarIcon
                className="text-primary h-4 w-4"
                aria-hidden="true"
              />
              ข้อมูลการลา
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              id="leave-form"
              onSubmit={handleSubmit}
              className="space-y-5"
              noValidate
            >
              {/* ── วันที่ลา ── */}
              <div id="leave-date-field" className="space-y-1.5">
                <Label
                  htmlFor="leave-date-trigger"
                  className="text-sm font-medium"
                >
                  วันที่ลา
                </Label>

                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      id="leave-date-trigger"
                      type="button"
                      aria-label={`วันที่ลาที่เลือก: ${formatThaiFullDate(date)} กดเพื่อเปลี่ยน`}
                      aria-expanded={pickerOpen}
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
                          setDate(formatDateToStr(day));
                          setPickerOpen(false);
                        }
                      }}
                      classNames={CALENDAR_CLASSNAMES}
                      numerals="latn"
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* ── ประเภทวันลา ── */}
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
                    const isActive = type === lt.value;
                    return (
                      <button
                        key={lt.value}
                        id={`leave-type-${lt.value}`}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setType(lt.value)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border-2 bg-muted/30 p-3 text-left",
                          "transition-all duration-150",
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

              {/* ── เหตุผล ── */}
              <div id="leave-reason-field" className="space-y-1.5">
                <Label htmlFor="leave-reason" className="text-sm font-medium">
                  เหตุผล{" "}
                  <span className="text-muted-foreground font-normal">
                    (ถ้ามี)
                  </span>
                </Label>
                <textarea
                  id="leave-reason"
                  name="leave-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="ระบุเหตุผลเพิ่มเติม..."
                  aria-label="เหตุผลการลา (ไม่บังคับ)"
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
                />
              </div>

              {/* ── Submit ── */}
              <Button
                id="leave-submit"
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                    บันทึกวันลา
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Info Box ── */}
        <div
          id="leave-info"
          role="note"
          className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30"
        >
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400"
            aria-hidden="true"
          />
          <p
            id="leave-info-text"
            className="text-sm leading-relaxed text-blue-700 dark:text-blue-300"
          >
            เมื่อบันทึกวันลา ระบบจะสร้างบันทึกการทำงานให้อัตโนมัติ โดยกำหนด
            เข้างาน 08:00 น. — ออกงาน 17:00 น. (เวลาประเทศไทย)
          </p>
        </div>

        {/* ── Leave History ── */}
        <Card id="leave-history" className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle
                id="leave-history-title"
                className="flex items-center gap-2 text-base"
              >
                <ClipboardList
                  className="text-primary h-4 w-4"
                  aria-hidden="true"
                />
                ประวัติการลา
              </CardTitle>

              {/* Month navigation */}
              <nav
                id="leave-history-nav"
                aria-label="นำทางเดือน"
                className="flex items-center gap-0.5"
              >
                <button
                  id="leave-history-prev"
                  type="button"
                  onClick={() => setHistoryMonth((m) => shiftMonth(m, -1))}
                  aria-label="เดือนก่อนหน้า"
                  className="hover:bg-accent focus-visible:ring-ring flex h-7 w-7 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>

                <span
                  id="leave-history-month"
                  aria-live="polite"
                  aria-atomic="true"
                  className="min-w-[112px] text-center text-sm font-medium tabular-nums"
                >
                  {getThaiMonthLabel(historyMonth)}
                </span>

                <button
                  id="leave-history-next"
                  type="button"
                  onClick={() => setHistoryMonth((m) => shiftMonth(m, 1))}
                  disabled={historyMonth >= currentMonthStr}
                  aria-label="เดือนถัดไป"
                  aria-disabled={historyMonth >= currentMonthStr}
                  className="hover:bg-accent focus-visible:ring-ring flex h-7 w-7 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </CardHeader>

          <CardContent>
            {historyLoading ? (
              <div
                id="leave-history-loading"
                role="status"
                aria-label="กำลังโหลดข้อมูลการลา"
                className="flex justify-center py-8"
              >
                <Loader2
                  className="text-muted-foreground h-5 w-5 animate-spin"
                  aria-hidden="true"
                />
              </div>
            ) : leaves.length === 0 ? (
              <div
                id="leave-history-empty"
                className="flex flex-col items-center gap-2 py-8"
              >
                <CalendarIcon
                  className="text-muted-foreground/40 h-8 w-8"
                  aria-hidden="true"
                />
                <p className="text-muted-foreground text-sm">
                  ไม่มีข้อมูลการลาในเดือนนี้
                </p>
              </div>
            ) : (
              <ul
                id="leave-history-list"
                aria-label="รายการวันลา"
                className="space-y-2"
              >
                {leaves.map((leave) => {
                  const lt = LEAVE_TYPE_MAP[leave.type];
                  const Icon = lt?.icon;
                  return (
                    <li
                      key={leave.id}
                      id={`leave-history-item-${leave.id}`}
                      className="bg-card hover:bg-accent/30 flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {Icon ? (
                          <div
                            className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            aria-hidden="true"
                          >
                            <Icon className="text-muted-foreground h-4 w-4" />
                          </div>
                        ) : null}
                        <div>
                          <p className="text-sm font-medium">
                            {formatThaiShortDate(leave.date)}
                          </p>
                          {leave.reason ? (
                            <p className="text-muted-foreground mt-0.5 text-xs">
                              {leave.reason}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <Badge variant="outline" className="shrink-0 text-xs">
                        {lt?.label ?? leave.type}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Summary footer */}
            {!historyLoading && leaves.length > 0 && (
              <p
                id="leave-history-summary"
                className="text-muted-foreground mt-3 text-right text-xs"
              >
                รวม {leaves.length} วัน
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

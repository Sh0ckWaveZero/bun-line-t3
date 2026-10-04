import { ChevronDown, ChevronUp, Coins } from "lucide-react";

interface ThaiHelpCalculatorHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
  monthlyRemaining: number;
  dailyRemaining: number;
}

/** badge "ใช้ได้/เดือน" (สีม่วงคงที่) */
function MonthlyRemainingBadge({ id, amount }: { id: string; amount: number }) {
  return (
    <div
      id={id}
      className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-violet-700 tabular-nums dark:bg-violet-400/15 dark:text-violet-400"
    >
      <span>
        ใช้ได้/เดือน ฿
        {amount.toLocaleString("th-TH", {
          maximumFractionDigits: 0,
        })}
      </span>
    </div>
  );
}

/** badge "ใช้ได้/วัน" (สีเปลี่ยนตามสิทธิ์คงเหลือ) */
function DailyRemainingBadge({ id, amount }: { id: string; amount: number }) {
  return (
    <div
      id={id}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap tabular-nums ${
        amount === 0
          ? "bg-red-500/10 text-red-600 dark:bg-red-400/15 dark:text-red-400"
          : amount < 100
            ? "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400"
            : "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400"
      }`}
    >
      <span>
        ใช้ได้/วัน ฿
        {amount.toLocaleString("th-TH", {
          maximumFractionDigits: 0,
        })}
      </span>
    </div>
  );
}

/** ปุ่ม toggle เปิด/ปิดเครื่องคำนวณ 60/40 (พร้อม badge สิทธิ์คงเหลือ) */
export function ThaiHelpCalculatorHeader({
  isOpen,
  onToggle,
  monthlyRemaining,
  dailyRemaining,
}: ThaiHelpCalculatorHeaderProps) {
  return (
    <button
      id="thai-help-toggle-btn"
      onClick={() => onToggle()}
      className="font-noto-sans-thai text-foreground hover:bg-muted/30 flex w-full flex-col px-4 py-3 text-left transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4"
    >
      {/* Row 1: icon + title + chevron */}
      <div className="flex items-center justify-between gap-3">
        <div
          id="thai-help-title-group"
          className="flex items-center gap-2.5 sm:gap-3"
        >
          <div
            id="thai-help-icon-wrapper"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 sm:h-10 sm:w-10 dark:bg-violet-400/15 dark:text-violet-400"
          >
            <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h2
              id="thai-help-heading"
              className="font-noto-sans-thai flex items-center gap-1.5 text-sm font-bold whitespace-nowrap sm:text-base"
            >
              เครื่องคำนวณสิทธิ์ 60/40
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
            </h2>
            <p
              id="thai-help-subheading"
              className="text-muted-foreground hidden text-xs font-normal sm:block"
            >
              คำนวณโครงการไทยช่วยไทย พลัส และบันทึกยอดจ่ายจริง 40% ทันที
            </p>
          </div>
        </div>
        {/* Chevron: right on mobile row 1, kept in sm+ right cluster */}
        <div
          id="thai-help-chevron-mobile"
          className="text-muted-foreground sm:hidden"
        >
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Row 2 (mobile only): badges aligned under title text */}
      <div className="mt-2 flex items-center gap-1.5 pl-[2.375rem] sm:hidden">
        <MonthlyRemainingBadge
          id="thai-help-monthly-remaining-mobile"
          amount={monthlyRemaining}
        />
        <DailyRemainingBadge
          id="thai-help-daily-remaining-mobile"
          amount={dailyRemaining}
        />
      </div>

      {/* sm+: badges + chevron on right */}
      <div className="hidden flex-shrink-0 items-center gap-2 sm:flex">
        <MonthlyRemainingBadge
          id="thai-help-monthly-remaining"
          amount={monthlyRemaining}
        />
        <DailyRemainingBadge
          id="thai-help-daily-remaining"
          amount={dailyRemaining}
        />
        <div
          id="thai-help-chevron"
          className="text-muted-foreground transition-colors"
        >
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
    </button>
  );
}

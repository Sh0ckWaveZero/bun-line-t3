import type { MonthlyCoPayStats } from "@/features/expenses/helpers/coPayStats";
import { Info } from "lucide-react";

interface ThaiHelpStatsTabProps {
  stats: MonthlyCoPayStats;
}

/** Tab สถิติเดือนนี้: การ์ดสรุปสิทธิ์ + info banner */
export function ThaiHelpStatsTab({ stats }: ThaiHelpStatsTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border-border/10 bg-card dark:bg-muted/10 rounded-xl border p-3 shadow-sm">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide">
            รัฐช่วยแล้วเดือนนี้
          </span>
          <p className="mt-1 text-lg font-extrabold text-blue-600 tabular-nums dark:text-blue-400">
            ฿{stats.totalSubsidyUsed.toFixed(2)}
          </p>
          <span className="text-muted-foreground mt-0.5 block text-xs">
            จากโควตา ฿1,000.00 / เดือน
          </span>
        </div>
        <div className="border-border/10 bg-card dark:bg-muted/10 rounded-xl border p-3 shadow-sm">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide">
            สิทธิ์คงเหลือจากรัฐ
          </span>
          <p className="mt-1 text-lg font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400">
            ฿{stats.remainingSubsidy.toFixed(2)}
          </p>
          <span className="text-muted-foreground mt-0.5 block text-xs">
            รีเซ็ตอัตโนมัติสิ้นเดือนนี้
          </span>
        </div>
        <div className="border-border/10 bg-card dark:bg-muted/10 rounded-xl border p-3 shadow-sm">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide">
            เงินคุณที่จ่ายสมทบ
          </span>
          <p className="text-foreground mt-1 text-lg font-extrabold tabular-nums">
            ฿{stats.totalUserSpent.toFixed(2)}
          </p>
          <span className="text-muted-foreground mt-0.5 block text-xs">
            บันทึกในประวัติแล้ว {stats.count} รายการ
          </span>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-lg border border-yellow-500/25 bg-yellow-500/5 p-3 text-xs leading-relaxed text-yellow-700 dark:text-yellow-400">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>
          ระบบจะค้นหาประวัติการเงินของคุณในเดือนปัจจุบันที่มีเครื่องหมายหรือหมายเหตุตัวย่อ
          เช่น <strong>#ไทยช่วยไทย</strong>, <strong>#ทชท</strong>,{" "}
          <strong>#TCT</strong>, <strong>#6040</strong>,{" "}
          <strong>#คนละครึ่ง</strong>, <strong>#KLK</strong>{" "}
          เพื่อคำนวณสิทธิ์ให้อัตโนมัติ
        </p>
      </div>
    </>
  );
}

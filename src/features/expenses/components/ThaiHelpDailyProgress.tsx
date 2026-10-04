import { CO_PAY_DAILY_MAX_SUBSIDY } from "@/features/expenses/helpers/coPayment";
import type { DailyCoPayStats } from "@/features/expenses/helpers/coPayStats";

interface ThaiHelpDailyProgressProps {
  dailyStats: DailyCoPayStats;
}

/** แถบความคืบหน้าสิทธิ์รัฐรายวัน */
export function ThaiHelpDailyProgress({
  dailyStats,
}: ThaiHelpDailyProgressProps) {
  return (
    <div className="mb-5 space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-muted-foreground">สิทธิ์รัฐรายวัน</span>
        <span className="text-muted-foreground tabular-nums">
          ฿{dailyStats.todaySubsidyUsed.toFixed(0)} / ฿
          {CO_PAY_DAILY_MAX_SUBSIDY}
        </span>
      </div>
      <div className="bg-muted/50 h-2 w-full overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-500 ${
            dailyStats.todaySubsidyUsed === 0
              ? "bg-emerald-500"
              : dailyStats.todayRemaining === 0
                ? "bg-red-500"
                : dailyStats.todayRemaining < 100
                  ? "bg-amber-500"
                  : "bg-emerald-500"
          }`}
          style={{
            width: `${Math.min((dailyStats.todaySubsidyUsed / CO_PAY_DAILY_MAX_SUBSIDY) * 100, 100)}%`,
          }}
        />
      </div>
      {dailyStats.todayTotalBill > 0 && (
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>
            ยอดรวม 100%{" "}
            <span className="text-foreground font-semibold tabular-nums">
              ฿{dailyStats.todayTotalBill.toFixed(2)}
            </span>
          </span>
          <span>
            รัฐ{" "}
            <span className="font-semibold text-blue-600 tabular-nums dark:text-blue-400">
              ฿{dailyStats.todaySubsidyUsed.toFixed(2)}
            </span>{" "}
            + คุณ{" "}
            <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
              ฿{dailyStats.todayUserSpent.toFixed(2)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

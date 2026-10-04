import { TrendingDown, TrendingUp } from "lucide-react";
import { formatTHB } from "@/features/dca/utils/format";

interface DcaPnlBadgeProps {
  pnlPercent: number | null;
  pnlValue: number | null;
}

/** ป้ายแสดงเปอร์เซ็นต์และมูลค่ากำไร/ขาดทุน */
export const DcaPnlBadge = ({ pnlPercent, pnlValue }: DcaPnlBadgeProps) => {
  if (pnlPercent === null || pnlValue === null) {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <div className="bg-muted h-2 w-2 animate-pulse rounded-full" />
        <span className="text-muted-foreground">กำลังโหลดราคา...</span>
      </div>
    );
  }

  const isProfit = pnlPercent >= 0;

  return (
    <div className="flex items-center gap-2">
      <div
        id="dca-summary-pnl-percent"
        className={`flex items-center gap-1 ${
          isProfit ? "text-green-500" : "text-red-500"
        }`}
      >
        {isProfit ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <span className="font-semibold">
          {isProfit ? "+" : ""}
          {pnlPercent.toFixed(2)}%
        </span>
      </div>
      <div
        id="dca-summary-pnl-value"
        className={`text-sm font-medium ${
          isProfit ? "text-green-400" : "text-red-400"
        }`}
      >
        ({isProfit ? "+" : ""}
        {formatTHB(pnlValue)} บาท)
      </div>
    </div>
  );
};

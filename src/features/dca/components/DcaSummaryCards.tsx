import {
  Bitcoin,
  Coins,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DcaSummary } from "@/features/dca/types";
import { formatCoin, formatTHB } from "@/features/dca/utils/format";

interface DcaSummaryCardsProps {
  summary: DcaSummary;
}

const PnLBadge = ({
  pnlPercent,
  pnlValue,
}: {
  pnlPercent: number | null;
  pnlValue: number | null;
}) => {
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

export const DcaSummaryCards = ({ summary }: DcaSummaryCardsProps) => (
  <div
    id="dca-summary-section"
    className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
  >
    <Card id="dca-summary-total-spent-card" className="border-border">
      <CardContent id="dca-summary-total-spent-content" className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p id="dca-summary-total-spent-label" className="text-muted-foreground text-xs">
              ลงทุนรวมทั้งหมด
            </p>
            <p id="dca-summary-total-spent-value" className="text-lg font-bold">
              {formatTHB(summary.totalSpentTHB)}{" "}
              <span className="text-muted-foreground text-sm font-normal">
                บาท
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card id="dca-summary-total-btc-card" className="border-border">
      <CardContent id="dca-summary-total-btc-content" className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
            <Bitcoin className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p id="dca-summary-total-btc-label" className="text-muted-foreground text-xs">
              BTC สะสม
            </p>
            <p id="dca-summary-total-btc-value" className="text-lg font-bold">
              {formatCoin(summary.totalBTC)}{" "}
              <span className="text-muted-foreground text-sm font-normal">
                BTC
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card id="dca-summary-total-rounds-card" className="border-border">
      <CardContent id="dca-summary-total-rounds-content" className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Coins className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p id="dca-summary-total-rounds-label" className="text-muted-foreground text-xs">
              จำนวนรอบทั้งหมด
            </p>
            <p id="dca-summary-total-rounds-value" className="text-lg font-bold">
              {summary.totalRounds}{" "}
              <span className="text-muted-foreground text-sm font-normal">
                รอบ
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card
      id="dca-summary-pnl-card"
      className={`border-border ${
        summary.pnlPercent !== null && summary.pnlPercent >= 0
          ? "bg-green-500/5"
          : summary.pnlPercent !== null && summary.pnlPercent < 0
            ? "bg-red-500/5"
            : ""
      }`}
    >
      <CardContent id="dca-summary-pnl-content" className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                summary.pnlPercent !== null && summary.pnlPercent >= 0
                  ? "bg-green-500/10"
                  : summary.pnlPercent !== null && summary.pnlPercent < 0
                    ? "bg-red-500/10"
                    : "bg-muted"
              }`}
            >
              <DollarSign
                className={`h-5 w-5 ${
                  summary.pnlPercent !== null && summary.pnlPercent >= 0
                    ? "text-green-500"
                    : summary.pnlPercent !== null && summary.pnlPercent < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p id="dca-summary-pnl-label" className="text-muted-foreground text-xs">
                กำไร/ขาดทุน (PnL)
              </p>
              <PnLBadge
                pnlPercent={summary.pnlPercent}
                pnlValue={summary.pnlValue}
              />
            </div>
          </div>
          {summary.currentPrice !== null && (
            <div
              id="dca-summary-current-price-row"
              className="border-border text-muted-foreground flex items-center justify-between border-t pt-2 text-xs"
            >
              <span>ราคาปัจจุบัน:</span>
              <span id="dca-summary-current-price-value" className="font-mono">
                {formatTHB(summary.currentPrice)} บาท
              </span>
            </div>
          )}
          {summary.averagePrice > 0 && (
            <div
              id="dca-summary-average-price-row"
              className="text-muted-foreground flex items-center justify-between text-xs"
            >
              <span>ราคาเฉลี่ย:</span>
              <span id="dca-summary-average-price-value" className="font-mono">
                {formatTHB(summary.averagePrice)} บาท
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

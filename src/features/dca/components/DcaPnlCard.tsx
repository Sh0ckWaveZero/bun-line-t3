import { DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DcaPnlBadge } from "@/features/dca/components/DcaPnlBadge";
import {
  getPnlTone,
  PNL_CARD_BG_CLASSES,
  PNL_ICON_BG_CLASSES,
  PNL_ICON_TEXT_CLASSES,
} from "@/features/dca/helpers/dca-summary";
import type { DcaSummary } from "@/features/dca/types";
import { formatTHB } from "@/features/dca/utils/format";

interface DcaPnlCardProps {
  summary: DcaSummary;
}

/** การ์ดกำไร/ขาดทุน (PnL) พร้อมราคาปัจจุบันและราคาเฉลี่ย */
export const DcaPnlCard = ({ summary }: DcaPnlCardProps) => {
  const tone = getPnlTone(summary.pnlPercent);

  return (
    <Card
      id="dca-summary-pnl-card"
      className={`border-border ${PNL_CARD_BG_CLASSES[tone]}`}
    >
      <CardContent id="dca-summary-pnl-content" className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${PNL_ICON_BG_CLASSES[tone]}`}
            >
              <DollarSign
                className={`h-5 w-5 ${PNL_ICON_TEXT_CLASSES[tone]}`}
              />
            </div>
            <div>
              <p
                id="dca-summary-pnl-label"
                className="text-muted-foreground text-xs"
              >
                กำไร/ขาดทุน (PnL)
              </p>
              <DcaPnlBadge
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
  );
};

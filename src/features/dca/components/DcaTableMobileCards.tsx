import {
  NEGATIVE_VALUE_CLASS,
  POSITIVE_VALUE_CLASS,
} from "@/features/dca/constants/dca-table";
import {
  fmtDateShort,
  fmtInt,
  fmtThb,
} from "@/features/dca/helpers/dca-table-format";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";
import type { EnrichedRow } from "@/features/dca/types/records-table";

interface DcaTableMobileCardsProps {
  rows: EnrichedRow[];
}

/** มุมมองแบบการ์ดสำหรับมือถือของตารางประวัติการซื้อ */
export const DcaTableMobileCards = ({ rows }: DcaTableMobileCardsProps) => {
  const { t } = useDcaLocale();

  return (
    <div className="divide-border divide-y sm:hidden">
      {rows.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          {t.table.noRecordsFound}
        </div>
      ) : (
        rows.map((r) => (
          <div key={r.order.id} className="hover:bg-muted/40 px-3 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-muted text-foreground/70 rounded px-1.5 py-0.5 font-mono text-[10px]">
                  #{r.dayActive}
                </span>
                <span className="text-foreground text-xs font-medium">
                  {fmtDateShort(r.order.executedAt)}
                </span>
              </div>
              <span
                className={`font-mono text-xs font-medium ${r.unrealized >= 0 ? POSITIVE_VALUE_CLASS : NEGATIVE_VALUE_CLASS}`}
              >
                {r.unrealized >= 0 ? "+" : ""}
                {fmtThb(r.unrealized)}
              </span>
            </div>
            <div className="text-muted-foreground mt-1.5 grid grid-cols-3 gap-x-3 font-mono text-[10px]">
              <div>
                <span className="opacity-60">Fiat</span>
                <div className="text-foreground text-[11px]">
                  {fmtInt(r.order.amountTHB)} ฿
                </div>
              </div>
              <div>
                <span className="opacity-60">Sat</span>
                <div className="text-foreground text-[11px]">
                  {fmtInt(r.satoshi)}
                </div>
              </div>
              <div>
                <span className="opacity-60">Price</span>
                <div className="text-foreground text-[11px]">
                  {fmtInt(r.order.pricePerCoin)}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

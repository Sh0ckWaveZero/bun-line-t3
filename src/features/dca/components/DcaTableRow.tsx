import {
  NEGATIVE_VALUE_CLASS,
  POSITIVE_VALUE_CLASS,
} from "@/features/dca/constants/dca-table";
import {
  fmtDateShort,
  fmtInt,
  fmtThb,
} from "@/features/dca/helpers/dca-table-format";
import type { EnrichedRow } from "@/features/dca/types/records-table";

interface DcaTableRowProps {
  row: EnrichedRow;
}

/** แถวข้อมูลหนึ่งรายการในตารางเดสก์ท็อป */
export const DcaTableRow = ({ row: r }: DcaTableRowProps) => (
  <tr className="hover:bg-muted/40 border-border border-b transition-colors">
    <td className="px-3 py-2 text-left">
      <span className="bg-muted text-foreground/70 inline-block rounded px-1.5 py-0.5 text-center text-[11px]">
        {r.dayActive}
      </span>
    </td>
    <td className="px-3 py-2 text-left whitespace-nowrap">
      {fmtDateShort(r.order.executedAt)}
    </td>
    <td className="px-3 py-2 text-right">{fmtInt(r.order.amountTHB)}</td>
    <td className="px-3 py-2 text-right">{fmtInt(r.satoshi)}</td>
    <td className="hidden px-3 py-2 text-right lg:table-cell">
      {fmtInt(r.order.pricePerCoin)}
    </td>
    <td className="hidden px-3 py-2 text-right lg:table-cell">
      {fmtThb(r.portfolioValue)}
    </td>
    <td className="hidden px-3 py-2 text-right lg:table-cell">
      {fmtInt(r.invested)}
    </td>
    <td
      className={`px-3 py-2 text-right ${r.unrealized >= 0 ? POSITIVE_VALUE_CLASS : NEGATIVE_VALUE_CLASS}`}
    >
      {r.unrealized >= 0 ? "+" : ""}
      {fmtThb(r.unrealized)}
    </td>
    <td
      className={`hidden px-3 py-2 text-right lg:table-cell ${r.pctUnrealized >= 0 ? POSITIVE_VALUE_CLASS : NEGATIVE_VALUE_CLASS}`}
    >
      {r.pctUnrealized >= 0 ? "+" : ""}
      {r.pctUnrealized.toFixed(2)}%
    </td>
  </tr>
);

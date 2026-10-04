import type { DcaLocaleStrings } from "@/features/dca/lib/locale";
import type { DcaOrder } from "@/features/dca/types";
import type {
  EnrichedRow,
  RecordsSortKey,
  SortDirection,
  TableColDef,
} from "@/features/dca/types/records-table";
import { fmtDateShort } from "@/features/dca/helpers/dca-table-format";

/** สร้างแถวข้อมูลสะสมจากรายการซื้อ (เรียงตามวันที่) สำหรับตาราง */
export const buildEnrichedRows = (
  orders: DcaOrder[],
  currentPrice: number | null,
): EnrichedRow[] => {
  if (!currentPrice || orders.length === 0) return [];
  const sorted = [...orders].sort(
    (a, b) =>
      new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime(),
  );
  let cumSat = 0,
    cumFiat = 0;
  return sorted.map((order, i) => {
    const satoshi = Math.round(order.coinReceived * 1e8);
    cumSat += satoshi;
    cumFiat += order.amountTHB;
    const portfolioValue = (cumSat / 1e8) * currentPrice;
    const unrealized = portfolioValue - cumFiat;
    const pctUnrealized = cumFiat > 0 ? (unrealized / cumFiat) * 100 : 0;
    return {
      order,
      dayActive: i + 1,
      satoshi,
      cumSat,
      cumFiat,
      portfolioValue,
      invested: cumFiat,
      unrealized,
      pctUnrealized,
    };
  });
};

/** กรองแถวตามคำค้นหา (วันที่, จำนวนเงิน, ราคา) */
export const filterRowsByQuery = (
  rows: EnrichedRow[],
  query: string,
): EnrichedRow[] => {
  if (!query.trim()) return rows;
  const q = query.toLowerCase();
  return rows.filter(
    (r) =>
      String(r.dayActive).includes(q) ||
      fmtDateShort(r.order.executedAt).toLowerCase().includes(q) ||
      String(r.order.pricePerCoin).includes(q) ||
      String(r.order.amountTHB).includes(q),
  );
};

/** ตัวเข้าถึงค่าตัวเลขของแต่ละคีย์เรียงลำดับ */
const SORT_VALUE_ACCESSORS: Record<
  RecordsSortKey,
  (row: EnrichedRow) => number
> = {
  dayActive: (r) => r.dayActive,
  date: (r) => new Date(r.order.executedAt).getTime(),
  fiat: (r) => r.order.amountTHB,
  satoshi: (r) => r.satoshi,
  price: (r) => r.order.pricePerCoin,
  portfolioValue: (r) => r.portfolioValue,
  invested: (r) => r.invested,
  unrealized: (r) => r.unrealized,
  pctUnrealized: (r) => r.pctUnrealized,
};

/** เรียงลำดับแถวตามคีย์และทิศทางที่เลือก */
export const sortRows = (
  rows: EnrichedRow[],
  sortKey: RecordsSortKey,
  sortDir: SortDirection,
): EnrichedRow[] => {
  const arr = [...rows];
  const get = SORT_VALUE_ACCESSORS[sortKey];
  arr.sort((a, b) => (sortDir === "asc" ? get(a) - get(b) : get(b) - get(a)));
  return arr;
};

/** สร้างนิยามคอลัมน์ของตารางจาก locale */
export const buildTableColumns = (t: DcaLocaleStrings): TableColDef[] => [
  {
    key: "dayActive",
    label: t.table.colDay,
    shortLabel: t.table.colDay,
    left: true,
  },
  {
    key: "date",
    label: t.table.colDate,
    shortLabel: t.table.colDate,
    left: true,
  },
  {
    key: "fiat",
    label: `Fiat (${t.table.colFiat})`,
    shortLabel: t.table.colFiat,
  },
  {
    key: "satoshi",
    label: t.table.colSatoshi,
    shortLabel: t.table.colSatoshi,
  },
  {
    key: "price",
    label: t.table.colPrice,
    shortLabel: t.table.colPrice,
    hideMobile: true,
  },
  {
    key: "portfolioValue",
    label: t.table.colPortfolioValue,
    shortLabel: t.table.colPortfolioValue,
    hideMobile: true,
  },
  {
    key: "invested",
    label: t.table.colInvested,
    shortLabel: t.table.colInvested,
    hideMobile: true,
  },
  {
    key: "unrealized",
    label: t.table.colUnrealized,
    shortLabel: t.table.colUnrealized,
  },
  {
    key: "pctUnrealized",
    label: `% ${t.table.colUnrealized}`,
    shortLabel: t.table.colPctUnrealized,
    hideMobile: true,
  },
];

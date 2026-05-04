"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { DcaOrder } from "@/features/dca/types";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const fmtInt = (n: number): string => Math.round(n).toLocaleString("en-US");
const fmtThb = (n: number, d = 2): string =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtDateShort = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
};

interface EnrichedRow {
  order: DcaOrder;
  dayActive: number;
  satoshi: number;
  cumSat: number;
  cumFiat: number;
  portfolioValue: number;
  invested: number;
  unrealized: number;
  pctUnrealized: number;
}

type SortKey = "dayActive" | "date" | "fiat" | "satoshi" | "price" | "portfolioValue" | "invested" | "unrealized" | "pctUnrealized";

interface DcaRecordsTableProps {
  orders: DcaOrder[];
  currentPrice: number | null;
}

export const DcaRecordsTable = ({ orders, currentPrice }: DcaRecordsTableProps) => {
  const { t } = useDcaLocale();
  const [sortKey, setSortKey] = useState<SortKey>("dayActive");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [query, setQuery] = useState("");
  const PAGE_SIZE_OPTIONS = [10, 30, 50, 100] as const;

  const enrichedRows: EnrichedRow[] = useMemo(() => {
    if (!currentPrice || orders.length === 0) return [];
    const sorted = [...orders].sort((a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime());
    let cumSat = 0, cumFiat = 0;
    return sorted.map((order, i) => {
      const satoshi = Math.round(order.coinReceived * 1e8);
      cumSat += satoshi; cumFiat += order.amountTHB;
      const portfolioValue = (cumSat / 1e8) * currentPrice;
      const unrealized = portfolioValue - cumFiat;
      const pctUnrealized = cumFiat > 0 ? (unrealized / cumFiat) * 100 : 0;
      return { order, dayActive: i + 1, satoshi, cumSat, cumFiat, portfolioValue, invested: cumFiat, unrealized, pctUnrealized };
    });
  }, [orders, currentPrice]);

  const filtered = useMemo(() => {
    if (!query.trim()) return enrichedRows;
    const q = query.toLowerCase();
    return enrichedRows.filter((r) =>
      String(r.dayActive).includes(q) || fmtDateShort(r.order.executedAt).toLowerCase().includes(q) || String(r.order.pricePerCoin).includes(q) || String(r.order.amountTHB).includes(q)
    );
  }, [enrichedRows, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const get = (r: EnrichedRow): number => {
        switch (sortKey) {
          case "dayActive": return r.dayActive;
          case "date": return new Date(r.order.executedAt).getTime();
          case "fiat": return r.order.amountTHB;
          case "satoshi": return r.satoshi;
          case "price": return r.order.pricePerCoin;
          case "portfolioValue": return r.portfolioValue;
          case "invested": return r.invested;
          case "unrealized": return r.unrealized;
          case "pctUnrealized": return r.pctUnrealized;
        }
      };
      return sortDir === "asc" ? get(a) - get(b) : get(b) - get(a);
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const pageData = sorted.slice((curPage - 1) * pageSize, curPage * pageSize);

  useEffect(() => { setPage(1); }, [pageSize, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function pageNums(): Array<number | "..."> {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (curPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (curPage >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", curPage - 1, curPage, curPage + 1, "...", totalPages];
  }

  const posClass = "text-green-600 dark:text-green-400";
  const negClass = "text-red-600 dark:text-red-400";

  type ColDef = { key: SortKey; label: string; shortLabel: string; left?: boolean; hideMobile?: boolean };
  const columns: ColDef[] = [
    { key: "dayActive", label: t.table.colDay, shortLabel: t.table.colDay, left: true },
    { key: "date", label: t.table.colDate, shortLabel: t.table.colDate, left: true },
    { key: "fiat", label: `Fiat (${t.table.colFiat})`, shortLabel: t.table.colFiat },
    { key: "satoshi", label: t.table.colSatoshi, shortLabel: t.table.colSatoshi },
    { key: "price", label: t.table.colPrice, shortLabel: t.table.colPrice, hideMobile: true },
    { key: "portfolioValue", label: t.table.colPortfolioValue, shortLabel: t.table.colPortfolioValue, hideMobile: true },
    { key: "invested", label: t.table.colInvested, shortLabel: t.table.colInvested, hideMobile: true },
    { key: "unrealized", label: t.table.colUnrealized, shortLabel: t.table.colUnrealized },
    { key: "pctUnrealized", label: `% ${t.table.colUnrealized}`, shortLabel: t.table.colPctUnrealized, hideMobile: true },
  ];

  return (
    <div id="dca-records-table" className="bg-card border-border overflow-hidden rounded-lg border">
      {/* Toolbar */}
      <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <div className="bg-muted border-border flex w-40 items-center gap-1.5 rounded border px-2 py-1 sm:w-52">
            <Search className="text-muted-foreground h-3 w-3 shrink-0" />
            <input
              placeholder={t.table.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-foreground w-full bg-transparent font-mono text-xs outline-none placeholder:text-[var(--muted-foreground)]"
            />
          </div>
          <span className="text-muted-foreground font-mono text-[11px]">
            {t.table.records(filtered.length)}
          </span>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
          <span className="hidden sm:inline">{t.table.rowsPerPage}</span>
          <Popover open={pageSizeOpen} onOpenChange={setPageSizeOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="bg-card border-border text-foreground min-w-[64px] rounded border px-2 py-1 text-right font-mono text-xs"
              >
                {pageSize}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[72px] p-1">
              <div className="flex flex-col gap-0.5">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setPageSizeOpen(false);
                    }}
                    className={`rounded px-2 py-1.5 text-right font-mono text-xs ${
                      pageSize === size
                        ? "bg-foreground text-background"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="divide-border divide-y sm:hidden">
        {pageData.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">{t.table.noRecordsFound}</div>
        ) : (
          pageData.map((r) => (
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
                <span className={`font-mono text-xs font-medium ${r.unrealized >= 0 ? posClass : negClass}`}>
                  {r.unrealized >= 0 ? "+" : ""}{fmtThb(r.unrealized)}
                </span>
              </div>
              <div className="text-muted-foreground mt-1.5 grid grid-cols-3 gap-x-3 font-mono text-[10px]">
                <div>
                  <span className="opacity-60">Fiat</span>
                  <div className="text-foreground text-[11px]">{fmtInt(r.order.amountTHB)} ฿</div>
                </div>
                <div>
                  <span className="opacity-60">Sat</span>
                  <div className="text-foreground text-[11px]">{fmtInt(r.satoshi)}</div>
                </div>
                <div>
                  <span className="opacity-60">Price</span>
                  <div className="text-foreground text-[11px]">{fmtInt(r.order.pricePerCoin)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="dca-records w-full border-collapse font-mono text-xs">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`bg-muted text-muted-foreground border-border cursor-pointer whitespace-nowrap border-b px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider hover:text-foreground ${c.left ? "text-left" : "text-right"} ${c.hideMobile ? "hidden lg:table-cell" : ""}`}
                  onClick={() => toggleSort(c.key)}
                >
                  {c.label}
                  <span className={`ml-1 inline-block ${sortKey === c.key ? "text-orange-500 opacity-100" : "opacity-40"}`}>
                    {sortKey === c.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-muted-foreground py-8 text-center text-sm">
                  {t.table.noRecordsFound}
                </td>
              </tr>
            ) : (
              pageData.map((r) => (
                <tr key={r.order.id} className="hover:bg-muted/40 border-border border-b transition-colors">
                  <td className="px-3 py-2 text-left">
                    <span className="bg-muted text-foreground/70 inline-block rounded px-1.5 py-0.5 text-center text-[11px]">
                      {r.dayActive}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-left whitespace-nowrap">{fmtDateShort(r.order.executedAt)}</td>
                  <td className="px-3 py-2 text-right">{fmtInt(r.order.amountTHB)}</td>
                  <td className="px-3 py-2 text-right">{fmtInt(r.satoshi)}</td>
                  <td className="hidden px-3 py-2 text-right lg:table-cell">{fmtInt(r.order.pricePerCoin)}</td>
                  <td className="hidden px-3 py-2 text-right lg:table-cell">{fmtThb(r.portfolioValue)}</td>
                  <td className="hidden px-3 py-2 text-right lg:table-cell">{fmtInt(r.invested)}</td>
                  <td className={`px-3 py-2 text-right ${r.unrealized >= 0 ? posClass : negClass}`}>
                    {r.unrealized >= 0 ? "+" : ""}{fmtThb(r.unrealized)}
                  </td>
                  <td className={`hidden px-3 py-2 text-right lg:table-cell ${r.pctUnrealized >= 0 ? posClass : negClass}`}>
                    {r.pctUnrealized >= 0 ? "+" : ""}{r.pctUnrealized.toFixed(2)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-border text-muted-foreground flex flex-col items-center justify-between gap-2 border-t px-3 py-2.5 font-mono text-xs sm:flex-row sm:px-4">
        <span>
          {sorted.length === 0
            ? t.table.showingEmpty
            : t.table.showingRange((curPage - 1) * pageSize + 1, Math.min(curPage * pageSize, sorted.length), sorted.length)}
        </span>
        <div className="dca-pager flex gap-1">
          <button className="bg-card border-border text-foreground/70 rounded border px-2 py-1 text-xs disabled:opacity-30" disabled={curPage === 1} onClick={() => setPage(1)}>&laquo;</button>
          <button className="bg-card border-border text-foreground/70 rounded border px-2 py-1 text-xs disabled:opacity-30" disabled={curPage === 1} onClick={() => setPage(curPage - 1)}>&lsaquo;</button>
          {pageNums().map((n, i) =>
            n === "..." ? (
              <span key={i} className="px-1 opacity-50">&hellip;</span>
            ) : (
              <button
                key={i}
                className={`rounded border px-2 py-1 text-xs ${
                  n === curPage
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card border-border text-foreground/70 hover:bg-muted"
                }`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            )
          )}
          <button className="bg-card border-border text-foreground/70 rounded border px-2 py-1 text-xs disabled:opacity-30" disabled={curPage === totalPages} onClick={() => setPage(curPage + 1)}>&rsaquo;</button>
          <button className="bg-card border-border text-foreground/70 rounded border px-2 py-1 text-xs disabled:opacity-30" disabled={curPage === totalPages} onClick={() => setPage(totalPages)}>&raquo;</button>
        </div>
      </div>
    </div>
  );
};

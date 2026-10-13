"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmMorph } from "@/components/ui/confirm-morph";
import { useToast } from "@/components/common/ToastProvider";
import { AddDcaForm } from "@/features/dca/components/AddDcaForm";
import type { DcaOrder } from "@/features/dca/types";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";
import { useAuthSession } from "@/lib/auth/session-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const fmtInt = (n: number): string => Math.round(n).toLocaleString("en-US");
const fmtThb = (n: number, d = 2): string =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
const fmtDateShort = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
};
const fmtDateTime = (date: Date | string): string =>
  new Date(date).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Bangkok",
  });

const searchQueryCache = new Map<string, string>();
const searchQueryListeners = new Map<string, Set<() => void>>();

function readStoredSearchQuery(key: string | null): string {
  if (!key || typeof window === "undefined") return "";
  const cachedQuery = searchQueryCache.get(key);
  if (cachedQuery !== undefined) return cachedQuery;

  try {
    const storedQuery = window.sessionStorage.getItem(key) ?? "";
    searchQueryCache.set(key, storedQuery);
    return storedQuery;
  } catch {
    return "";
  }
}

function subscribeToSearchQuery(
  key: string | null,
  listener: () => void,
): () => void {
  if (!key) return () => {};

  const listeners = searchQueryListeners.get(key) ?? new Set<() => void>();
  listeners.add(listener);
  searchQueryListeners.set(key, listeners);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) searchQueryListeners.delete(key);
  };
}

function updateStoredSearchQuery(key: string | null, query: string): void {
  if (!key) return;
  searchQueryCache.set(key, query);

  try {
    if (query) window.sessionStorage.setItem(key, query);
    else window.sessionStorage.removeItem(key);
  } catch {
    searchQueryListeners.get(key)?.forEach((listener) => listener());
    return;
  }

  searchQueryListeners.get(key)?.forEach((listener) => listener());
}

function getEmptySearchQuery(): string {
  return "";
}

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

type SortKey =
  | "dayActive"
  | "date"
  | "fiat"
  | "satoshi"
  | "price"
  | "portfolioValue"
  | "invested"
  | "unrealized"
  | "pctUnrealized";

interface DcaRecordsTableProps {
  orders: DcaOrder[];
  currentPrice: number | null;
  onDataMutated: () => void;
}

export const DcaRecordsTable = ({
  orders,
  currentPrice,
  onDataMutated,
}: DcaRecordsTableProps) => {
  const { t } = useDcaLocale();
  const session = useAuthSession();
  const userId = session?.user?.id;
  const lineUserId = session?.user?.lineUserId;
  const { showToast } = useToast();
  const searchStorageKey = userId ? `dca-records-search:${userId}` : null;
  const [sortKey, setSortKey] = useState<SortKey>("dayActive");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DcaOrder | null>(null);
  const subscribeToQuery = useCallback(
    (listener: () => void) =>
      subscribeToSearchQuery(searchStorageKey, listener),
    [searchStorageKey],
  );
  const getQuerySnapshot = useCallback(
    () => readStoredSearchQuery(searchStorageKey),
    [searchStorageKey],
  );
  const query = useSyncExternalStore(
    subscribeToQuery,
    getQuerySnapshot,
    getEmptySearchQuery,
  );
  const PAGE_SIZE_OPTIONS = [10, 30, 50, 100] as const;

  const handleDeleteOrder = async (order: DcaOrder) => {
    if (!lineUserId) {
      throw new Error(t.table.deleteError);
    }

    const response = await fetch(
      `/api/dca/${encodeURIComponent(order.id)}?lineUserId=${encodeURIComponent(lineUserId)}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(data?.error ?? t.table.deleteError);
    }

    showToast({
      title: t.table.deleteSuccess,
      description: t.table.deleteLocalOnly,
      type: "success",
    });
    onDataMutated();
  };

  const enrichedRows: EnrichedRow[] = useMemo(() => {
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
  }, [orders, currentPrice]);

  const filtered = useMemo(() => {
    if (!query.trim()) return enrichedRows;
    const q = query.toLowerCase();
    return enrichedRows.filter(
      (r) =>
        String(r.dayActive).includes(q) ||
        fmtDateShort(r.order.executedAt).toLowerCase().includes(q) ||
        String(r.order.pricePerCoin).includes(q) ||
        String(r.order.amountTHB).includes(q),
    );
  }, [enrichedRows, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const get = (r: EnrichedRow): number => {
        switch (sortKey) {
          case "dayActive":
            return r.dayActive;
          case "date":
            return new Date(r.order.executedAt).getTime();
          case "fiat":
            return r.order.amountTHB;
          case "satoshi":
            return r.satoshi;
          case "price":
            return r.order.pricePerCoin;
          case "portfolioValue":
            return r.portfolioValue;
          case "invested":
            return r.invested;
          case "unrealized":
            return r.unrealized;
          case "pctUnrealized":
            return r.pctUnrealized;
        }
      };
      return sortDir === "asc" ? get(a) - get(b) : get(b) - get(a);
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const pageData = sorted.slice((curPage - 1) * pageSize, curPage * pageSize);

  function toggleSort(key: SortKey) {
    setPage(1);
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function pageNums(): Array<number | "..."> {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (curPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (curPage >= totalPages - 3)
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [1, "...", curPage - 1, curPage, curPage + 1, "...", totalPages];
  }

  function pageNumItems(): Array<{ key: string; page: number | "..." }> {
    let ellipsisNumber = 0;

    return pageNums().map((page) => ({
      key: page === "..." ? `ellipsis-${ellipsisNumber++}` : `page-${page}`,
      page,
    }));
  }

  const posClass = "text-green-600 dark:text-green-400";
  const negClass = "text-red-600 dark:text-red-400";

  type ColDef = {
    key: SortKey;
    label: string;
    shortLabel: string;
    left?: boolean;
    hideMobile?: boolean;
  };
  const columns: ColDef[] = [
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

  return (
    <div
      id="dca-records-table"
      className="bg-card border-border overflow-hidden rounded-lg border"
    >
      {/* Toolbar */}
      <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <div className="bg-muted border-border flex w-40 items-center gap-1.5 rounded border px-2 py-1 sm:w-52">
            <Search className="text-muted-foreground h-3 w-3 shrink-0" />
            <input
              aria-label={t.table.searchPlaceholder}
              placeholder={t.table.searchPlaceholder}
              value={query}
              onChange={(e) => {
                updateStoredSearchQuery(searchStorageKey, e.target.value);
                setPage(1);
              }}
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
                className="bg-card border-border text-foreground min-w-[64px] cursor-pointer rounded border px-2 py-1 text-right font-mono text-xs"
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
                      setPage(1);
                      setPageSizeOpen(false);
                    }}
                    className={`cursor-pointer rounded px-2 py-1.5 text-right font-mono text-xs ${
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
          <div className="text-muted-foreground py-8 text-center text-sm">
            {t.table.noRecordsFound}
          </div>
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
                <span
                  className={`font-mono text-xs font-medium ${r.unrealized >= 0 ? posClass : negClass}`}
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
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10"
                  onClick={() => setEditingOrder(r.order)}
                  aria-label={`${t.table.edit} ${r.order.coin} ${fmtDateTime(r.order.executedAt)}`}
                >
                  <Pencil aria-hidden="true" className="mr-1.5 h-4 w-4" />
                  {t.table.edit}
                </Button>
                <ConfirmMorph
                  label={t.table.delete}
                  ariaLabel={`${t.table.delete} ${r.order.coin} ${fmtDateTime(r.order.executedAt)}`}
                  prompt={t.table.deleteConfirmTitle}
                  description={t.table.deleteConfirmDescription}
                  confirmLabel={t.table.delete}
                  holdLabel={t.table.deleteHoldLabel}
                  holdReleaseLabel={t.table.deleteHoldReleaseLabel}
                  holdInstruction={t.table.deleteHoldInstruction}
                  holdCompleteLabel={t.table.deleteHoldComplete}
                  cancelLabel={t.table.deleteCancel}
                  pendingLabel={t.table.deletePending}
                  doneLabel={t.table.deleteSuccess}
                  doneDescription={t.table.deleteLocalOnly}
                  errorLabel={t.table.deleteError}
                  retryLabel={t.table.deleteRetry}
                  onConfirm={() => handleDeleteOrder(r.order)}
                  showIdleLabel
                />
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
                  scope="col"
                  aria-sort={
                    sortKey === c.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={`bg-muted text-muted-foreground border-border border-b px-3 py-2.5 text-[10px] font-medium tracking-wider whitespace-nowrap uppercase ${c.left ? "text-left" : "text-right"} ${c.hideMobile ? "hidden lg:table-cell" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(c.key)}
                    className={`hover:text-foreground focus-visible:outline-ring inline-flex w-full cursor-pointer items-center gap-1 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 ${c.left ? "justify-start" : "justify-end"}`}
                  >
                    <span>{c.label}</span>
                    {sortKey === c.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp
                          aria-hidden="true"
                          className="h-3.5 w-3.5 shrink-0 text-orange-500"
                        />
                      ) : (
                        <ArrowDown
                          aria-hidden="true"
                          className="h-3.5 w-3.5 shrink-0 text-orange-500"
                        />
                      )
                    ) : (
                      <ArrowUpDown
                        aria-hidden="true"
                        className="text-muted-foreground h-3.5 w-3.5 shrink-0 opacity-60"
                      />
                    )}
                  </button>
                </th>
              ))}
              <th
                scope="col"
                className="bg-muted text-muted-foreground border-border border-b px-3 py-2.5 text-right text-[10px] font-medium tracking-wider whitespace-nowrap uppercase"
              >
                {t.table.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  {t.table.noRecordsFound}
                </td>
              </tr>
            ) : (
              pageData.map((r) => (
                <tr
                  key={r.order.id}
                  className="hover:bg-muted/40 border-border border-b transition-colors"
                >
                  <td className="px-3 py-2 text-left">
                    <span className="bg-muted text-foreground/70 inline-block rounded px-1.5 py-0.5 text-center text-[11px]">
                      {r.dayActive}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-left whitespace-nowrap">
                    {fmtDateShort(r.order.executedAt)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtInt(r.order.amountTHB)}
                  </td>
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
                    className={`px-3 py-2 text-right ${r.unrealized >= 0 ? posClass : negClass}`}
                  >
                    {r.unrealized >= 0 ? "+" : ""}
                    {fmtThb(r.unrealized)}
                  </td>
                  <td
                    className={`hidden px-3 py-2 text-right lg:table-cell ${r.pctUnrealized >= 0 ? posClass : negClass}`}
                  >
                    {r.pctUnrealized >= 0 ? "+" : ""}
                    {r.pctUnrealized.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="min-h-9 px-2"
                        onClick={() => setEditingOrder(r.order)}
                        aria-label={`${t.table.edit} ${r.order.coin} ${fmtDateTime(r.order.executedAt)}`}
                      >
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                        <span className="sr-only">{t.table.edit}</span>
                      </Button>
                      <ConfirmMorph
                        label={t.table.delete}
                        ariaLabel={`${t.table.delete} ${r.order.coin} ${fmtDateTime(r.order.executedAt)}`}
                        prompt={t.table.deleteConfirmTitle}
                        description={t.table.deleteConfirmDescription}
                        confirmLabel={t.table.delete}
                        holdLabel={t.table.deleteHoldLabel}
                        holdReleaseLabel={t.table.deleteHoldReleaseLabel}
                        holdInstruction={t.table.deleteHoldInstruction}
                        holdCompleteLabel={t.table.deleteHoldComplete}
                        cancelLabel={t.table.deleteCancel}
                        pendingLabel={t.table.deletePending}
                        doneLabel={t.table.deleteSuccess}
                        doneDescription={t.table.deleteLocalOnly}
                        errorLabel={t.table.deleteError}
                        retryLabel={t.table.deleteRetry}
                        onConfirm={() => handleDeleteOrder(r.order)}
                      />
                    </div>
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
            : t.table.showingRange(
                (curPage - 1) * pageSize + 1,
                Math.min(curPage * pageSize, sorted.length),
                sorted.length,
              )}
        </span>
        <div className="dca-pager flex gap-1">
          <button
            className="bg-card border-border text-foreground/70 cursor-pointer rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30"
            disabled={curPage === 1}
            onClick={() => setPage(1)}
          >
            &laquo;
          </button>
          <button
            className="bg-card border-border text-foreground/70 cursor-pointer rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30"
            disabled={curPage === 1}
            onClick={() => setPage(curPage - 1)}
          >
            &lsaquo;
          </button>
          {pageNumItems().map(({ page: n, key }) =>
            n === "..." ? (
              <span key={key} className="px-1 opacity-50">
                &hellip;
              </span>
            ) : (
              <button
                key={key}
                className={`cursor-pointer rounded border px-2 py-1 text-xs ${
                  n === curPage
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card border-border text-foreground/70 hover:bg-muted"
                }`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ),
          )}
          <button
            className="bg-card border-border text-foreground/70 cursor-pointer rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30"
            disabled={curPage === totalPages}
            onClick={() => setPage(curPage + 1)}
          >
            &rsaquo;
          </button>
          <button
            className="bg-card border-border text-foreground/70 cursor-pointer rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30"
            disabled={curPage === totalPages}
            onClick={() => setPage(totalPages)}
          >
            &raquo;
          </button>
        </div>
      </div>

      {editingOrder && (
        <AddDcaForm
          key={editingOrder.id}
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSuccess={onDataMutated}
        />
      )}
    </div>
  );
};

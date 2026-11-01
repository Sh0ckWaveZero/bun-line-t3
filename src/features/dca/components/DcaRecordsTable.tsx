"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmMorph } from "@/components/ui/confirm-morph";
import { useToast } from "@/components/common/ToastProvider";
import { AddDcaForm } from "@/features/dca/components/AddDcaForm";
import type { DcaOrder } from "@/features/dca/types";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";
import type { DcaLocaleStrings } from "@/features/dca/lib/locale";
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

type DcaTableTexts = DcaLocaleStrings["table"];

interface DcaTableColumn {
  key: SortKey;
  label: string;
  shortLabel: string;
  left?: boolean;
  hideMobile?: boolean;
}

interface PageNumberItem {
  key: string;
  page: number | "...";
}

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100] as const;
const posClass = "text-green-600 dark:text-green-400";
const negClass = "text-red-600 dark:text-red-400";

function createDcaTableColumns(t: DcaTableTexts): DcaTableColumn[] {
  return [
    {
      key: "dayActive",
      label: t.colDay,
      shortLabel: t.colDay,
      left: true,
    },
    {
      key: "date",
      label: t.colDate,
      shortLabel: t.colDate,
      left: true,
    },
    {
      key: "fiat",
      label: `Fiat (${t.colFiat})`,
      shortLabel: t.colFiat,
    },
    {
      key: "satoshi",
      label: t.colSatoshi,
      shortLabel: t.colSatoshi,
    },
    {
      key: "price",
      label: t.colPrice,
      shortLabel: t.colPrice,
      hideMobile: true,
    },
    {
      key: "portfolioValue",
      label: t.colPortfolioValue,
      shortLabel: t.colPortfolioValue,
      hideMobile: true,
    },
    {
      key: "invested",
      label: t.colInvested,
      shortLabel: t.colInvested,
      hideMobile: true,
    },
    {
      key: "unrealized",
      label: t.colUnrealized,
      shortLabel: t.colUnrealized,
    },
    {
      key: "pctUnrealized",
      label: `% ${t.colUnrealized}`,
      shortLabel: t.colPctUnrealized,
      hideMobile: true,
    },
  ];
}

function createPageNumberItems(
  curPage: number,
  totalPages: number,
): PageNumberItem[] {
  let ellipsisNumber = 0;
  let pages: Array<number | "...">;

  if (totalPages <= 7) {
    pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  } else if (curPage <= 4) {
    pages = [1, 2, 3, 4, 5, "...", totalPages];
  } else if (curPage >= totalPages - 3) {
    pages = [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  } else {
    pages = [1, "...", curPage - 1, curPage, curPage + 1, "...", totalPages];
  }

  return pages.map((page) => ({
    key: page === "..." ? `ellipsis-${ellipsisNumber++}` : `page-${page}`,
    page,
  }));
}

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

  const columns = createDcaTableColumns(t.table);
  const pageNumbers = createPageNumberItems(curPage, totalPages);

  return (
    <div
      id="dca-records-table"
      className="bg-card border-border overflow-hidden rounded-lg border"
    >
      <DcaRecordsToolbar
        texts={t.table}
        query={query}
        filteredCount={filtered.length}
        pageSize={pageSize}
        pageSizeOpen={pageSizeOpen}
        onQueryChange={(value) => {
          updateStoredSearchQuery(searchStorageKey, value);
          setPage(1);
        }}
        onPageSizeOpenChange={setPageSizeOpen}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
          setPageSizeOpen(false);
        }}
      />

      <div className="divide-border divide-y sm:hidden">
        <DcaMobileRecords
          pageData={pageData}
          texts={t.table}
          onEdit={setEditingOrder}
          onDelete={handleDeleteOrder}
        />
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <DcaDesktopRecords
          pageData={pageData}
          columns={columns}
          texts={t.table}
          sortKey={sortKey}
          sortDir={sortDir}
          onToggleSort={toggleSort}
          onEdit={setEditingOrder}
          onDelete={handleDeleteOrder}
        />
      </div>

      <DcaRecordsPagination
        sortedLength={sorted.length}
        curPage={curPage}
        totalPages={totalPages}
        pageSize={pageSize}
        pageNumbers={pageNumbers}
        texts={t.table}
        onPageChange={setPage}
      />

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

interface DcaRecordsToolbarProps {
  texts: DcaTableTexts;
  query: string;
  filteredCount: number;
  pageSize: number;
  pageSizeOpen: boolean;
  onQueryChange: (value: string) => void;
  onPageSizeOpenChange: (open: boolean) => void;
  onPageSizeChange: (size: number) => void;
}

function DcaRecordsToolbar({
  texts,
  query,
  filteredCount,
  pageSize,
  pageSizeOpen,
  onQueryChange,
  onPageSizeOpenChange,
  onPageSizeChange,
}: DcaRecordsToolbarProps) {
  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2">
        <div className="bg-muted border-border flex w-40 items-center gap-1.5 rounded border px-2 py-1 sm:w-52">
          <Search className="text-muted-foreground h-3 w-3 shrink-0" />
          <input
            aria-label={texts.searchPlaceholder}
            placeholder={texts.searchPlaceholder}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="text-foreground w-full bg-transparent font-mono text-xs outline-none placeholder:text-[var(--muted-foreground)]"
          />
        </div>
        <span className="text-muted-foreground font-mono text-[11px]">
          {texts.records(filteredCount)}
        </span>
      </div>
      <div className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
        <span className="hidden sm:inline">{texts.rowsPerPage}</span>
        <Popover open={pageSizeOpen} onOpenChange={onPageSizeOpenChange}>
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
                  onClick={() => onPageSizeChange(size)}
                  className={
                    "cursor-pointer rounded px-2 py-1.5 text-right font-mono text-xs " +
                    (pageSize === size
                      ? "bg-foreground text-background"
                      : "text-foreground hover:bg-muted")
                  }
                >
                  {size}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

interface DcaMobileRecordsProps {
  pageData: EnrichedRow[];
  texts: DcaTableTexts;
  onEdit: (order: DcaOrder) => void;
  onDelete: (order: DcaOrder) => Promise<void>;
}

function DcaMobileRecords({
  pageData,
  texts,
  onEdit,
  onDelete,
}: DcaMobileRecordsProps) {
  if (pageData.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        {texts.noRecordsFound}
      </div>
    );
  }

  return (
    <>
      {pageData.map((row) => (
        <div key={row.order.id} className="hover:bg-muted/40 px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-muted text-foreground/70 rounded px-1.5 py-0.5 font-mono text-[10px]">
                #{row.dayActive}
              </span>
              <span className="text-foreground text-xs font-medium">
                {fmtDateShort(row.order.executedAt)}
              </span>
            </div>
            <span
              className={
                "font-mono text-xs font-medium " +
                (row.unrealized >= 0 ? posClass : negClass)
              }
            >
              {row.unrealized >= 0 ? "+" : ""}
              {fmtThb(row.unrealized)}
            </span>
          </div>
          <div className="text-muted-foreground mt-1.5 grid grid-cols-3 gap-x-3 font-mono text-[10px]">
            <div>
              <span className="opacity-60">Fiat</span>
              <div className="text-foreground text-[11px]">
                {fmtInt(row.order.amountTHB)} ฿
              </div>
            </div>
            <div>
              <span className="opacity-60">Sat</span>
              <div className="text-foreground text-[11px]">
                {fmtInt(row.satoshi)}
              </div>
            </div>
            <div>
              <span className="opacity-60">Price</span>
              <div className="text-foreground text-[11px]">
                {fmtInt(row.order.pricePerCoin)}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-10"
              onClick={() => onEdit(row.order)}
              aria-label={
                texts.edit +
                " " +
                row.order.coin +
                " " +
                fmtDateTime(row.order.executedAt)
              }
            >
              <Pencil aria-hidden="true" className="mr-1.5 h-4 w-4" />
              {texts.edit}
            </Button>
            <ConfirmMorph
              label={texts.delete}
              ariaLabel={
                texts.delete +
                " " +
                row.order.coin +
                " " +
                fmtDateTime(row.order.executedAt)
              }
              prompt={texts.deleteConfirmTitle}
              description={texts.deleteConfirmDescription}
              confirmLabel={texts.delete}
              holdLabel={texts.deleteHoldLabel}
              holdReleaseLabel={texts.deleteHoldReleaseLabel}
              holdInstruction={texts.deleteHoldInstruction}
              holdCompleteLabel={texts.deleteHoldComplete}
              cancelLabel={texts.deleteCancel}
              pendingLabel={texts.deletePending}
              doneLabel={texts.deleteSuccess}
              doneDescription={texts.deleteLocalOnly}
              errorLabel={texts.deleteError}
              retryLabel={texts.deleteRetry}
              onConfirm={() => onDelete(row.order)}
              showIdleLabel
              inline
            />
          </div>
        </div>
      ))}
    </>
  );
}

interface DcaDesktopRecordsProps {
  pageData: EnrichedRow[];
  columns: DcaTableColumn[];
  texts: DcaTableTexts;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onToggleSort: (key: SortKey) => void;
  onEdit: (order: DcaOrder) => void;
  onDelete: (order: DcaOrder) => Promise<void>;
}

function DcaDesktopRecords({
  pageData,
  columns,
  texts,
  sortKey,
  sortDir,
  onToggleSort,
  onEdit,
  onDelete,
}: DcaDesktopRecordsProps) {
  return (
    <table className="dca-records w-full border-collapse font-mono text-xs">
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              aria-sort={
                sortKey === column.key
                  ? sortDir === "asc"
                    ? "ascending"
                    : "descending"
                  : undefined
              }
              className={
                "bg-muted text-muted-foreground border-border border-b px-3 py-2.5 text-[10px] font-medium tracking-wider whitespace-nowrap uppercase " +
                (column.left ? "text-left" : "text-right") +
                " " +
                (column.hideMobile ? "hidden lg:table-cell" : "")
              }
            >
              <button
                type="button"
                onClick={() => onToggleSort(column.key)}
                className={
                  "hover:text-foreground focus-visible:outline-ring inline-flex w-full cursor-pointer items-center gap-1 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 " +
                  (column.left ? "justify-start" : "justify-end")
                }
              >
                <span>{column.label}</span>
                {sortKey === column.key ? (
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
            {texts.actions}
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
              {texts.noRecordsFound}
            </td>
          </tr>
        ) : (
          pageData.map((row) => (
            <tr
              key={row.order.id}
              className="hover:bg-muted/40 border-border border-b transition-colors"
            >
              <td className="px-3 py-2 text-left">
                <span className="bg-muted text-foreground/70 inline-block rounded px-1.5 py-0.5 text-center text-[11px]">
                  {row.dayActive}
                </span>
              </td>
              <td className="px-3 py-2 text-left whitespace-nowrap">
                {fmtDateShort(row.order.executedAt)}
              </td>
              <td className="px-3 py-2 text-right">
                {fmtInt(row.order.amountTHB)}
              </td>
              <td className="px-3 py-2 text-right">{fmtInt(row.satoshi)}</td>
              <td className="hidden px-3 py-2 text-right lg:table-cell">
                {fmtInt(row.order.pricePerCoin)}
              </td>
              <td className="hidden px-3 py-2 text-right lg:table-cell">
                {fmtThb(row.portfolioValue)}
              </td>
              <td className="hidden px-3 py-2 text-right lg:table-cell">
                {fmtInt(row.invested)}
              </td>
              <td
                className={
                  "px-3 py-2 text-right " +
                  (row.unrealized >= 0 ? posClass : negClass)
                }
              >
                {row.unrealized >= 0 ? "+" : ""}
                {fmtThb(row.unrealized)}
              </td>
              <td
                className={
                  "hidden px-3 py-2 text-right lg:table-cell " +
                  (row.pctUnrealized >= 0 ? posClass : negClass)
                }
              >
                {row.pctUnrealized >= 0 ? "+" : ""}
                {row.pctUnrealized.toFixed(2)}%
              </td>
              <td className="px-3 py-2 text-right">
                <div className="inline-flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-9 px-2"
                    onClick={() => onEdit(row.order)}
                    aria-label={
                      texts.edit +
                      " " +
                      row.order.coin +
                      " " +
                      fmtDateTime(row.order.executedAt)
                    }
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                    <span className="sr-only">{texts.edit}</span>
                  </Button>
                  <ConfirmMorph
                    label={texts.delete}
                    ariaLabel={
                      texts.delete +
                      " " +
                      row.order.coin +
                      " " +
                      fmtDateTime(row.order.executedAt)
                    }
                    prompt={texts.deleteConfirmTitle}
                    description={texts.deleteConfirmDescription}
                    confirmLabel={texts.delete}
                    holdLabel={texts.deleteHoldLabel}
                    holdReleaseLabel={texts.deleteHoldReleaseLabel}
                    holdInstruction={texts.deleteHoldInstruction}
                    holdCompleteLabel={texts.deleteHoldComplete}
                    cancelLabel={texts.deleteCancel}
                    pendingLabel={texts.deletePending}
                    doneLabel={texts.deleteSuccess}
                    doneDescription={texts.deleteLocalOnly}
                    errorLabel={texts.deleteError}
                    retryLabel={texts.deleteRetry}
                    onConfirm={() => onDelete(row.order)}
                  />
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

interface DcaRecordsPaginationProps {
  sortedLength: number;
  curPage: number;
  totalPages: number;
  pageSize: number;
  pageNumbers: PageNumberItem[];
  texts: DcaTableTexts;
  onPageChange: (page: number) => void;
}

function DcaRecordsPagination({
  sortedLength,
  curPage,
  totalPages,
  pageSize,
  pageNumbers,
  texts,
  onPageChange,
}: DcaRecordsPaginationProps) {
  return (
    <div className="border-border text-muted-foreground flex flex-col items-center justify-between gap-2 border-t px-3 py-2.5 font-mono text-xs sm:flex-row sm:px-4">
      <span>
        {sortedLength === 0
          ? texts.showingEmpty
          : texts.showingRange(
              (curPage - 1) * pageSize + 1,
              Math.min(curPage * pageSize, sortedLength),
              sortedLength,
            )}
      </span>
      <div className="dca-pager flex gap-1">
        <button
          className="bg-card border-border text-foreground/70 cursor-pointer rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30"
          disabled={curPage === 1}
          onClick={() => onPageChange(1)}
        >
          &laquo;
        </button>
        <button
          className="bg-card border-border text-foreground/70 cursor-pointer rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30"
          disabled={curPage === 1}
          onClick={() => onPageChange(curPage - 1)}
        >
          &lsaquo;
        </button>
        {pageNumbers.map(({ page, key }) =>
          page === "..." ? (
            <span key={key} className="px-1 opacity-50">
              &hellip;
            </span>
          ) : (
            <button
              key={key}
              className={
                "cursor-pointer rounded border px-2 py-1 text-xs " +
                (page === curPage
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border text-foreground/70 hover:bg-muted")
              }
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ),
        )}
        <button
          className="bg-card border-border text-foreground/70 cursor-pointer rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30"
          disabled={curPage === totalPages}
          onClick={() => onPageChange(curPage + 1)}
        >
          &rsaquo;
        </button>
        <button
          className="bg-card border-border text-foreground/70 cursor-pointer rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-30"
          disabled={curPage === totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}

import { useCallback, useMemo, useState } from "react";
import {
  buildEnrichedRows,
  filterRowsByQuery,
  sortRows,
} from "@/features/dca/helpers/dca-table-data";
import { computePageItems } from "@/features/dca/helpers/dca-table-pagination";
import type { DcaOrder } from "@/features/dca/types";
import type {
  EnrichedRow,
  PageNumItem,
  RecordsSortKey,
  SortDirection,
} from "@/features/dca/types/records-table";

interface UseDcaRecordsTableParams {
  orders: DcaOrder[];
  currentPrice: number | null;
}

interface UseDcaRecordsTableResult {
  query: string;
  handleQueryChange: (query: string) => void;
  filteredCount: number;
  pageSize: number;
  handlePageSizeChange: (pageSize: number) => void;
  sortKey: RecordsSortKey;
  sortDir: SortDirection;
  handleToggleSort: (key: RecordsSortKey) => void;
  curPage: number;
  totalPages: number;
  pageData: EnrichedRow[];
  pageItems: PageNumItem[];
  handlePageChange: (page: number) => void;
  totalCount: number;
}

/** State machine ทั้งหมดของตารางประวัติการซื้อ (กรอง, เรียง, แบ่งหน้า) */
export const useDcaRecordsTable = ({
  orders,
  currentPrice,
}: UseDcaRecordsTableParams): UseDcaRecordsTableResult => {
  const [sortKey, setSortKey] = useState<RecordsSortKey>("dayActive");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");

  const enrichedRows = useMemo(
    () => buildEnrichedRows(orders, currentPrice),
    [orders, currentPrice],
  );

  const filtered = useMemo(
    () => filterRowsByQuery(enrichedRows, query),
    [enrichedRows, query],
  );

  const sorted = useMemo(
    () => sortRows(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const pageData = sorted.slice((curPage - 1) * pageSize, curPage * pageSize);

  // รีเซ็ตกลับหน้าแรกทุกครั้งที่เงื่อนไขกรอง/เรียง/ขนาดหน้าเปลี่ยน
  const handleToggleSort = useCallback(
    (key: RecordsSortKey) => {
      if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortKey(key);
        setSortDir("desc");
      }
      setPage(1);
    },
    [sortKey],
  );

  const handleQueryChange = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  }, []);

  const handlePageChange = useCallback(
    (nextPage: number) => setPage(nextPage),
    [],
  );

  const pageItems = useMemo(
    () => computePageItems(totalPages, curPage),
    [totalPages, curPage],
  );

  return {
    query,
    handleQueryChange,
    filteredCount: filtered.length,
    pageSize,
    handlePageSizeChange,
    sortKey,
    sortDir,
    handleToggleSort,
    curPage,
    totalPages,
    pageData,
    pageItems,
    handlePageChange,
    totalCount: sorted.length,
  };
};

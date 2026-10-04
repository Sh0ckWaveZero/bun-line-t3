"use client";

import { useMemo } from "react";
import { buildTableColumns } from "@/features/dca/helpers/dca-table-data";
import { useDcaRecordsTable } from "@/features/dca/hooks/useDcaRecordsTable";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";
import type { DcaOrder } from "@/features/dca/types";
import { DcaTableDesktop } from "@/features/dca/components/DcaTableDesktop";
import { DcaTableMobileCards } from "@/features/dca/components/DcaTableMobileCards";
import { DcaTablePagination } from "@/features/dca/components/DcaTablePagination";
import { DcaTableToolbar } from "@/features/dca/components/DcaTableToolbar";

interface DcaRecordsTableProps {
  orders: DcaOrder[];
  currentPrice: number | null;
}

export const DcaRecordsTable = ({
  orders,
  currentPrice,
}: DcaRecordsTableProps) => {
  const { t } = useDcaLocale();
  const table = useDcaRecordsTable({ orders, currentPrice });
  const columns = useMemo(() => buildTableColumns(t), [t]);

  return (
    <div
      id="dca-records-table"
      className="bg-card border-border overflow-hidden rounded-lg border"
    >
      {/* Toolbar */}
      <DcaTableToolbar
        query={table.query}
        onQueryChange={table.handleQueryChange}
        recordCount={table.filteredCount}
        pageSize={table.pageSize}
        onPageSizeChange={table.handlePageSizeChange}
      />

      {/* Mobile card view */}
      <DcaTableMobileCards rows={table.pageData} />

      {/* Desktop table */}
      <DcaTableDesktop
        rows={table.pageData}
        columns={columns}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleToggleSort}
      />

      {/* Pagination */}
      <DcaTablePagination
        totalCount={table.totalCount}
        curPage={table.curPage}
        totalPages={table.totalPages}
        pageSize={table.pageSize}
        pageItems={table.pageItems}
        onPageChange={table.handlePageChange}
      />
    </div>
  );
};

import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";
import type { PageNumItem } from "@/features/dca/types/records-table";

interface DcaTablePaginationProps {
  totalCount: number;
  curPage: number;
  totalPages: number;
  pageSize: number;
  pageItems: PageNumItem[];
  onPageChange: (page: number) => void;
}

/** แถบแบ่งหน้าของตารางประวัติการซื้อ */
export const DcaTablePagination = ({
  totalCount,
  curPage,
  totalPages,
  pageSize,
  pageItems,
  onPageChange,
}: DcaTablePaginationProps) => {
  const { t } = useDcaLocale();

  return (
    <div className="border-border text-muted-foreground flex flex-col items-center justify-between gap-2 border-t px-3 py-2.5 font-mono text-xs sm:flex-row sm:px-4">
      <span>
        {totalCount === 0
          ? t.table.showingEmpty
          : t.table.showingRange(
              (curPage - 1) * pageSize + 1,
              Math.min(curPage * pageSize, totalCount),
              totalCount,
            )}
      </span>
      <div className="dca-pager flex gap-1">
        <button
          className="bg-card border-border text-foreground/70 rounded border px-2 py-1 text-xs disabled:opacity-30"
          disabled={curPage === 1}
          onClick={() => onPageChange(1)}
        >
          &laquo;
        </button>
        <button
          className="bg-card border-border text-foreground/70 rounded border px-2 py-1 text-xs disabled:opacity-30"
          disabled={curPage === 1}
          onClick={() => onPageChange(curPage - 1)}
        >
          &lsaquo;
        </button>
        {pageItems.map(({ page: n, key }) =>
          n === "..." ? (
            <span key={key} className="px-1 opacity-50">
              &hellip;
            </span>
          ) : (
            <button
              key={key}
              className={`rounded border px-2 py-1 text-xs ${
                n === curPage
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border text-foreground/70 hover:bg-muted"
              }`}
              onClick={() => onPageChange(n)}
            >
              {n}
            </button>
          ),
        )}
        <button
          className="bg-card border-border text-foreground/70 rounded border px-2 py-1 text-xs disabled:opacity-30"
          disabled={curPage === totalPages}
          onClick={() => onPageChange(curPage + 1)}
        >
          &rsaquo;
        </button>
        <button
          className="bg-card border-border text-foreground/70 rounded border px-2 py-1 text-xs disabled:opacity-30"
          disabled={curPage === totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          &raquo;
        </button>
      </div>
    </div>
  );
};

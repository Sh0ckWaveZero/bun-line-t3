import { DcaTableHeaderRow } from "@/features/dca/components/DcaTableHeaderRow";
import { DcaTableRow } from "@/features/dca/components/DcaTableRow";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";
import type {
  EnrichedRow,
  RecordsSortKey,
  SortDirection,
  TableColDef,
} from "@/features/dca/types/records-table";

interface DcaTableDesktopProps {
  rows: EnrichedRow[];
  columns: TableColDef[];
  sortKey: RecordsSortKey;
  sortDir: SortDirection;
  onSort: (key: RecordsSortKey) => void;
}

/** ตารางเดสก์ท็อปของประวัติการซื้อ */
export const DcaTableDesktop = ({
  rows,
  columns,
  sortKey,
  sortDir,
  onSort,
}: DcaTableDesktopProps) => {
  const { t } = useDcaLocale();

  return (
    <div className="hidden overflow-x-auto sm:block">
      <table className="dca-records w-full border-collapse font-mono text-xs">
        <thead>
          <tr>
            <DcaTableHeaderRow
              columns={columns}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
            />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-muted-foreground py-8 text-center text-sm"
              >
                {t.table.noRecordsFound}
              </td>
            </tr>
          ) : (
            rows.map((r) => <DcaTableRow key={r.order.id} row={r} />)
          )}
        </tbody>
      </table>
    </div>
  );
};

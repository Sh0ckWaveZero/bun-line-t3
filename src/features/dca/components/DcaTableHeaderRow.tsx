import type {
  RecordsSortKey,
  SortDirection,
  TableColDef,
} from "@/features/dca/types/records-table";

interface DcaTableHeaderRowProps {
  columns: TableColDef[];
  sortKey: RecordsSortKey;
  sortDir: SortDirection;
  onSort: (key: RecordsSortKey) => void;
}

/** แถวหัวตาราง (th) ที่คลิกเรียงลำดับได้ */
export const DcaTableHeaderRow = ({
  columns,
  sortKey,
  sortDir,
  onSort,
}: DcaTableHeaderRowProps) => (
  <>
    {columns.map((c) => (
      <th
        key={c.key}
        className={`bg-muted text-muted-foreground border-border hover:text-foreground cursor-pointer border-b px-3 py-2.5 text-[10px] font-medium tracking-wider whitespace-nowrap uppercase ${c.left ? "text-left" : "text-right"} ${c.hideMobile ? "hidden lg:table-cell" : ""}`}
        tabIndex={0}
        onClick={() => onSort(c.key)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSort(c.key);
          }
        }}
      >
        {c.label}
        <span
          className={`ml-1 inline-block ${sortKey === c.key ? "text-orange-500 opacity-100" : "opacity-40"}`}
        >
          {sortKey === c.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </th>
    ))}
  </>
);

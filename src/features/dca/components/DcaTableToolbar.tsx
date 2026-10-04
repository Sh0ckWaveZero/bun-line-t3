import { useState } from "react";
import { Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PAGE_SIZE_OPTIONS } from "@/features/dca/constants/dca-table";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";

interface DcaTableToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  recordCount: number;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
}

/** แถบเครื่องมือของตาราง: ช่องค้นหา + จำนวนรายการ + dropdown แถวต่อหน้า */
export const DcaTableToolbar = ({
  query,
  onQueryChange,
  recordCount,
  pageSize,
  onPageSizeChange,
}: DcaTableToolbarProps) => {
  const { t } = useDcaLocale();
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2">
        <div className="bg-muted border-border flex w-40 items-center gap-1.5 rounded border px-2 py-1 sm:w-52">
          <Search className="text-muted-foreground h-3 w-3 shrink-0" />
          <input
            placeholder={t.table.searchPlaceholder}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="text-foreground w-full bg-transparent font-mono text-xs outline-none placeholder:text-[var(--muted-foreground)]"
          />
        </div>
        <span className="text-muted-foreground font-mono text-[11px]">
          {t.table.records(recordCount)}
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
                    onPageSizeChange(size);
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
  );
};

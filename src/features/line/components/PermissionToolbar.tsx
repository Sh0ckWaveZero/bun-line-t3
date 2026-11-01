import { RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function PermissionToolbar({
  searchQuery,
  onSearchChange,
  isFetching,
  onRefresh,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-white/[0.08]">
      <div className="relative w-full sm:max-w-[340px]">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <label htmlFor="permission-search" className="sr-only">
          ค้นหาผู้ใช้
        </label>
        <input
          id="permission-search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ค้นหาชื่อ หรือ LINE User ID…"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-600"
        />
      </div>
      <button
        type="button"
        onClick={onRefresh}
        aria-label="รีเฟรชรายการสิทธิ์ LINE"
        className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none sm:self-auto dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08]"
      >
        <RefreshCw
          className={cn(
            "size-4 motion-reduce:animate-none",
            isFetching && "animate-spin",
          )}
          aria-hidden="true"
        />
        รีเฟรช
      </button>
    </div>
  );
}

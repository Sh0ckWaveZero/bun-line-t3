import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBitkubDca } from "../hooks/useBitkubDca";
import { BitkubBuyHistory } from "./BitkubBuyHistory";

export function BitkubDcaPanel({ onImported }: { onImported: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    connection,
    history,
    dateLabels,
    page,
    setPage,
    pageSize,
    search,
    statusFilter,
    dateFrom,
    dateTo,
    handleSearchChange,
    handleStatusFilterChange,
    handlePageSizeChange,
    handleDateFromChange,
    handleDateToChange,
    selected,
    setSelected,
    nextCursor,
    isBusy,
    isImporting,
    isSyncingHistory,
    message,
    outcomes,
    visibleError,
    handleSync,
    handleImport,
  } = useBitkubDca(onImported, isExpanded);
  const hasConnectionStatus = Boolean(connection.data) && !connection.isError;
  const isConnectionUnknown = connection.isError;
  return (
    <section
      aria-labelledby="bitkub-heading"
      aria-busy={isBusy}
      className="border-border bg-card mb-4 w-full space-y-4 rounded-lg border p-4 sm:p-6"
    >
      <h2 id="bitkub-heading" className="m-0">
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls="bitkub-panel-content"
          onClick={() => setIsExpanded((current) => !current)}
          className="group flex min-h-11 w-full cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-md text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="min-w-0 text-lg font-semibold">
            Bitkub · นำเข้ารายการซื้อ BTC
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {connection.data?.connected ? (
              <span className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full bg-emerald-500"
                />
                <span className="shrink-0">เชื่อมต่อแล้ว</span>
                {connection.data.keyHint && (
                  <span className="max-w-16 truncate font-mono text-xs font-normal opacity-80">
                    {connection.data.keyHint}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground max-w-36 truncate text-right text-sm sm:max-w-none">
                {connection.isLoading
                  ? "กำลังตรวจสอบการเชื่อมต่อ"
                  : isConnectionUnknown
                    ? "ยังตรวจสอบสถานะการเชื่อมต่อไม่ได้"
                    : connection.data
                      ? "ยังไม่ได้เชื่อมต่อ"
                      : "เปิดแผงเพื่อจัดการประวัติซื้อ"}
              </span>
            )}
            <span className="text-muted-foreground grid size-8 shrink-0 place-items-center rounded-full transition-colors group-hover:bg-muted group-hover:text-foreground">
              <ChevronDown
                aria-hidden="true"
                className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              />
            </span>
          </span>
        </button>
      </h2>
      <div id="bitkub-panel-content" hidden={!isExpanded} className="space-y-4">
        <p className="text-muted-foreground text-sm">
          โหลดประวัติซื้อจาก Bitkub เมื่อกดปุ่มเท่านั้น แล้วเลือกรายการที่ต้องการนำเข้า DCA{" "}
          <Link
            to="/settings"
            className="text-primary underline-offset-4 hover:underline"
          >
            จัดการการเชื่อมต่อ
          </Link>
        </p>
        {isConnectionUnknown && (
          <Button
            type="button"
            variant="outline"
            disabled={connection.isFetching}
            onClick={() => void connection.refetch()}
          >
            ลองตรวจสอบสถานะอีกครั้ง
          </Button>
        )}
        {hasConnectionStatus &&
          connection.data &&
          !connection.data.configured && (
            <p className="text-sm">
              ระบบยังไม่พร้อมรับการเชื่อมต่อ Bitkub กรุณาติดต่อผู้ดูแล
            </p>
          )}
        {hasConnectionStatus && connection.data?.connected && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={isBusy}
              onClick={() => handleSync()}
              className="gap-2"
            >
              <Download aria-hidden="true" className="size-4" />
              โหลดประวัติล่าสุด
            </Button>
            {nextCursor && (
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => handleSync(nextCursor)}
              >
                โหลดก่อนหน้านี้
              </Button>
            )}
          </div>
        )}
        <BitkubBuyHistory
          history={history}
          dateLabels={dateLabels}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          search={search}
          statusFilter={statusFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          handleSearchChange={handleSearchChange}
          handleStatusFilterChange={handleStatusFilterChange}
          handlePageSizeChange={handlePageSizeChange}
          handleDateFromChange={handleDateFromChange}
          handleDateToChange={handleDateToChange}
          selected={selected}
          setSelected={setSelected}
          isBusy={isBusy}
          isImporting={isImporting}
          isSyncingHistory={isSyncingHistory}
          message={message}
          visibleError={visibleError}
          outcomes={outcomes}
          handleImport={handleImport}
        />
      </div>
    </section>
  );
}

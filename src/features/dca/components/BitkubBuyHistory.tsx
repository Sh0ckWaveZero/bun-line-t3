import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { PopoverDatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SkeletonReveal } from "@/components/ui/skeleton-reveal";
import type { useBitkubDca } from "../hooks/useBitkubDca";
import type { BitkubBuyStatusFilter } from "@/features/exchanges/types/bitkub";
import { BitkubHistorySkeleton } from "./DcaLoadingSkeletons";

type BitkubHistoryProps = Pick<
  ReturnType<typeof useBitkubDca>,
  | "dateLabels"
  | "history"
  | "page"
  | "setPage"
  | "pageSize"
  | "search"
  | "statusFilter"
  | "dateFrom"
  | "dateTo"
  | "handleSearchChange"
  | "handleStatusFilterChange"
  | "handlePageSizeChange"
  | "handleDateFromChange"
  | "handleDateToChange"
  | "selected"
  | "setSelected"
  | "isBusy"
  | "isImporting"
  | "isSyncingHistory"
  | "message"
  | "visibleError"
  | "outcomes"
  | "handleImport"
>;

function parseBangkokDate(value: string): Date | undefined {
  if (!value) return undefined;
  return new Date(`${value}T12:00:00+07:00`);
}

const bangkokDateInputFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

function formatBangkokDateInput(date?: Date): string {
  if (!date) return "";
  const parts = bangkokDateInputFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

export function BitkubBuyHistory({
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
  isBusy,
  isImporting,
  isSyncingHistory,
  message,
  visibleError,
  outcomes,
  handleImport,
}: BitkubHistoryProps) {
  const selectedIds = new Set(selected);
  const outcomesById = new Map(
    outcomes.map((outcome) => [outcome.buyId, outcome]),
  );
  const hasFilters =
    Boolean(search.trim()) ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    statusFilter !== "all";
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">รายการซื้อที่โหลดไว้</h3>
        <Button
          type="button"
          disabled={isBusy || selected.length === 0}
          onClick={handleImport}
          className="gap-2"
        >
          {isImporting && (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          )}
          {isImporting
            ? "กำลังนำเข้ารายการที่เลือก…"
            : `นำเข้า ${selected.length} รายการที่เลือก`}
        </Button>
      </div>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          message
            ? "border-border bg-muted/50 text-foreground rounded-md border px-3 py-2 text-sm"
            : "sr-only"
        }
      >
        {isImporting ? "กำลังนำเข้ารายการที่เลือก…" : message}
      </p>
      {visibleError && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {visibleError}
        </p>
      )}
      <p className="text-muted-foreground text-sm">
        ต้นทุนรวมค่าธรรมเนียม THB จำนวน BTC คำนวณจากยอดซื้อ THB ÷ ราคา
        เลือกเฉพาะรายการที่ต้องการเพิ่มใน DCA ประวัติจาก API
        นำเข้าได้เฉพาะรายการที่ API ส่งกลับมา · วันที่อ้างอิงเวลาไทย
      </p>
      <div className="grid w-full gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[minmax(0,1fr)_12rem_10rem_10rem_9rem]">
        <div className="space-y-1">
          <label
            htmlFor="bitkub-buy-search"
            className="text-foreground text-xs"
          >
            ค้นหารหัสธุรกรรมหรือรหัสคำสั่งซื้อ
          </label>
          <Input
            id="bitkub-buy-search"
            type="search"
            value={search}
            placeholder="พิมพ์รหัสที่ต้องการค้นหา"
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </div>
        <PopoverDatePicker
          id="bitkub-buy-date-from"
          label="วันที่ซื้อตั้งแต่"
          labelClassName="text-xs"
          placeholder="เลือกวันที่เริ่มต้น"
          value={parseBangkokDate(dateFrom)}
          maxDate={parseBangkokDate(dateTo)}
          onChange={(date) =>
            handleDateFromChange(formatBangkokDateInput(date))
          }
          className="w-full space-y-1"
          triggerClassName="h-10 rounded-md px-3 text-sm font-normal"
        />
        <PopoverDatePicker
          id="bitkub-buy-date-to"
          label="วันที่ซื้อถึง"
          labelClassName="text-xs"
          placeholder="เลือกวันที่สิ้นสุด"
          value={parseBangkokDate(dateTo)}
          minDate={parseBangkokDate(dateFrom)}
          onChange={(date) => handleDateToChange(formatBangkokDateInput(date))}
          className="w-full space-y-1"
          triggerClassName="h-10 rounded-md px-3 text-sm font-normal"
        />
        <div className="space-y-1">
          <label
            htmlFor="bitkub-buy-status"
            className="text-foreground text-xs"
          >
            สถานะรายการ
          </label>
          <Select
            id="bitkub-buy-status"
            value={statusFilter}
            onValueChange={(value) =>
              handleStatusFilterChange(value as BitkubBuyStatusFilter)
            }
            options={[
              { value: "all", label: "ทุกสถานะ" },
              { value: "ready", label: "พร้อมนำเข้า" },
              { value: "imported", label: "นำเข้าแล้ว" },
            ]}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="bitkub-buy-page-size"
            className="text-foreground text-xs"
          >
            แถวต่อหน้า
          </label>
          <Select
            id="bitkub-buy-page-size"
            value={String(pageSize)}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
            options={[
              { value: "10", label: "10 รายการ" },
              { value: "20", label: "20 รายการ" },
              { value: "50", label: "50 รายการ" },
            ]}
          />
        </div>
      </div>
      <SkeletonReveal
        isReady={!isSyncingHistory && !history.isLoading}
        skeleton={<BitkubHistorySkeleton />}
      >
        {history.data?.buys.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                รายการซื้อ BTC ที่เลือกนำเข้า DCA ได้
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="p-2">
                    เลือก
                  </th>
                  <th scope="col" className="p-2">
                    วันเวลา / รหัสธุรกรรม
                  </th>
                  <th scope="col" className="p-2">
                    ต้นทุน THB รวมค่าธรรมเนียม
                  </th>
                  <th scope="col" className="p-2">
                    BTC
                  </th>
                  <th scope="col" className="p-2">
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.data.buys.map((buy) => {
                  const outcome = outcomesById.get(buy.id);
                  const isLegacyConflict =
                    !buy.imported && outcome?.status === "legacy_conflict";
                  const statusLabel = buy.imported
                    ? "นำเข้าแล้ว"
                    : isLegacyConflict
                      ? "อาจซ้ำข้อมูลเดิม กรุณาตรวจสอบ"
                      : "พร้อมนำเข้า";
                  const statusClassName = buy.imported
                    ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    : isLegacyConflict
                      ? "border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                      : "border-primary/30 bg-primary/10 text-primary";
                  return (
                    <tr key={buy.id} className="border-border border-t">
                      <td className="p-2">
                        <label
                          className={`flex min-h-10 min-w-10 items-center justify-center ${
                            isBusy || buy.imported
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(buy.id)}
                            disabled={isBusy || buy.imported}
                            onChange={(event) =>
                              setSelected((current) =>
                                event.target.checked
                                  ? [...current, buy.id]
                                  : current.filter((id) => id !== buy.id),
                              )
                            }
                          />
                          <span className="sr-only">
                            เลือกธุรกรรม {buy.externalTradeIdentity}
                          </span>
                        </label>
                      </td>
                      <th scope="row" className="p-2 font-normal">
                        <time dateTime={buy.executedAt}>
                          {dateLabels.get(buy.id)}
                        </time>
                        <span className="text-muted-foreground block text-xs break-all">
                          {buy.externalTradeIdentity}
                        </span>
                      </th>
                      <td className="p-2">
                        {buy.spentTHB}
                        <span className="text-muted-foreground block text-xs">
                          ค่าธรรมเนียม {buy.feeTHB}
                        </span>
                      </td>
                      <td className="p-2">{buy.receivedBTC}</td>
                      <td className="p-2">
                        <Badge
                          variant="outline"
                          className={`px-2 py-1 text-xs font-medium whitespace-nowrap ${statusClassName}`}
                        >
                          {statusLabel}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {history.isPending
              ? "กดโหลดประวัติล่าสุดจาก Bitkub เพื่อดึงรายการซื้อ"
              : hasFilters
                ? "ไม่พบรายการที่ตรงกับตัวกรอง"
                : "ยังไม่มีรายการซื้อที่โหลดไว้"}
          </p>
        )}
      </SkeletonReveal>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isBusy || page <= 1}
          onClick={() => {
            setSelected([]);
            setPage((current) => current - 1);
          }}
        >
          หน้าก่อนหน้า
        </Button>
        <span className="text-muted-foreground text-sm" aria-live="polite">
          {history.data?.total
            ? `แสดง ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, history.data.total)} จาก ${history.data.total} รายการ · หน้า ${page} / ${Math.max(1, history.data.totalPages)}`
            : `หน้า ${page} / ${Math.max(1, history.data?.totalPages ?? 1)}`}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={isBusy || page >= (history.data?.totalPages ?? 1)}
          onClick={() => {
            setSelected([]);
            setPage((current) => current + 1);
          }}
        >
          หน้าถัดไป
        </Button>
      </div>
    </div>
  );
}

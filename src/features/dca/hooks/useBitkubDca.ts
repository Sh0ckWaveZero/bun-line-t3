import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/components/common/ToastProvider";
import { useAuthSession } from "@/lib/auth/session-context";
import { requestBitkub } from "@/features/exchanges/lib/bitkub-api";
import { useBitkubConnection } from "@/features/exchanges/hooks/useBitkubConnection";
import type { BitkubBuyStatusFilter } from "@/features/exchanges/types/bitkub";

const buyDateFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Asia/Bangkok",
});

const buySchema = z.object({
  id: z.string(),
  externalTradeIdentity: z.string(),
  externalOrderId: z.string(),
  spentTHB: z.string(),
  feeTHB: z.string(),
  receivedBTC: z.string(),
  rate: z.string(),
  executedAt: z.string(),
  imported: z.boolean(),
});
const pageSchema = z.object({
  buys: z.array(buySchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
const syncSchema = z.object({
  cached: z.number(),
  rejected: z.number(),
  nextCursor: z.string().nullable(),
});
const outcomesSchema = z.array(
  z.object({
    buyId: z.string(),
    status: z.enum(["imported", "already_imported", "legacy_conflict"]),
  }),
);

export function useBitkubDca(onImported: () => void, enabled = true) {
  const userId = useAuthSession()?.user?.id;
  const { showToast } = useToast();
  const { connection } = useBitkubConnection({ enabled });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<BitkubBuyStatusFilter>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncingHistory, setIsSyncingHistory] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [outcomes, setOutcomes] = useState<z.infer<typeof outcomesSchema>>([]);
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [search]);

  const history = useQuery({
    queryKey: [
      "bitkub-buys",
      userId,
      page,
      pageSize,
      debouncedSearch,
      statusFilter,
      dateFrom,
      dateTo,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search: debouncedSearch,
        status: statusFilter,
        dateFrom,
        dateTo,
      });
      return requestBitkub(
        `/api/exchanges/bitkub/buys?${params.toString()}`,
        pageSchema,
      );
    },
    enabled: Boolean(userId) && enabled && hasLoadedHistory,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const dateLabels = useMemo(
    () =>
      new Map(
        history.data?.buys.map((buy) => [
          buy.id,
          buyDateFormatter.format(new Date(buy.executedAt)),
        ]) ?? [],
      ),
    [history.data],
  );
  const runAction = async (
    action: () => Promise<void>,
    errorToastTitle?: string,
  ) => {
    setIsBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (cause) {
      const errorMessage =
        cause instanceof Error ? cause.message : "ไม่สามารถดำเนินการได้";
      setError(errorMessage);
      if (errorToastTitle) {
        showToast({
          title: errorToastTitle,
          description: errorMessage,
          type: "error",
        });
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    setSelected([]);
  };

  const handleStatusFilterChange = (value: BitkubBuyStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
    setSelected([]);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setPage(1);
    setSelected([]);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setPage(1);
    setSelected([]);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(1);
    setSelected([]);
  };

  useEffect(() => {
    const totalPages = Math.max(1, history.data?.totalPages ?? 1);
    if (page > totalPages) setPage(totalPages);
  }, [history.data?.totalPages, page]);

  const handleSync = (cursor?: string) => {
    setIsSyncingHistory(true);
    void runAction(async () => {
      const result = await requestBitkub(
        "/api/exchanges/bitkub/buys",
        syncSchema,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cursor }),
        },
      );
      setNextCursor(result.nextCursor);
      setSelected([]);
      setPage(1);
      const historyResult = await history.refetch();
      if (historyResult.isError) throw historyResult.error;
      setHasLoadedHistory(true);
      await connection.refetch();
      setMessage(
        `โหลดรายการซื้อที่ใช้ได้ ${result.cached} รายการ ข้าม ${result.rejected} รายการที่ข้อมูลไม่ครบหรือตัวเลขไม่ถูกต้อง`,
      );
    }).finally(() => setIsSyncingHistory(false));
  };

  const handleImport = () => {
    setIsImporting(true);
    void runAction(async () => {
      const result = await requestBitkub(
        "/api/dca/bitkub-import",
        outcomesSchema,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buyIds: selected }),
        },
      );
      setOutcomes(result);
      setSelected([]);
      await history.refetch();
      if (result.some((row) => row.status === "imported")) onImported();
      const importedCount = result.filter(
        (row) => row.status === "imported",
      ).length;
      const alreadyImportedCount = result.filter(
        (row) => row.status === "already_imported",
      ).length;
      const legacyConflictCount = result.filter(
        (row) => row.status === "legacy_conflict",
      ).length;
      const feedback: string[] = [];
      if (importedCount > 0) {
        feedback.push(`เพิ่ม ${importedCount} รายการใน DCA แล้ว`);
      }
      if (alreadyImportedCount > 0) {
        feedback.push(`ข้าม ${alreadyImportedCount} รายการที่นำเข้าแล้ว`);
      }
      if (legacyConflictCount > 0) {
        feedback.push(`พบ ${legacyConflictCount} รายการที่อาจซ้ำ โปรดตรวจสอบ`);
      }
      const description = feedback.join(" · ") || "ไม่มีรายการที่นำเข้าได้";
      showToast({
        title:
          legacyConflictCount > 0
            ? importedCount > 0
              ? "นำเข้าได้บางรายการ"
              : "พบรายการที่อาจซ้ำ"
            : importedCount > 0
              ? "นำเข้า DCA สำเร็จ"
              : alreadyImportedCount > 0
                ? "รายการถูกนำเข้าแล้ว"
                : "ไม่มีรายการให้เพิ่ม",
        description,
        type:
          legacyConflictCount > 0
            ? "warning"
            : importedCount > 0
              ? "success"
              : "info",
      });
    }, "นำเข้ารายการไม่สำเร็จ").finally(() => setIsImporting(false));
  };

  const visibleError =
    error || connection.error?.message || history.error?.message;
  return {
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
  };
}

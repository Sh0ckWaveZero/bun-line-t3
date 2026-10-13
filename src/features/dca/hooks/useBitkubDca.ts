import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuthSession } from "@/lib/auth/session-context";

const buyDateFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "Asia/Bangkok",
});

const statusSchema = z.object({
  connected: z.boolean(),
  configured: z.boolean(),
  keyHint: z.string().nullable(),
  lastSyncedAt: z.string().nullable(),
});
const balancesSchema = z.array(
  z.object({
    currency: z.string(),
    available: z.string(),
    reserved: z.string(),
    total: z.string(),
  }),
);
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

async function requestBitkub<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  let body: unknown;
  try {
    response = await fetch(url, { ...init, cache: "no-store" });
    body = await response.json();
  } catch {
    throw new Error("ไม่สามารถติดต่อระบบได้ กรุณาลองใหม่");
  }
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(body);
    throw new Error(
      error.success ? error.data.error : "ไม่สามารถโหลดข้อมูล Bitkub ได้",
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new Error("รูปแบบข้อมูลจากระบบไม่ถูกต้อง กรุณาลองใหม่");
  return parsed.data;
}

export function useBitkubDca(onImported: () => void) {
  const userId = useAuthSession()?.user?.id;
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [outcomes, setOutcomes] = useState<z.infer<typeof outcomesSchema>>([]);
  const connection = useQuery({
    queryKey: ["bitkub-connection", userId],
    queryFn: () =>
      requestBitkub("/api/exchanges/bitkub/connection", statusSchema),
    enabled: Boolean(userId),
  });
  const history = useQuery({
    queryKey: ["bitkub-buys", userId, page],
    queryFn: () =>
      requestBitkub(`/api/exchanges/bitkub/buys?page=${page}`, pageSchema),
    enabled: Boolean(userId),
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
  const balances = useQuery({
    queryKey: ["bitkub-balances", userId],
    queryFn: () =>
      requestBitkub("/api/exchanges/bitkub/balances", balancesSchema),
    enabled: Boolean(userId && connection.data?.connected),
    staleTime: 60_000,
  });

  const runAction = async (action: () => Promise<void>) => {
    setIsBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "ไม่สามารถดำเนินการได้",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleConnect = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    // Credentials stay in native inputs and this request only, never in React state or query mutations.
    const body = JSON.stringify({
      apiKey: data.get("apiKey"),
      apiSecret: data.get("apiSecret"),
    });
    form.reset();
    void runAction(async () => {
      await requestBitkub("/api/exchanges/bitkub/connection", statusSchema, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      setNextCursor(null);
      await connection.refetch();
      setMessage("เชื่อมต่อแล้ว สามารถโหลดประวัติซื้อและเลือกรายการนำเข้าได้");
    });
  };

  const handleDisconnect = () =>
    void runAction(async () => {
      await requestBitkub("/api/exchanges/bitkub/connection", statusSchema, {
        method: "DELETE",
      });
      setNextCursor(null);
      await connection.refetch();
      setMessage(
        "ยกเลิกการเชื่อมต่อแล้ว ข้อมูลรับรองถูกล้าง ประวัติที่โหลดและรายการ DCA ยังอยู่",
      );
    });

  const handleSync = (cursor?: string) =>
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
      await history.refetch();
      await connection.refetch();
      setMessage(
        `โหลดรายการซื้อที่ใช้ได้ ${result.cached} รายการ ข้าม ${result.rejected} รายการที่ข้อมูลไม่ครบ ยังไม่ปิดรายการ หรือตัวเลขไม่ถูกต้อง`,
      );
    });

  const handleImport = () =>
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
      setMessage(
        `นำเข้า ${result.filter((row) => row.status === "imported").length} รายการ นำเข้าแล้ว ${result.filter((row) => row.status === "already_imported").length} รายการ อาจซ้ำข้อมูลเดิม ${result.filter((row) => row.status === "legacy_conflict").length} รายการ`,
      );
    });

  const visibleError =
    error ||
    connection.error?.message ||
    history.error?.message ||
    (connection.data?.connected ? balances.error?.message : "");
  return {
    connection,
    history,
    dateLabels,
    balances,
    page,
    setPage,
    selected,
    setSelected,
    nextCursor,
    isBusy,
    message,
    outcomes,
    visibleError,
    handleConnect,
    handleDisconnect,
    handleSync,
    handleImport,
  };
}

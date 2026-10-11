import { beforeEach, expect, mock, test } from "bun:test";
import {
  parseBitkubDcaMessage,
  parseDcaTimestamp,
} from "@/features/dca/helpers/parse-bitkub-dca";

const sample =
  "🤗🎉 You Spent : 107.98 THB\nPrice : 2788624.59 THB/BTC\nYou Received : 0.00003872 BTC\n\nTime : 2026-10-11T08:00:10.027+07:00";
let orders: any[] = [];
let receipts: any[] = [];
let approval: any = null;
let failure: Error | null = null;
let commitFailure: Error | null = null;
let commitFailuresRemaining = 0;
let race: "event" | "order" | "other" | "serialization" | null = null;
const receiptFind = mock(
  async ({ where }: any) =>
    receipts.find((r) => r.webhookEventId === where.webhookEventId) ?? null,
);
const findOrder = mock(async ({ where }: any) => {
  const key = where.lineUserId_coin_executedAt;
  return (
    orders.find(
      (o) =>
        o.lineUserId === key.lineUserId &&
        o.coin === key.coin &&
        +o.executedAt === +key.executedAt,
    ) ?? null
  );
});
const create = mock(async ({ data }: any) => {
  if (failure) throw failure;
  const order = {
    ...data,
    id: `order-${orders.length}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "SUCCESS",
    note: null,
  };
  orders.push(order);
  return order;
});
const receiptCreate = mock(async ({ data }: any) => {
  receipts.push(data);
  return data;
});
const tx = {
  dcaWebhookReceipt: { findUnique: receiptFind, create: receiptCreate },
  dcaOrder: {
    findUnique: findOrder,
    findFirst: async () => orders.at(-1),
    create,
  },
};
const transaction = mock(async (fn: any) => {
  const oldOrders = [...orders],
    oldReceipts = [...receipts];
  try {
    if (race) {
      const kind = race;
      race = null;
      if (kind === "event")
        receipts.push({ webhookEventId: "e1", lineUserId: "u1" });
      if (kind === "order")
        orders.push({
          ...parseBitkubDcaMessage(sample),
          lineUserId: "u1",
          round: 1,
        });
      throw Object.assign(new Error("unique"), {
        code: kind === "serialization" ? "P2034" : "P2002",
      });
    }
    const result = await fn(tx);
    if (commitFailure && commitFailuresRemaining > 0) {
      commitFailuresRemaining--;
      throw commitFailure;
    }
    return result;
  } catch (error) {
    if ((error as any).code !== "P2002") {
      orders = oldOrders;
      receipts = oldReceipts;
    }
    throw error;
  }
});
const approvalFind = mock(async () => approval);
const approvalUpdate = mock(async ({ data }: any) => ({
  ...approval,
  ...data,
}));
mock.module("@/lib/database/db", () => ({
  db: {
    ...tx,
    $transaction: transaction,
    lineApprovalRequest: { findUnique: approvalFind, update: approvalUpdate },
  },
}));
const reply = mock(async (_req: any, _messages: any) => {});
mock.module("@/lib/utils/line-utils", () => ({
  sendMessage: reply,
  sendLoadingAnimation: mock(async () => {}),
}));
const emitted = mock(() => {});
mock.module("@/features/dca/lib/event-manager", () => ({
  dcaEventManager: { emit: emitted },
}));
mock.module("@/features/dca/services/bitkub.service.server", () => ({
  getBTCPrice: mock(),
  calculatePnLPercent: mock(),
}));
mock.module("@/features/line/line-utils/flex-messages", () => ({
  createDcaSummaryFlexMessage: mock(),
}));
const checkApproval = mock(async (_req: any) => true);
mock.module("@/features/line/commands/handleApprovalCheck", () => ({
  handleApprovalCheck: checkApproval,
}));
for (const name of ["Location", "Sticker", "Postback"])
  mock.module(`@/features/line/commands/handle${name}`, () => ({
    [`handle${name}`]: mock(async () => {}),
  }));
const { handleDcaCommand } =
  await import("@/features/line/commands/handleDcaCommand");
mock.module("@/features/line/commands/handleText", () => ({
  handleText: async (req: any, text: string) =>
    handleDcaCommand(req, text.split(/\s+/).slice(1)),
}));
const { lineService } = await import("@/features/line/services/line.server");
const { dcaService } =
  await import("@/features/dca/services/dca.service.server");
const { canAutoRecordDca } = await import("@/features/line/line/permissions");
const authSession = mock(async () => ({
  user: { id: "admin" },
  isAdmin: true,
}));
mock.module("@/lib/auth/auth", () => ({ getServerAuthSession: authSession }));
mock.module("@tanstack/react-router", () => ({
  createFileRoute: () => (config: unknown) => config,
}));
const { PATCH } = await import("@/routes/api/line/permissions");
const event = (
  text = sample,
  userId = "u1",
  webhookEventId = "e1",
  sourceType = "user",
) => ({
  type: "message",
  webhookEventId,
  source: { type: sourceType, userId },
  replyToken: `reply-${webhookEventId}`,
  message: { type: "text", text },
});
const response: any = {
  status: () => response,
  json: (data: any) => data,
  send: (data: any) => data,
};
const run = (events: any[]) =>
  lineService.handleEvent({ body: { events } }, response);
const input = () => ({ ...parseBitkubDcaMessage(sample)!, lineUserId: "u1" });
beforeEach(() => {
  orders = [];
  receipts = [];
  failure = null;
  commitFailure = null;
  commitFailuresRemaining = 0;
  race = null;
  approval = { status: "APPROVED", canAutoRecordDca: true, expiresAt: null };
  for (const fn of [
    receiptFind,
    findOrder,
    create,
    receiptCreate,
    transaction,
    approvalFind,
    approvalUpdate,
    reply,
    emitted,
    checkApproval,
    authSession,
  ])
    fn.mockClear();
  checkApproval.mockImplementation(async () => true);
  authSession.mockImplementation(async () => ({
    user: { id: "admin" },
    isAdmin: true,
  }));
});

test("receipt preserves exact sample fields and timezone", () => {
  expect(parseBitkubDcaMessage(sample)).toEqual({
    coin: "BTC",
    amountTHB: 107.98,
    pricePerCoin: 2788624.59,
    coinReceived: 0.00003872,
    executedAt: new Date("2026-10-11T01:00:10.027Z"),
  });
  expect(parseDcaTimestamp("2026-10-11 08:00:10.027")?.toISOString()).toBe(
    "2026-10-11T01:00:10.027Z",
  );
  expect(
    parseDcaTimestamp("2026-10-11T08:00:10.027-04:00")?.toISOString(),
  ).toBe("2026-10-11T12:00:10.027Z");
  expect(parseDcaTimestamp("2026-10-11T08:00:10.027Z")?.toISOString()).toBe(
    "2026-10-11T08:00:10.027Z",
  );
});
test("invalid or ambiguous receipts are rejected", () => {
  for (const text of [
    sample + " extra",
    "extra " + sample,
    sample.replace("107.98", "0"),
    sample.replace("107.98", "1e999"),
    sample.replace("0.00003872", "0.1.2"),
    sample.replace("107.98", "1,07.98"),
    sample.replace("0.00003872 BTC", "0.00003872 ETH"),
    sample.replace("2026-10-11", "2026-02-30"),
    sample.replace("08:00:10", "24:00:10"),
    sample.replace("+07:00", "+07:99"),
  ])
    expect(parseBitkubDcaMessage(text)).toBeNull();
});
test("ordinary text, incomplete receipts and non-private receipts avoid all DB work", async () => {
  await run([
    null,
    "invalid",
    event("hello"),
    event("Time : tomorrow"),
    event(sample, "u1", "g1", "group"),
    event(sample, "u1", "r1", "room"),
    event(sample + " extra"),
  ]);
  expect(approvalFind).not.toHaveBeenCalled();
  expect(transaction).not.toHaveBeenCalled();
  expect(checkApproval).not.toHaveBeenCalled();
  expect(reply).not.toHaveBeenCalled();
});
test("approved private receipt creates and replies once, replay is silent, copied text replies duplicate", async () => {
  await run([event()]);
  await run([event()]);
  await run([event(sample, "u1", "e2")]);
  expect(orders).toHaveLength(1);
  expect(receipts).toHaveLength(2);
  expect(reply).toHaveBeenCalledTimes(2);
  expect(emitted).toHaveBeenCalledTimes(1);
  expect(reply.mock.calls[0]![1][0].text).toContain("107.98");
  expect(reply.mock.calls[1]![1][0].text).toContain("ไม่บันทึกซ้ำ");
});
test("auto permission denies default off, unapproved and expired records silently", async () => {
  for (const record of [
    null,
    { status: "APPROVED" },
    { status: "PENDING", canAutoRecordDca: true },
    { status: "APPROVED", canAutoRecordDca: true, expiresAt: new Date(0) },
  ]) {
    approval = record;
    expect(await canAutoRecordDca("u1")).toBe(false);
    await run([event()]);
  }
  expect(transaction).not.toHaveBeenCalled();
  expect(reply).not.toHaveBeenCalled();
  expect(checkApproval).not.toHaveBeenCalled();
});
test("each batch event has its own identity, approval and reply token", async () => {
  approval.canAutoRecordDca = false;
  await run([
    event("hello"),
    event(`/dca add ${sample}`, "u1", "e1"),
    event(`/dca add ${sample}`, "u2", "e2"),
  ]);
  expect(orders.map((o) => o.lineUserId)).toEqual(["u1", "u2"]);
  expect(
    checkApproval.mock.calls.map(([req]) => req.body.events[0].source.userId),
  ).toEqual(["u1", "u2"]);
  expect(
    reply.mock.calls.map(([req]) => req.body.events[0].replyToken),
  ).toEqual(["reply-e1", "reply-e2"]);
});
test("unapproved explicit command is denied, manual command remains compatible without event id", async () => {
  checkApproval.mockImplementation(async () => false);
  await run([event(`/dca add ${sample}`)]);
  expect(orders).toHaveLength(0);
  checkApproval.mockImplementation(async () => true);
  const manual: any = event(
    "/dca add 107.98 BTC 0.00003872 2788624.59 2026-10-11",
  );
  delete manual.webhookEventId;
  await run([manual]);
  expect(orders[0].executedAt.toISOString()).toBe("2026-10-11T01:00:00.000Z");
});
test("failed transaction rolls receipt back and webhook failure can retry", async () => {
  failure = new Error("database unavailable");
  await expect(run([event()])).rejects.toThrow("database unavailable");
  expect(receipts).toHaveLength(0);
  failure = null;
  await run([event()]);
  expect(orders).toHaveLength(1);
  expect(receipts).toHaveLength(1);
});
test("receipt remains replayed after order deletion", async () => {
  await dcaService.createLineOrder(input(), "e1");
  orders = [];
  expect(await dcaService.createLineOrder(input(), "e1")).toEqual({
    status: "replayed",
  });
  expect(orders).toHaveLength(0);
});
test("unique event race replays, unique order race records receipt as duplicate, unrelated conflict throws", async () => {
  race = "event";
  expect((await dcaService.createLineOrder(input(), "e1")).status).toBe(
    "replayed",
  );
  receipts = [];
  race = "order";
  expect((await dcaService.createLineOrder(input(), "e2")).status).toBe(
    "duplicate",
  );
  expect(receipts).toHaveLength(1);
  receipts = [];
  orders = [];
  race = "other";
  await expect(dcaService.createLineOrder(input(), "e3")).rejects.toThrow(
    "unique",
  );
});
test("permission API requires admin and validates boolean before updating", async () => {
  const request = (value: unknown) =>
    new Request("http://localhost/api/line/permissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineUserId: "u1", canAutoRecordDca: value }),
    });
  authSession.mockImplementation(async () => ({
    user: { id: "user" },
    isAdmin: false,
  }));
  expect((await PATCH(request(true))).status).toBe(403);
  expect(approvalUpdate).not.toHaveBeenCalled();
  authSession.mockImplementation(async () => ({
    user: { id: "admin" },
    isAdmin: true,
  }));
  expect((await PATCH(request("true"))).status).toBe(400);
  expect(approvalUpdate).not.toHaveBeenCalled();
  expect((await PATCH(request(true))).status).toBe(200);
  expect(approvalUpdate.mock.calls[0]![0].data).toEqual({
    canAutoRecordDca: true,
  });
});

test("serialization conflicts retry the complete atomic transaction", async () => {
  race = "serialization";
  expect((await dcaService.createLineOrder(input(), "e1")).status).toBe(
    "created",
  );
  expect(transaction).toHaveBeenCalledTimes(2);
  expect(orders).toHaveLength(1);
  expect(receipts).toHaveLength(1);
});

for (const originalCode of ["40001", "40P01"]) {
  test(`adapter commit conflict ${originalCode} retries after rolling back order and receipt`, async () => {
    commitFailure = new Error("adapter conflict", {
      cause: { kind: "TransactionWriteConflict", originalCode },
    });
    commitFailuresRemaining = 1;
    expect((await dcaService.createLineOrder(input(), "e1")).status).toBe(
      "created",
    );
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(orders).toHaveLength(1);
    expect(receipts).toHaveLength(1);
    expect(orders[0].round).toBe(1);
  });
}

test("adapter commit conflicts stop after five attempts and preserve rollback", async () => {
  commitFailure = new Error("adapter conflict", {
    cause: { kind: "TransactionWriteConflict", originalCode: "40001" },
  });
  commitFailuresRemaining = 6;
  await expect(dcaService.createLineOrder(input(), "e1")).rejects.toBe(
    commitFailure,
  );
  expect(transaction).toHaveBeenCalledTimes(5);
  expect(orders).toHaveLength(0);
  expect(receipts).toHaveLength(0);
});

for (const cause of [
  { kind: "ConnectionClosed", originalCode: "40001" },
  { kind: "TransactionWriteConflict", originalCode: "08006" },
]) {
  test(`unrelated adapter failure ${cause.kind}/${cause.originalCode} propagates without retry`, async () => {
    commitFailure = new Error("unrelated adapter failure", { cause });
    commitFailuresRemaining = 1;
    await expect(dcaService.createLineOrder(input(), "e1")).rejects.toBe(
      commitFailure,
    );
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(orders).toHaveLength(0);
    expect(receipts).toHaveLength(0);
  });
}

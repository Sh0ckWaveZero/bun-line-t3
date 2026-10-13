import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { env } from "@/env.mjs";
import { db } from "@/lib/database/db";
import { bitkubCredentialsSchema } from "../lib/bitkub-credentials";
import type {
  BitkubBuyPage,
  BitkubBuyStatusFilter,
  BitkubConnectionStatus,
  BitkubSyncResult,
} from "../types/bitkub";

const BITKUB_ORIGIN = "https://api.bitkub.com";
const BitkubDecimal = Prisma.Decimal.clone({ precision: 60 });
const decimalSchema = z
  .string()
  .max(60)
  .regex(/^\d+(?:\.\d{1,18})?$/);
const timestampSchema = z.number().int().positive().max(8_640_000_000_000_000);
export const bitkubCursorSchema = z
  .string()
  .min(1)
  .max(2048)
  .regex(/^[A-Za-z0-9+/=]+$/);
const envelopeSchema = z.object({
  version: z.literal(1),
  iv: z.string(),
  tag: z.string(),
  data: z.string(),
});
const historySchema = z.object({
  error: z.literal(0),
  result: z.array(z.unknown()).max(100),
  pagination: z.object({
    cursor: bitkubCursorSchema.nullish(),
    has_next: z.boolean(),
  }),
});
const sideSchema = z.object({ side: z.enum(["buy", "sell"]) });
const buySchema = z.object({
  txn_id: z.string().min(1).max(256),
  order_id: z.string().min(1).max(256),
  side: z.literal("buy"),
  rate: decimalSchema,
  amount: decimalSchema,
  fee: decimalSchema,
  ts: timestampSchema,
  order_closed_at: timestampSchema.nullish(),
});
const parseProvider = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error("Invalid Bitkub server data");
  return parsed.data;
};

const encryptionKey = () => {
  const parsed = z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/)
    .safeParse(env.BITKUB_CREDENTIAL_ENCRYPTION_KEY);
  if (!parsed.success)
    throw new Error("Bitkub credential encryption is not configured");
  return Buffer.from(parsed.data, "hex");
};

const encryptCredentials = (
  userId: string,
  credentials: z.infer<typeof bitkubCredentialsSchema>,
) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(userId));
  const data = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);
  return JSON.stringify({
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  });
};

const decryptCredentials = (userId: string, encrypted: string) => {
  const envelope = parseProvider(envelopeSchema, JSON.parse(encrypted));
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAAD(Buffer.from(userId));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, "base64")),
    decipher.final(),
  ]);
  return parseProvider(
    bitkubCredentialsSchema,
    JSON.parse(plaintext.toString("utf8")),
  );
};

// Only the fixed BTC/THB order-history endpoint can receive authenticated requests.
const readBitkub = async (
  credentials: z.infer<typeof bitkubCredentialsSchema>,
  cursor?: string,
): Promise<unknown> => {
  const timeResponse = await fetch(`${BITKUB_ORIGIN}/api/v3/servertime`, {
    method: "GET",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!timeResponse.ok) throw new Error("Bitkub server time unavailable");
  const timestamp = parseProvider(timestampSchema, await timeResponse.json());
  const query = new URLSearchParams({
    sym: "BTC_THB",
    pagination_type: "keyset",
    lmt: "50",
  });
  if (cursor) query.set("cursor", bitkubCursorSchema.parse(cursor));
  const path = `/api/v3/market/my-order-history?${query.toString()}`;
  const signature = createHmac("sha256", credentials.apiSecret)
    .update(`${timestamp}GET${path}`)
    .digest("hex");
  const response = await fetch(`${BITKUB_ORIGIN}${path}`, {
    method: "GET",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-BTK-APIKEY": credentials.apiKey,
      "X-BTK-TIMESTAMP": String(timestamp),
      "X-BTK-SIGN": signature,
    },
  });
  if (!response.ok) throw new Error("Bitkub read request failed");
  return response.json();
};

const getCredentials = async (userId: string) => {
  const connection = await db.bitkubConnection.findUnique({
    where: { userId },
    select: { encryptedCredentials: true },
  });
  if (!connection?.encryptedCredentials)
    throw new Error("Bitkub is disconnected");
  return decryptCredentials(userId, connection.encryptedCredentials);
};

const getStatus = async (userId: string): Promise<BitkubConnectionStatus> => {
  const connection = await db.bitkubConnection.findUnique({
    where: { userId },
    select: { keyHint: true, connectedAt: true, lastSyncedAt: true },
  });
  return {
    connected: Boolean(connection?.connectedAt),
    configured: Boolean(env.BITKUB_CREDENTIAL_ENCRYPTION_KEY),
    keyHint: connection?.keyHint ?? null,
    lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
  };
};

const connect = async (
  userId: string,
  input: z.infer<typeof bitkubCredentialsSchema>,
) => {
  const credentials = bitkubCredentialsSchema.parse(input);
  const encryptedCredentials = encryptCredentials(userId, credentials);
  parseProvider(historySchema, await readBitkub(credentials));
  const data = {
    encryptedCredentials,
    keyHint:
      credentials.apiKey.length >= 8 ? `…${credentials.apiKey.slice(-4)}` : "…",
    connectedAt: new Date(),
  };
  await db.bitkubConnection.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  return getStatus(userId);
};

const disconnect = async (userId: string) => {
  await db.bitkubConnection.updateMany({
    where: { userId },
    data: { encryptedCredentials: null, keyHint: null, connectedAt: null },
  });
  return getStatus(userId);
};

const syncBuys = async (
  userId: string,
  cursor?: string,
): Promise<BitkubSyncResult> => {
  const response = parseProvider(
    historySchema,
    await readBitkub(await getCredentials(userId), cursor),
  );
  if (response.pagination.has_next && !response.pagination.cursor)
    throw new Error("Invalid Bitkub pagination");
  const buys: Prisma.BitkubBtcBuyCreateManyInput[] = [];
  let rejected = 0;
  for (const raw of response.result) {
    const side = sideSchema.safeParse(raw);
    if (side.success && side.data.side === "sell") continue;
    const parsed = buySchema.safeParse(raw);
    if (!parsed.success) {
      rejected++;
      continue;
    }
    const row = parsed.data;
    const amountTHB = new BitkubDecimal(row.amount);
    const feeTHB = new BitkubDecimal(row.fee);
    const rate = new BitkubDecimal(row.rate);
    // my-order-history buy amount is quote THB; fee is THB. Do not infer per-fill fields from order-info.
    const spentTHB = amountTHB.plus(feeTHB);
    if (!amountTHB.gt(0) || !rate.gt(0)) {
      rejected++;
      continue;
    }
    const receivedBTC = amountTHB.div(rate).toDecimalPlaces(18);
    // Keep arithmetic decimal until the existing Float-based DCA boundary.
    if (
      !receivedBTC.gt(0) ||
      [amountTHB, feeTHB, rate, spentTHB, receivedBTC].some((value) =>
        value.gte("100000000000000000000"),
      )
    ) {
      rejected++;
      continue;
    }
    buys.push({
      userId,
      externalTradeIdentity: row.txn_id,
      externalOrderId: row.order_id,
      amountTHB,
      feeTHB,
      rate,
      spentTHB,
      receivedBTC,
      executedAt: new Date(row.ts),
    });
  }
  // Preserve each cached observation; repeated history pages cannot overwrite imported accounting.
  if (buys.length > 0)
    await db.bitkubBtcBuy.createMany({ data: buys, skipDuplicates: true });
  await db.bitkubConnection.updateMany({
    where: { userId, connectedAt: { not: null } },
    data: { lastSyncedAt: new Date() },
  });
  return {
    cached: buys.length,
    rejected,
    nextCursor: response.pagination.has_next
      ? (response.pagination.cursor ?? null)
      : null,
  };
};

const listBuys = async (
  userId: string,
  params: {
    page: number;
    pageSize: number;
    search: string;
    status: BitkubBuyStatusFilter;
    dateFrom: string;
    dateTo: string;
  },
): Promise<BitkubBuyPage> => {
  const where: Prisma.BitkubBtcBuyWhereInput = { userId };
  const search = params.search.trim();
  if (search) {
    where.OR = [
      { externalTradeIdentity: { contains: search, mode: "insensitive" } },
      { externalOrderId: { contains: search, mode: "insensitive" } },
    ];
  }
  if (params.status === "imported") where.dcaOrder = { isNot: null };
  if (params.status === "ready") where.dcaOrder = { is: null };
  if (params.dateFrom || params.dateTo) {
    const dateFilter: NonNullable<Prisma.BitkubBtcBuyWhereInput["executedAt"]> =
      {
        ...(params.dateFrom && {
          gte: new Date(`${params.dateFrom}T00:00:00+07:00`),
        }),
        ...(params.dateTo && {
          lt: getBangkokDayAfter(params.dateTo),
        }),
      };
    where.executedAt = dateFilter;
  }

  const [buys, total] = await Promise.all([
    db.bitkubBtcBuy.findMany({
      where,
      orderBy: [{ executedAt: "desc" }, { id: "desc" }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { dcaOrder: { select: { id: true } } },
    }),
    db.bitkubBtcBuy.count({ where }),
  ]);
  return {
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize),
    buys: buys.map((buy) => ({
      id: buy.id,
      externalTradeIdentity: buy.externalTradeIdentity,
      externalOrderId: buy.externalOrderId,
      spentTHB: buy.spentTHB.toString(),
      feeTHB: buy.feeTHB.toString(),
      receivedBTC: buy.receivedBTC.toString(),
      rate: buy.rate.toString(),
      executedAt: buy.executedAt.toISOString(),
      imported: Boolean(buy.dcaOrder),
    })),
  };
};

function getBangkokDayAfter(dateValue: string): Date {
  const endExclusive = new Date(`${dateValue}T00:00:00+07:00`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return endExclusive;
}

export const bitkubService = {
  getStatus,
  connect,
  disconnect,
  syncBuys,
  listBuys,
};

import { z } from "zod";
import type { ParsedBitkubDcaMessage } from "../types";

export const parsedDcaSchema = z.object({
  coin: z.string().regex(/^[A-Z][A-Z0-9]{0,19}$/),
  amountTHB: z.number().finite().positive(),
  pricePerCoin: z.number().finite().positive(),
  coinReceived: z.number().finite().positive(),
  executedAt: z.date(),
});

export const hasBitkubDcaLabels = (text: string): boolean =>
  ["You Spent", "Price", "You Received", "Time"].every((label) =>
    new RegExp(`${label}\\s*:`).test(text),
  );

const numeric = "(?:\\d+|\\d{1,3}(?:,\\d{3})+)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?";
const receiptPattern = new RegExp(
  `^(?:[\\p{Extended_Pictographic}\\uFE0F\\u200D\\s])*You Spent\\s*:\\s*(${numeric})\\s+THB\\s+Price\\s*:\\s*(${numeric})\\s+THB/([A-Za-z][A-Za-z0-9]{0,19})\\s+You Received\\s*:\\s*(${numeric})\\s+([A-Za-z][A-Za-z0-9]{0,19})\\s+Time\\s*:\\s*(\\d{4}-\\d{2}-\\d{2}[T ]\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?(?:Z|[+-]\\d{2}:\\d{2})?)$`,
  "u",
);

export const parseDcaTimestamp = (value: string): Date | null => {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})?$/.exec(
      value,
    );
  if (!match) return null;
  const [, year, month, day, hour, minute, second, fraction, zone] = match;
  const parts = [year, month, day, hour, minute, second].map(Number);
  const calendar = new Date(0);
  calendar.setUTCFullYear(parts[0]!, parts[1]! - 1, parts[2]!);
  calendar.setUTCHours(
    parts[3]!,
    parts[4]!,
    parts[5]!,
    Number((fraction ?? "").padEnd(3, "0")),
  );
  if (
    calendar.getUTCFullYear() !== parts[0] ||
    calendar.getUTCMonth() + 1 !== parts[1] ||
    calendar.getUTCDate() !== parts[2] ||
    parts[3]! > 23 ||
    parts[4]! > 59 ||
    parts[5]! > 59
  )
    return null;
  if (
    zone &&
    zone !== "Z" &&
    (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59)
  )
    return null;
  const date = new Date(value.replace(" ", "T") + (zone ? "" : "+07:00"));
  return Number.isFinite(date.getTime()) ? date : null;
};

export const parseBitkubDcaMessage = (
  message: string,
): ParsedBitkubDcaMessage | null => {
  const match = receiptPattern.exec(message.trim());
  if (!match || match[3]!.toUpperCase() !== match[5]!.toUpperCase())
    return null;
  const executedAt = parseDcaTimestamp(match[6]!);
  const result = parsedDcaSchema.safeParse({
    coin: match[3]!.toUpperCase(),
    amountTHB: Number(match[1]!.replace(/,/g, "")),
    pricePerCoin: Number(match[2]!.replace(/,/g, "")),
    coinReceived: Number(match[4]!.replace(/,/g, "")),
    executedAt,
  });
  return result.success ? result.data : null;
};

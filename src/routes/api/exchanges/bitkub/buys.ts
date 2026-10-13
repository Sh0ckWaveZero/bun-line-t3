import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  bitkubCursorSchema,
  bitkubService,
} from "@/features/exchanges/services/bitkub.service.server";
import {
  readBitkubJson,
  withBitkubOwner,
} from "@/features/exchanges/services/bitkub-request.server";

const syncSchema = z.strictObject({ cursor: bitkubCursorSchema.optional() });
const dateOnlySchema = z
  .string()
  .refine((value) => {
    if (value === "") return true;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }, "วันที่ไม่ถูกต้อง")
  .default("");
const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).default(""),
    status: z.enum(["all", "ready", "imported"]).default("all"),
    dateFrom: dateOnlySchema,
    dateTo: dateOnlySchema,
  })
  .superRefine(({ dateFrom, dateTo }, context) => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      context.addIssue({
        code: "custom",
        path: ["dateTo"],
        message: "วันที่สิ้นสุดต้องไม่อยู่ก่อนวันที่เริ่มต้น",
      });
    }
  });

export const Route = createFileRoute("/api/exchanges/bitkub/buys")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withBitkubOwner(request, (userId) => {
          const searchParams = new URL(request.url).searchParams;
          const query = listQuerySchema.parse({
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
            search: searchParams.get("search") ?? "",
            status: searchParams.get("status") ?? "all",
            dateFrom: searchParams.get("dateFrom") ?? "",
            dateTo: searchParams.get("dateTo") ?? "",
          });
          return bitkubService.listBuys(userId, query);
        }),
      POST: ({ request }) =>
        withBitkubOwner(request, async (userId) =>
          bitkubService.syncBuys(
            userId,
            syncSchema.parse(await readBitkubJson(request)).cursor,
          ),
        ),
    },
  },
});

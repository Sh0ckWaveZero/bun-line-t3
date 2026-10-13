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
export const Route = createFileRoute("/api/exchanges/bitkub/buys")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withBitkubOwner(request, (userId) =>
          bitkubService.listBuys(
            userId,
            z.coerce
              .number()
              .int()
              .min(1)
              .max(100_000)
              .parse(new URL(request.url).searchParams.get("page") ?? 1),
          ),
        ),
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

import { createFileRoute } from "@tanstack/react-router";
import {
  bitkubImportSchema,
  importBitkubBuys,
} from "@/features/dca/services/bitkub-import.server";
import {
  readBitkubJson,
  withBitkubOwner,
} from "@/features/exchanges/services/bitkub-request.server";

export const Route = createFileRoute("/api/dca/bitkub-import")({
  server: {
    handlers: {
      POST: ({ request }) =>
        withBitkubOwner(request, async (userId) =>
          importBitkubBuys(
            userId,
            bitkubImportSchema.parse(await readBitkubJson(request)).buyIds,
          ),
        ),
    },
  },
});

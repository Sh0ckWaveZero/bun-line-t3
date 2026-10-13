import { createFileRoute } from "@tanstack/react-router";
import {
  bitkubCredentialsSchema,
  bitkubService,
} from "@/features/exchanges/services/bitkub.service.server";
import {
  readBitkubJson,
  withBitkubOwner,
} from "@/features/exchanges/services/bitkub-request.server";

export const Route = createFileRoute("/api/exchanges/bitkub/connection")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withBitkubOwner(request, (userId) => bitkubService.getStatus(userId)),
      POST: ({ request }) =>
        withBitkubOwner(request, async (userId) =>
          bitkubService.connect(
            userId,
            bitkubCredentialsSchema.parse(await readBitkubJson(request)),
          ),
        ),
      DELETE: ({ request }) =>
        withBitkubOwner(request, (userId) => bitkubService.disconnect(userId)),
    },
  },
});

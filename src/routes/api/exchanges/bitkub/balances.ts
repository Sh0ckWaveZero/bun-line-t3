import { createFileRoute } from "@tanstack/react-router";
import { bitkubService } from "@/features/exchanges/services/bitkub.service.server";
import { withBitkubOwner } from "@/features/exchanges/services/bitkub-request.server";

export const Route = createFileRoute("/api/exchanges/bitkub/balances")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withBitkubOwner(request, (userId) => bitkubService.getBalances(userId)),
    },
  },
});

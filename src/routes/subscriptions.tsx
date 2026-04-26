import { createFileRoute } from "@tanstack/react-router"
import { requireAuth } from "@/lib/auth/route-guard"
import { SubscriptionsPage } from "@/features/subscriptions/pages/SubscriptionsPage"

export const Route = createFileRoute("/subscriptions")({
  beforeLoad: requireAuth,
  component: SubscriptionsPage,
})

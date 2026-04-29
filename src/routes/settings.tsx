import { createFileRoute } from "@tanstack/react-router"
import { requireAuth } from "@/lib/auth/route-guard"
import { SettingsPage } from "@/features/settings/pages/SettingsPage"

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAuth,
  component: SettingsPage,
})

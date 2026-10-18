import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/route-guard";
import { BodyWeightPage } from "@/features/body-weight/pages/BodyWeightPage";

export const Route = createFileRoute("/body-weight")({
  beforeLoad: requireAuth,
  component: BodyWeightPage,
});

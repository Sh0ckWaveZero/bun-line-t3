import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/route-guard";
import { ExpensesPage } from "@/features/expenses/pages/ExpensesPage";

export const Route = createFileRoute("/expenses")({
  beforeLoad: requireAuth,
  component: ExpensesPage,
});

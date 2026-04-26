import { createFileRoute } from "@tanstack/react-router";
import { LogoutPage } from "@/features/auth/pages";

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
});

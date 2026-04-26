import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/pages";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

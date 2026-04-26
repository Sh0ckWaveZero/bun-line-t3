import { createFileRoute } from "@tanstack/react-router";
import { HelpPage } from "@/features/help/pages/HelpPage";

export const Route = createFileRoute("/help")({
  component: HelpPage,
});

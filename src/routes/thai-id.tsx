import { createFileRoute } from "@tanstack/react-router";
import { ThaiIdPage } from "@/features/tools/pages";

export const Route = createFileRoute("/thai-id")({
  component: ThaiIdPage,
});

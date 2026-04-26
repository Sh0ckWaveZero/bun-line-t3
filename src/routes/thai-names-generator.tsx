import { createFileRoute } from "@tanstack/react-router";
import { ThaiNamesGeneratorPage } from "@/features/tools/pages";

export const Route = createFileRoute("/thai-names-generator")({
  component: ThaiNamesGeneratorPage,
});

import { createFileRoute } from "@tanstack/react-router";
import ThaiIdGenerate from "@/features/tools/components/ThaiIdGenerate";

function ThaiIdPage() {
  return <ThaiIdGenerate />;
}

export const Route = createFileRoute("/thai-id")({
  component: ThaiIdPage,
});

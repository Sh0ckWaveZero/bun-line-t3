import { createFileRoute } from "@tanstack/react-router";
import ThaiIdGenerate from "@/components/thai-id/ThaiIdGenerate";

function ThaiIdPage() {
  return <ThaiIdGenerate />;
}

export const Route = createFileRoute("/thai-id")({
  component: ThaiIdPage,
});

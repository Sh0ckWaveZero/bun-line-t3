import { createFileRoute } from "@tanstack/react-router";
import { RoongiPage } from "@/features/roongi/pages/RoongiPage";

export const Route = createFileRoute("/roongi")({ component: RoongiPage });

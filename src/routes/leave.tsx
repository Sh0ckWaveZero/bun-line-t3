import { createFileRoute } from "@tanstack/react-router";
import { LeaveForm } from "@/components/attendance/LeaveForm";

function LeavePage() {
  return (
    <main className="flex h-full min-h-screen w-full flex-col items-center justify-center p-4 transition-colors duration-500 sm:p-6 lg:p-8">
      <LeaveForm />
    </main>
  );
}

export const Route = createFileRoute("/leave")({
  component: LeavePage,
});

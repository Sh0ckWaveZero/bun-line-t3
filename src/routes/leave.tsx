import { createFileRoute } from "@tanstack/react-router";
import { LeaveForm } from "@/components/attendance/LeaveForm";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useLineApproval } from "@/hooks/useLineApproval";

function LeavePage() {
  const { needsApproval } = useLineApproval();

  return (
    <>
      {/* Pending Approval Modal */}
      <PendingApprovalModal open={needsApproval} />

      <main className="min-h-screen w-full">
        <LeaveForm />
      </main>
    </>
  );
}

export const Route = createFileRoute("/leave")({
  component: LeavePage,
});

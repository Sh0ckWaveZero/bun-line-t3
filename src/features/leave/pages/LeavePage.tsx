import { LeaveForm } from "@/features/attendance/components/LeaveForm";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useLineApproval } from "@/lib/auth/hooks/useLineApproval";

export function LeavePage() {
  const { needsApproval } = useLineApproval();

  return (
    <>
      <PendingApprovalModal open={needsApproval} />

      <main className="min-h-screen w-full">
        <LeaveForm />
      </main>
    </>
  );
}

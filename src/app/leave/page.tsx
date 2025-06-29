import { LeaveForm } from "@/components/attendance/LeaveForm";

export default function LeavePage() {
  return (
    <main className="flex h-full min-h-screen w-full flex-col items-center justify-center p-4 transition-colors duration-500 sm:p-6 lg:p-8">
      <LeaveForm />
    </main>
  );
}

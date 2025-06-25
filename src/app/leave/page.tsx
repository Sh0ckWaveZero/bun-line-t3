import { LeaveForm } from '@/components/attendance/LeaveForm';

export default function LeavePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] p-4 sm:p-6 lg:p-8d">
      <LeaveForm />
    </main>
  );
}

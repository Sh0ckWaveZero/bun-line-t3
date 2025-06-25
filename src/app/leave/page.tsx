import { LeaveForm } from "@/components/attendance/LeaveForm";
import Link from "next/link";

export default function LeavePage() {
  return (
    <main className="flex h-full min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] p-4 transition-colors duration-500 sm:p-6 lg:p-8">
      <LeaveForm />
      <Link
        href="/leave/calendar"
        className="mt-4 inline-flex items-center rounded-lg border-2 border-blue-600 bg-blue-50 px-4 py-2 text-base font-medium text-blue-900 shadow-md transition-colors hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-800"
      >
        ดูปฏิทินการลา
      </Link>
    </main>
  );
}

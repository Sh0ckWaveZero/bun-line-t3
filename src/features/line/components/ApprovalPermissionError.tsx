import { useNavigate } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";

export function ApprovalPermissionError({ message }: { message: string }) {
  const navigate = useNavigate();

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#f5f7f8] px-4 py-7 text-slate-900 dark:bg-[#0d0f11] dark:text-slate-100">
      <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-slate-200/80 bg-white px-8 py-10 text-center shadow-[0_10px_34px_rgba(16,24,40,0.05)] dark:border-white/[0.08] dark:bg-[#151719] dark:shadow-none">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-500/10 text-rose-700 dark:text-rose-300">
          <CircleAlert className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
          ไม่มีสิทธิ์เข้าถึง
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {message}
        </p>
        <button
          type="button"
          onClick={() => void navigate({ to: "/dashboard" })}
          className="mt-6 inline-flex h-10 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08]"
        >
          กลับหน้าหลัก
        </button>
      </div>
    </main>
  );
}

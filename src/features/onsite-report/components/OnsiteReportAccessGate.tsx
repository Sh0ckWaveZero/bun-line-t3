"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useOnsiteReportAccess } from "../hooks/useOnsiteReportAccess";

/**
 * ครอบหน้า Onsite Service Report — ไม่มีสิทธิ์ก็ไม่ mount เนื้อหาข้างใน
 * (hook ข้างในจึงไม่ยิง API ที่จะได้ 403) การบังคับสิทธิ์จริงอยู่ที่ API เสมอ ตัวนี้เป็นแค่ UX
 */
export const OnsiteReportAccessGate = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { data: canUse, isLoading, isError, error } = useOnsiteReportAccess();

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6" aria-busy="true">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/[0.08]" />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error instanceof Error ? error.message : "ไม่สามารถตรวจสิทธิ์ได้"}
        </p>
      </main>
    );
  }

  if (!canUse) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6">
        <ShieldAlert
          className="mx-auto size-10 text-amber-500"
          aria-hidden="true"
        />
        <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
          ยังไม่ได้รับสิทธิ์ใช้งาน
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Onsite Service Report ต้องได้รับสิทธิ์จากผู้ดูแลระบบก่อนจึงจะใช้งานได้
          กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์
        </p>
      </main>
    );
  }

  return <>{children}</>;
};

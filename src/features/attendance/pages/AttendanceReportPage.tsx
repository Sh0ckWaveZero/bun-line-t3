"use client";

import { useEffect, useState } from "react";
import {
  AttendanceSummaryCards,
  AttendanceCharts,
  AttendanceTable,
  EditAttendanceModal,
  ErrorMessage,
  MonthSelector,
  UserInfoCard,
} from "@/features/attendance/components";
import { useAttendanceReport } from "@/features/attendance/hooks/useAttendanceReport";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useLineApproval } from "@/lib/auth/hooks/useLineApproval";
import { roundToOneDecimal } from "@/lib/utils/number";
import { cn } from "@/lib/utils";
import { CalendarCheck, CalendarDays } from "lucide-react";

/** skeleton อยู่ต่อหลัง reveal เพื่อเล่น fade-out ให้จบ (--reveal-dur 400ms + buffer) */
const SKELETON_REMOVE_DELAY_MS = 450;

function AttendanceReportSkeleton() {
  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-white/[0.08]">
        <div className="skel-bar h-10 w-[220px] rounded-xl" />
        <div className="skel-bar h-12 w-44 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 border-b border-slate-200 px-5 py-5 sm:grid-cols-3 sm:px-6 lg:grid-cols-5 dark:border-white/[0.08]">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]"
          >
            <div className="skel-bar h-3 w-16 rounded-md" />
            <div className="skel-bar mt-2 h-6 w-12 rounded-md" />
          </div>
        ))}
      </div>
      <div className="flex gap-6 border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-white/[0.08]">
        <div className="skel-bar h-4 w-36 rounded-md" />
        <div className="skel-bar h-4 w-32 rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:px-6 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200/80 p-4 dark:border-white/[0.06]"
          >
            <div className="skel-bar h-3 w-40 rounded-md" />
            <div className="skel-bar mt-4 h-48 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 px-5 py-4 sm:px-6 dark:border-white/[0.08]">
        <div className="skel-bar h-4 w-44 rounded-md" />
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 border-b border-slate-200/80 py-3 last:border-b-0 dark:border-white/[0.07]"
          >
            <div className="skel-bar h-3.5 w-24 rounded-md" />
            <div className="skel-bar h-3.5 w-16 rounded-md" />
            <div className="skel-bar h-3.5 w-16 rounded-md" />
            <div className="skel-bar h-3.5 w-12 rounded-md" />
            <div className="skel-bar h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyReportState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 dark:border-white/[0.1] dark:bg-white/[0.06]">
        <CalendarDays className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
        ยังไม่มีข้อมูลการเข้างาน
      </h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        เลือกเดือนด้านบนเพื่อดูรายงานการเข้างาน หรือลงเวลาเข้างานผ่าน LINE
      </p>
    </div>
  );
}

export function AttendanceReportPage() {
  const {
    session,
    report,
    loading,
    error,
    selectedMonth,
    setSelectedMonth,
    editModalOpen,
    editingRecord,
    editData,
    setEditData,
    updateLoading,
    openEditModal,
    closeEditModal,
    updateAttendance,
  } = useAttendanceReport();

  const { needsApproval } = useLineApproval();

  // reveal ต่อเมื่อได้ผลลัพธ์ครั้งแรกแล้วเท่านั้น (มีข้อมูลหรือ error)
  // session มีค่าตั้งแต่ SSR/hydration (server-fn ใน __root) แต่ fetch เริ่มใน effect
  // ฝั่ง client — ถ้าใช้ !loading เป็นเงื่อนไข skeleton จะโดน mount ทับด้วยสถานะ
  // is-revealed (opacity 0) และ fade-in ไม่ทันก่อนข้อมูลมา → มองไม่เห็น skeleton เลย
  const isFirstResultReady = Boolean(report) || Boolean(error);
  const isRevealed = isFirstResultReady;
  // skeleton ติดตั้งแต่แรก และถูกปลดหลัง reveal + fade-out จบ (set ใน timer ไม่ใช่ effect)
  const [skeletonDismissed, setSkeletonDismissed] = useState(false);
  const skeletonMounted = !isRevealed || !skeletonDismissed;

  useEffect(() => {
    if (!isRevealed) return;
    const timer = setTimeout(
      () => setSkeletonDismissed(true),
      SKELETON_REMOVE_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [isRevealed]);

  return (
    <>
      <PendingApprovalModal open={needsApproval} />

      <main className="min-h-[calc(100vh-3.5rem)] bg-[#f5f7f8] py-7 text-slate-900 dark:bg-[#0d0f11] dark:text-slate-100">
        <div className="container mx-auto px-4">
          <header>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] leading-none font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                รายงานการเข้างานรายเดือน
              </h1>
              {report && !loading && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CalendarCheck className="size-3.5" aria-hidden="true" />
                  เข้างาน {roundToOneDecimal(report.attendanceRate)}%
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              ติดตามและจัดการเวลาการทำงานของคุณ
            </p>
          </header>

          {error && <ErrorMessage message={error} className="mt-5" />}

          <section
            className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_34px_rgba(16,24,40,0.05)] dark:border-white/[0.08] dark:bg-[#151719] dark:shadow-none"
            aria-label="รายงานการเข้างานรายเดือน"
          >
            <div className={cn("t-skel", isRevealed && "is-revealed")}>
              {skeletonMounted && (
                <div
                  className="t-skel-skeleton is-pulsing bg-white dark:bg-[#151719]"
                  aria-hidden="true"
                >
                  <AttendanceReportSkeleton />
                </div>
              )}
              <div className="t-skel-content" inert={!isRevealed}>
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-white/[0.08]">
                  <MonthSelector
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                  />
                  {session?.user && <UserInfoCard user={session.user} />}
                </div>

                {report ? (
                  <div>
                    <AttendanceSummaryCards report={report} />
                    <AttendanceCharts report={report} />
                    <AttendanceTable
                      records={report.attendanceRecords}
                      onEditRecord={openEditModal}
                    />
                  </div>
                ) : isRevealed ? (
                  <EmptyReportState />
                ) : (
                  /* ช่วงโหลดครั้งแรก: placeholder เต็มโครงหน้า เพื่อให้การ์ด
                     สูงเท่าหน้าจริง — skeleton overlay วาดครบทุกส่วน
                     (รวมตาราง) ไม่ถูก overflow-hidden ตัดครึ่ง */
                  <AttendanceReportSkeleton />
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <EditAttendanceModal
        isOpen={editModalOpen}
        editingRecord={editingRecord}
        editData={editData}
        updateLoading={updateLoading}
        onClose={closeEditModal}
        onEditDataChange={setEditData}
        onUpdate={updateAttendance}
      />
    </>
  );
}

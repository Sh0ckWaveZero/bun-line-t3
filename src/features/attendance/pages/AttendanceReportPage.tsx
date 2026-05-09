"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  EditAttendanceModal,
  AttendanceSummaryCards,
  AttendanceCharts,
  AttendanceTable,
  UserInfoCard,
  LoadingSpinner,
  ErrorMessage,
  MonthSelector,
} from "@/features/attendance/components";
import { useAttendanceReport } from "@/features/attendance/hooks/useAttendanceReport";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useLineApproval } from "@/lib/auth/hooks/useLineApproval";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

ChartJS.defaults.font.family = "Prompt, sans-serif";
ChartJS.defaults.font.size = 12;

export function AttendanceReportPage() {
  const {
    session,
    status,
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

  return (
    <>
      <PendingApprovalModal open={needsApproval} />

      <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">
            รายงานการเข้างานรายเดือน
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ติดตามและจัดการเวลาการทำงานของคุณ
          </p>
        </header>

        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />

        {session?.user && (
          <div className="mb-6">
            <UserInfoCard user={session.user} />
          </div>
        )}

        {loading && <LoadingSpinner />}

        {error && <ErrorMessage message={error} />}

        {report && !loading && (
          <div className="space-y-8">
            <section>
              <AttendanceSummaryCards report={report} />
            </section>

            <section>
              <AttendanceCharts report={report} />
            </section>

            <section>
              <AttendanceTable
                records={report.attendanceRecords}
                onEditRecord={openEditModal}
              />
            </section>
          </div>
        )}

        <EditAttendanceModal
          isOpen={editModalOpen}
          editingRecord={editingRecord}
          editData={editData}
          updateLoading={updateLoading}
          onClose={closeEditModal}
          onEditDataChange={setEditData}
          onUpdate={updateAttendance}
        />
      </div>
    </>
  );
}

"use client";

import { createFileRoute } from "@tanstack/react-router";
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
  UserSettingsCard,
  LoadingSpinner,
  AuthLoadingScreen,
  LoginPrompt,
  ErrorMessage,
  MonthSelector,
} from "@/components/attendance";
import { useAttendanceReport } from "@/hooks/useAttendanceReport";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useLineApproval } from "@/hooks/useLineApproval";

// Register Chart.js components
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

// 🎯 Configure Chart.js to use Prompt font globally
ChartJS.defaults.font.family = "Prompt, sans-serif";
ChartJS.defaults.font.size = 12;

function AttendanceReportPage() {
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

  // 🔐 SECURITY: Show loading while checking authentication
  if (status === "loading") {
    return <AuthLoadingScreen />;
  }

  // 🔐 SECURITY: Show login prompt if not authenticated
  if (status === "unauthenticated") {
    return <LoginPrompt />;
  }

  return (
    <>
      {/* Pending Approval Modal */}
      <PendingApprovalModal open={needsApproval} />

      <div id="attendance-report-page" className="min-h-screen w-full">
      <div
        id="attendance-report-container"
        className="mx-auto max-w-full px-4 py-8"
      >
        <div
          id="attendance-report-card"
          className="rounded-lg border border-border bg-card p-6 shadow-lg"
        >
          <div
            id="attendance-report-header"
            className="mb-6 flex items-center justify-between"
          >
            <h1
              id="attendance-report-title"
              className="text-3xl font-bold text-foreground"
            >
              รายงานการเข้างานรายเดือน
            </h1>
          </div>
          <p
            id="attendance-report-description"
            className="mb-6 text-muted-foreground"
          >
            ติดตามและจัดการเวลาการทำงานของคุณ
          </p>

          {/* Month Selector */}
          <div id="month-selector-section" className="mb-6">
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </div>

          {/* User Information */}
          {session?.user && (
            <div id="user-info-section" className="mb-6">
              <UserInfoCard user={session.user} />
            </div>
          )}

          {/* User Settings */}
          <div id="user-settings-section" className="mb-6">
            <UserSettingsCard />
          </div>

          {/* Loading State */}
          {loading && (
            <div id="loading-section">
              <LoadingSpinner />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div id="error-section">
              <ErrorMessage message={error} />
            </div>
          )}

          {/* Report Content */}
          {report && !loading && (
            <div id="report-content" className="space-y-6">
              {/* Summary Cards */}
              <div id="summary-cards-section" className="mb-8">
                <h2
                  id="summary-cards-title"
                  className="mb-4 text-xl font-semibold text-foreground"
                >
                  สรุปรายงาน
                </h2>
                <AttendanceSummaryCards report={report} />
              </div>

              {/* Charts */}
              <div id="charts-section" className="mb-8">
                <h2
                  id="charts-title"
                  className="mb-4 text-xl font-semibold text-foreground"
                >
                  กราฟแสดงผล
                </h2>
                <AttendanceCharts report={report} />
              </div>

              {/* Detailed Table */}
              <div id="table-section" className="mb-4">
                <h2
                  id="table-title"
                  className="mb-4 text-xl font-semibold text-foreground"
                >
                  รายละเอียดการเข้างาน
                </h2>
                <AttendanceTable
                  records={report.attendanceRecords}
                  onEditRecord={openEditModal}
                />
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <div id="edit-modal-container">
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
      </div>
    </div>
    </>
  );
}

export const Route = createFileRoute("/attendance-report")({
  component: AttendanceReportPage,
});

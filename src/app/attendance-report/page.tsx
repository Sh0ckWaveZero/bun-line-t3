"use client";

import React from 'react';
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
  Filler
} from 'chart.js';
import { 
  EditAttendanceModal,
  AttendanceSummaryCards,
  AttendanceCharts,
  AttendanceTable,
  UserInfoCard,
  LoadingSpinner,
  AuthLoadingScreen,
  LoginPrompt,
  ErrorMessage,
  MonthSelector
} from '~/components/attendance';
import { useAttendanceReport } from '~/hooks/useAttendanceReport';

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
  Filler
);

// 🎯 Configure Chart.js to use Prompt font globally
ChartJS.defaults.font.family = 'Prompt, sans-serif';
ChartJS.defaults.font.size = 12;

export default function AttendanceReportPage() {
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

  // 🔐 SECURITY: Show loading while checking authentication
  if (status === 'loading') {
    return <AuthLoadingScreen />;
  }

  // 🔐 SECURITY: Show login prompt if not authenticated
  if (status === 'unauthenticated') {
    return <LoginPrompt />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">รายงานการเข้างานรายเดือน</h1>
          
          {/* Month Selector */}
          <MonthSelector 
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />

          {/* User Information */}
          {session?.user && <UserInfoCard user={session.user} />}

          {/* Loading State */}
          {loading && <LoadingSpinner />}

          {/* Error State */}
          {error && <ErrorMessage message={error} />}

          {/* Report Content */}
          {report && !loading && (
            <>
              {/* Summary Cards */}
              <AttendanceSummaryCards report={report} />

              {/* Charts */}
              <AttendanceCharts report={report} />

              {/* Detailed Table */}
              <AttendanceTable 
                records={report.attendanceRecords}
                onEditRecord={openEditModal}
              />
            </>
          )}
        </div>

        {/* Edit Modal */}
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
  );
}

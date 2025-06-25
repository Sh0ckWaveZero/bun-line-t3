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
} from '@/components/attendance';
import { useAttendanceReport } from '@/hooks/useAttendanceReport';
import { ThemeToggle } from '@/components/ui/theme-toggle-simple';

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
    <div 
      id="attendance-report-page"
      className="min-h-screen bg-white dark:bg-gray-900"
    >
      <div 
        id="attendance-report-container"
        className="max-w-4xl mx-auto px-4 py-8"
      >
        <div 
          id="attendance-report-card"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div 
            id="attendance-report-header"
            className="flex justify-between items-center mb-6"
          >
            <h1 
              id="attendance-report-title"
              className="text-3xl font-bold text-gray-800 dark:text-gray-100"
            >
              รายงานการเข้างานรายเดือน
            </h1>
            <ThemeToggle />
          </div>
          <p 
            id="attendance-report-description"
            className="text-gray-700 dark:text-gray-400 mb-6"
          >
            ติดตามและจัดการเวลาการทำงานของคุณ
          </p>
          
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
            <div id="report-content">
              {/* Summary Cards */}
              <div id="summary-cards-section">
                <AttendanceSummaryCards report={report} />
              </div>

              {/* Charts */}
              <div id="charts-section">
                <AttendanceCharts report={report} />
              </div>

              {/* Detailed Table */}
              <div id="table-section">
                <AttendanceTable 
                  records={report.attendanceRecords}
                  onEditRecord={openEditModal}
                />
              </div>
            </div>
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

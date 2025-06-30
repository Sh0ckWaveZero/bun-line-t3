"use client";

import React from "react";

import { AttendanceStatusType } from "@/features/attendance/types/attendance-status";
import { dateFormatters, formatHoursSafe, formatDateSafe } from "@/lib/utils/date-formatting";
import { AttendanceRecord, AttendanceTableProps } from "@/lib/types/attendance";
import { LeaveStatusBadge } from "@/components/ui/LeaveStatusBadge";

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  onEditRecord,
}) => {
  // 🔐 SECURITY: ใช้ safe formatters แทน

  const getStatusColor = (status: AttendanceStatusType) => {
    switch (status) {
      case AttendanceStatusType.CHECKED_IN_ON_TIME:
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-700";
      case AttendanceStatusType.CHECKED_IN_LATE:
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700";
      case AttendanceStatusType.CHECKED_OUT:
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-700";
      case AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT:
        return "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 border border-orange-200 dark:border-orange-700";
      case AttendanceStatusType.LEAVE:
        return "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-700";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700";
    }
  };

  const getStatusText = (status: AttendanceStatusType) => {
    switch (status) {
      case AttendanceStatusType.CHECKED_IN_ON_TIME:
        return "เข้างานตรงเวลา";
      case AttendanceStatusType.CHECKED_IN_LATE:
        return "เข้างานสาย";
      case AttendanceStatusType.CHECKED_OUT:
        return "ออกงานแล้ว";
      case AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT:
        return "ออกงานอัตโนมัติ";
      case AttendanceStatusType.LEAVE:
        return "ลา";
      default:
        return status;
    }
  };


  const EditButton: React.FC<{ record: AttendanceRecord }> = ({ record }) => {
    const isLeaveDay = record.status === AttendanceStatusType.LEAVE;
    
    return (
      <button
        id={`edit-btn-${record.id}`}
        onClick={() => !isLeaveDay && onEditRecord(record)}
        disabled={isLeaveDay}
        className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isLeaveDay 
            ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500"
            : "cursor-pointer border-orange-200 bg-orange-100 text-orange-700 hover:bg-orange-200 focus:ring-orange-500 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 dark:focus:ring-orange-400"
        }`}
        aria-label={isLeaveDay 
          ? `ไม่สามารถแก้ไขข้อมูลวันลาได้ วันที่ ${dateFormatters.shortDate(record.workDate)}`
          : `แก้ไขข้อมูลการเข้างานวันที่ ${dateFormatters.shortDate(record.workDate)}`
        }
      >
        <svg
        id={`edit-icon-${record.id}`}
        className="mr-1 h-3 w-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
        <span id={`edit-text-${record.id}`}>แก้ไข</span>
      </button>
    );
  };

  const EmptyTableMessage = () => (
    <div
      id="empty-table-message"
      className="py-8 text-center text-gray-500 dark:text-gray-400"
    >
      ไม่มีข้อมูลการเข้างานในเดือนนี้
    </div>
  );

  // Sort records to show latest first (descending order by workDate)
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.workDate).getTime() - new Date(a.workDate).getTime()
  );

  // Get today's date in YYYY-MM-DD format for comparison
  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toISOString();

  return (
    <div id="attendance-table-container" className="mb-6">
      <div className="mb-4">
        <h2
          id="attendance-table-title"
          className="text-2xl font-bold text-gray-900 dark:text-gray-100"
        >
          ตารางบันทึกการลงเวลา
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          วันที่ {dateFormatters.fullDate(todayFormatted)} • รายการทั้งหมด {sortedRecords.length} รายการ
        </p>
      </div>
      <div
        id="attendance-table-wrapper"
        className="bg-card-base border-theme-primary rounded-lg border shadow overflow-x-auto"
      >
        <table id="attendance-table" className="min-w-full relative">
          <thead id="attendance-table-header" className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
            <tr id="attendance-table-header-row">
              <th
                id="header-date"
                className="sticky left-0 z-20 px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide
                  bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700
                  border-r border-gray-200 dark:border-gray-600
                  before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px 
                  before:bg-gray-200 dark:before:bg-gray-600 before:shadow-sm"
                style={{ position: 'sticky', left: 0 }}
              >
                📅 วันที่
              </th>
              <th
                id="header-checkin"
                className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide"
              >
                🕐 เวลาเข้างาน
              </th>
              <th
                id="header-checkout"
                className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide"
              >
                🕕 เวลาออกงาน
              </th>
              <th
                id="header-hours"
                className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide"
              >
                ⏱️ ชั่วโมงทำงาน
              </th>
              <th
                id="header-status"
                className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide"
              >
                🏷️ สถานะ
              </th>
              <th
                id="header-actions"
                className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide"
              >
                ⚙️ การจัดการ
              </th>
            </tr>
          </thead>
          <tbody
            id="attendance-table-body"
            className="bg-card-base divide-theme-table"
          >
            {sortedRecords.map((record) => {
              const isToday = record.workDate === today;
              return (
              <tr
                key={record.id}
                id={`record-row-${record.id}`}
                className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  isToday 
                    ? "bg-blue-50 dark:bg-blue-900/20" 
                    : ""
                }`}
              >
                <td
                  id={`date-${record.id}`}
                  className={`sticky left-0 z-10 whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100
                    border-r border-gray-200 dark:border-gray-600
                    before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px 
                    before:bg-gray-200 dark:before:bg-gray-600 before:shadow-sm
                    bg-gray-50 dark:bg-gray-800 ${isToday ? "font-bold shadow-md" : ""}`}
                  style={{ position: 'sticky', left: 0 }}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${isToday ? 
                      "bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent font-bold" : 
                      ""}`}>
                      {formatDateSafe(record.workDate, {
                        day: "2-digit",
                        month: "2-digit", 
                        year: "numeric",
                        calendar: "buddhist"
                      })}
                    </span>
                    {isToday && (
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
                        วันนี้
                      </span>
                    )}
                  </div>
                </td>
                <td
                  id={`checkin-${record.id}`}
                  className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                >
                  {record.status === AttendanceStatusType.LEAVE
                    ? "-"
                    : dateFormatters.time24(record.checkInTime)}
                </td>
                <td
                  id={`checkout-${record.id}`}
                  className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                >
                  {record.status === AttendanceStatusType.LEAVE
                    ? "-"
                    : record.checkOutTime
                    ? dateFormatters.time24(record.checkOutTime)
                    : "-"}
                </td>
                <td
                  id={`hours-${record.id}`}
                  className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                >
                  {record.status === AttendanceStatusType.LEAVE
                    ? "-"
                    : formatHoursSafe(record.hoursWorked)}
                </td>
                <td
                  id={`status-${record.id}`}
                  className="whitespace-nowrap px-6 py-4"
                >
                  {record.status === AttendanceStatusType.LEAVE && record.leaveInfo ? (
                    <LeaveStatusBadge
                      record={record}
                      statusText={getStatusText(record.status)}
                      statusColor={getStatusColor(record.status)}
                      recordId={record.id}
                    />
                  ) : (
                    <span
                      id={`status-badge-${record.id}`}
                      className={`inline-flex rounded-xl px-2 py-1 text-xs font-semibold ${getStatusColor(record.status)}`}
                    >
                      {getStatusText(record.status)}
                    </span>
                  )}
                </td>
                <td
                  id={`actions-${record.id}`}
                  className="whitespace-nowrap  px-6 py-4 text-sm"
                >
                  <EditButton record={record} />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>

        {sortedRecords.length === 0 && <EmptyTableMessage />}
      </div>
    </div>
  );
};

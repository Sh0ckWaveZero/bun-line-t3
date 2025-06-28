"use client";

import React from "react";

import { AttendanceStatusType } from "@/features/attendance/types/attendance-status";
import { dateFormatters, formatHoursSafe } from "@/lib/utils/date-formatting";
import { AttendanceRecord, AttendanceTableProps } from "@/lib/types/attendance";

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
      default:
        return status;
    }
  };

  const EditButton: React.FC<{ record: AttendanceRecord }> = ({ record }) => (
    <button
      id={`edit-btn-${record.id}`}
      onClick={() => onEditRecord(record)}
      className="inline-flex items-center rounded-md border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 dark:focus:ring-orange-400"
      aria-label={`แก้ไขข้อมูลการเข้างานวันที่ ${dateFormatters.fullDate(record.workDate)}`}
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

  const EmptyTableMessage = () => (
    <div
      id="empty-table-message"
      className="py-8 text-center text-gray-500 dark:text-gray-400"
    >
      ไม่มีข้อมูลการเข้างานในเดือนนี้
    </div>
  );

  return (
    <div id="attendance-table-container" className="mb-6">
      <h2
        id="attendance-table-title"
        className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100"
      >
        ตารางบันทึกการลงเวลา
      </h2>
      <div
        id="attendance-table-wrapper"
        className="bg-card-base border-theme-primary overflow-x-auto rounded-lg border shadow"
      >
        <table id="attendance-table" className="min-w-full">
          <thead id="attendance-table-header" className="bg-table-header">
            <tr id="attendance-table-header-row">
              <th
                id="header-date"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                วันที่
              </th>
              <th
                id="header-checkin"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                เวลาเข้างาน
              </th>
              <th
                id="header-checkout"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                เวลาออกงาน
              </th>
              <th
                id="header-hours"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                ชั่วโมงทำงาน
              </th>
              <th
                id="header-status"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                สถานะ
              </th>
              <th
                id="header-actions"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                การจัดการ
              </th>
            </tr>
          </thead>
          <tbody
            id="attendance-table-body"
            className="bg-card-base divide-theme-table"
          >
            {records.map((record) => (
              <tr
                key={record.id}
                id={`record-row-${record.id}`}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td
                  id={`date-${record.id}`}
                  className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                >
                  {dateFormatters.fullDate(record.workDate)}
                </td>
                <td
                  id={`checkin-${record.id}`}
                  className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                >
                  {dateFormatters.time24(record.checkInTime)}
                </td>
                <td
                  id={`checkout-${record.id}`}
                  className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                >
                  {record.checkOutTime
                    ? dateFormatters.time24(record.checkOutTime)
                    : "-"}
                </td>
                <td
                  id={`hours-${record.id}`}
                  className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                >
                  {formatHoursSafe(record.hoursWorked)}
                </td>
                <td
                  id={`status-${record.id}`}
                  className="whitespace-nowrap px-6 py-4"
                >
                  <span
                    id={`status-badge-${record.id}`}
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(record.status)}`}
                  >
                    {getStatusText(record.status)}
                  </span>
                </td>
                <td
                  id={`actions-${record.id}`}
                  className="whitespace-nowrap px-6 py-4 text-sm"
                >
                  <EditButton record={record} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {records.length === 0 && <EmptyTableMessage />}
      </div>
    </div>
  );
};

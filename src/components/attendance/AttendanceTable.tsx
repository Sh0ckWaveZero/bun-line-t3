"use client";

import React from 'react';
import type { AttendanceRecord, AttendanceTableProps } from '@/lib/types';
import { AttendanceStatusType } from '@/features/attendance/types/attendance-status';
import { dateFormatters, formatHoursSafe } from '@/lib/utils/date-formatting';

export const AttendanceTable: React.FC<AttendanceTableProps> = ({ records, onEditRecord }) => {
  // 🔐 SECURITY: ใช้ safe formatters แทน

  const getStatusColor = (status: AttendanceStatusType) => {
    switch (status) {
      case AttendanceStatusType.CHECKED_IN_ON_TIME:
        return 'bg-green-100 text-green-800';
      case AttendanceStatusType.CHECKED_IN_LATE:
        return 'bg-yellow-100 text-yellow-800';
      case AttendanceStatusType.CHECKED_OUT:
        return 'bg-blue-100 text-blue-800';
      case AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: AttendanceStatusType) => {
    switch (status) {
      case AttendanceStatusType.CHECKED_IN_ON_TIME:
        return 'เข้างานตรงเวลา';
      case AttendanceStatusType.CHECKED_IN_LATE:
        return 'เข้างานสาย';
      case AttendanceStatusType.CHECKED_OUT:
        return 'ออกงานแล้ว';
      case AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT:
        return 'ออกงานอัตโนมัติ';
      default:
        return status;
    }
  };

  const EditButton: React.FC<{ record: AttendanceRecord }> = ({ record }) => (
    <button
      onClick={() => onEditRecord(record)}
      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
      aria-label={`แก้ไขข้อมูลการเข้างานวันที่ ${dateFormatters.fullDate(record.workDate)}`}
    >
      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      แก้ไข
    </button>
  );

  const EmptyTableMessage = () => (
    <div className="text-center py-8 text-gray-500">
      ไม่มีข้อมูลการเข้างานในเดือนนี้
    </div>
  );

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">ตารางบันทึกการลงเวลา</h2>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                เวลาเข้างาน
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                เวลาออกงาน
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ชั่วโมงทำงาน
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                การจัดการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {dateFormatters.fullDate(record.workDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {dateFormatters.time24(record.checkInTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.checkOutTime ? dateFormatters.time24(record.checkOutTime) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatHoursSafe(record.hoursWorked)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                    {getStatusText(record.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
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

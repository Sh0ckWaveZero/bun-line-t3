"use client";

import React from 'react';
import type { MonthlyAttendanceReport, AttendanceSummaryCardsProps } from '@/lib/types';
import { roundToOneDecimal } from '@/lib/utils/number';

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({ report }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-card-blue p-4 rounded-lg border border-theme-secondary hover:border-theme-hover transition-colors">
        <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">วันที่ทำงาน</h3>
        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{report.totalDaysWorked}</p>
        <p className="text-xs text-blue-600 dark:text-blue-400">จาก {report.workingDaysInMonth} วันทำงาน</p>
      </div>
      
      <div className="bg-card-green p-4 rounded-lg border border-theme-secondary hover:border-theme-hover transition-colors">
        <h3 className="text-sm font-medium text-green-600 dark:text-green-400">ชั่วโมงรวม</h3>
        <p className="text-2xl font-bold text-green-900 dark:text-green-100">{roundToOneDecimal(report.totalHoursWorked)}</p>
        <p className="text-xs text-green-600 dark:text-green-400">ชั่วโมง</p>
      </div>
      
      <div className="bg-card-purple p-4 rounded-lg border border-theme-secondary hover:border-theme-hover transition-colors">
        <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">เปอร์เซ็นต์การเข้างาน</h3>
        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{roundToOneDecimal(report.attendanceRate)}%</p>
      </div>
      
      <div className="bg-card-orange p-4 rounded-lg border border-theme-secondary hover:border-theme-hover transition-colors">
        <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">ชั่วโมงเฉลี่ย/วัน</h3>
        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{roundToOneDecimal(report.averageHoursPerDay)}</p>
        <p className="text-xs text-orange-600 dark:text-orange-400">ชั่วโมง</p>
      </div>
      
      <div className="bg-card-red p-4 rounded-lg border border-theme-secondary hover:border-theme-hover transition-colors">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400">อัตราการทำงานครบเวลา</h3>
        <p className="text-2xl font-bold text-red-900 dark:text-red-100">{roundToOneDecimal(report.complianceRate)}%</p>
        <p className="text-xs text-red-600 dark:text-red-400">{report.completeDays} วัน ครบ 9 ชม.</p>
      </div>
    </div>
  );
};

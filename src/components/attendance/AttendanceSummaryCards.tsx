"use client";

import React from 'react';
import type { MonthlyAttendanceReport, AttendanceSummaryCardsProps } from '@/lib/types';
import { roundToOneDecimal } from '@/lib/utils/number';

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({ report }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-blue-600">วันที่ทำงาน</h3>
        <p className="text-2xl font-bold text-blue-900">{report.totalDaysWorked}</p>
        <p className="text-xs text-blue-600">จาก {report.workingDaysInMonth} วันทำงาน</p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-green-600">ชั่วโมงรวม</h3>
        <p className="text-2xl font-bold text-green-900">{roundToOneDecimal(report.totalHoursWorked)}</p>
        <p className="text-xs text-green-600">ชั่วโมง</p>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-purple-600">เปอร์เซ็นต์การเข้างาน</h3>
        <p className="text-2xl font-bold text-purple-900">{roundToOneDecimal(report.attendanceRate)}%</p>
      </div>
      
      <div className="bg-orange-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-orange-600">ชั่วโมงเฉลี่ย/วัน</h3>
        <p className="text-2xl font-bold text-orange-900">{roundToOneDecimal(report.averageHoursPerDay)}</p>
        <p className="text-xs text-orange-600">ชั่วโมง</p>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-purple-600">อัตราการทำงานครบเวลา</h3>
        <p className="text-2xl font-bold text-purple-900">{roundToOneDecimal(report.complianceRate)}%</p>
        <p className="text-xs text-purple-600">{report.completeDays} วัน ครบ 9 ชม.</p>
      </div>
    </div>
  );
};

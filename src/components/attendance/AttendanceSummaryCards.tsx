"use client";

import React from 'react';
import type { MonthlyAttendanceReport, AttendanceSummaryCardsProps } from '@/lib/types';
import { roundToOneDecimal } from '@/lib/utils/number';
import { useTypography } from '@/hooks/useTypography';

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({ report }) => {
  const typography = useTypography();

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      {/* 💙 Blue Gradient - วันที่ทำงาน */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/40 dark:hover:to-blue-700/40 hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transform hover:scale-105 transition-all duration-300">
        <h3 className={`${typography.classes.cardHeader} ${typography.getCardClass('blue', 'header')}`}>วันที่ทำงาน</h3>
        <p className={`${typography.classes.cardNumber} ${typography.getCardClass('blue', 'number')}`}>{report.totalDaysWorked}</p>
        <p className={`${typography.classes.cardSubtext} ${typography.getCardClass('blue', 'subtext')} mt-1`}>จาก {report.workingDaysInMonth} วันทำงาน</p>
      </div>
      
      {/* 💚 Teal Gradient - ชั่วโมงรวม */}
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 p-4 rounded-lg border border-teal-200 dark:border-teal-700 hover:from-teal-100 hover:to-teal-200 dark:hover:from-teal-800/40 dark:hover:to-teal-700/40 hover:shadow-lg hover:shadow-teal-100/50 dark:hover:shadow-teal-900/20 transform hover:scale-105 transition-all duration-300">
        <h3 className={`${typography.classes.cardHeader} ${typography.getCardClass('teal', 'header')}`}>ชั่วโมงรวม</h3>
        <p className={`${typography.classes.cardNumber} ${typography.getCardClass('teal', 'number')}`}>{roundToOneDecimal(report.totalHoursWorked)}</p>
        <p className={`${typography.classes.cardSubtext} ${typography.getCardClass('teal', 'subtext')} mt-1`}>ชั่วโมง</p>
      </div>
      
      {/* 💜 Indigo Gradient - เปอร์เซ็นต์การเข้างาน */}
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700 hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-800/40 dark:hover:to-indigo-700/40 hover:shadow-lg hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/20 transform hover:scale-105 transition-all duration-300">
        <h3 className={`${typography.classes.cardHeader} ${typography.getCardClass('indigo', 'header')}`}>เปอร์เซ็นต์การเข้างาน</h3>
        <p className={`${typography.classes.cardNumber} ${typography.getCardClass('indigo', 'number')}`}>{roundToOneDecimal(report.attendanceRate)}%</p>
      </div>
      
      {/* 🧡 Emerald Gradient - ชั่วโมงเฉลี่ย/วัน */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-4 rounded-lg border border-emerald-200 dark:border-emerald-700 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-800/40 dark:hover:to-emerald-700/40 hover:shadow-lg hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 transform hover:scale-105 transition-all duration-300">
        <h3 className={`${typography.classes.cardHeader} ${typography.getCardClass('emerald', 'header')}`}>ชั่วโมงเฉลี่ย/วัน</h3>
        <p className={`${typography.classes.cardNumber} ${typography.getCardClass('emerald', 'number')}`}>{roundToOneDecimal(report.averageHoursPerDay)}</p>
        <p className={`${typography.classes.cardSubtext} ${typography.getCardClass('emerald', 'subtext')} mt-1`}>ชั่วโมง</p>
      </div>
      
      {/* ❤️ Slate Gradient - อัตราการทำงานครบเวลา */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-800/40 dark:hover:to-slate-700/40 hover:shadow-lg hover:shadow-slate-100/50 dark:hover:shadow-slate-900/20 transform hover:scale-105 transition-all duration-300">
        <h3 className={`${typography.classes.cardHeader} ${typography.getCardClass('slate', 'header')}`}>อัตราการทำงานครบเวลา</h3>
        <p className={`${typography.classes.cardNumber} ${typography.getCardClass('slate', 'number')}`}>{roundToOneDecimal(report.complianceRate)}%</p>
        <p className={`${typography.classes.cardSubtext} ${typography.getCardClass('slate', 'subtext')} mt-1`}>{report.completeDays} วัน ครบ 9 ชม.</p>
      </div>
    </div>
  );
};

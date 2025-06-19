"use client";

import React from 'react';
import type { MonthlyAttendanceReport, AttendanceSummaryCardsProps } from '@/lib/types';
import { roundToOneDecimal } from '@/lib/utils/number';

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({ report }) => {
  
  // 🎯 การปรับปรุง Accessibility และ Readability:
  // 1. ใช้สีที่มี contrast สูงแทน pastel colors
  // 2. เพิ่ม ARIA labels และ semantic HTML
  // 3. ปรับ typography hierarchy ให้ชัดเจน
  // 4. เพิ่ม focus states สำหรับ keyboard navigation

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8"
      role="region" 
      aria-label="สรุปข้อมูลการเข้างาน"
    >
      {/* 🌸 วันที่ทำงาน - High Contrast Design */}
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-rose-200 dark:border-rose-700 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 focus-within:ring-2 focus-within:ring-rose-500 focus-within:ring-opacity-50"
        role="article"
        aria-labelledby="working-days-title"
        tabIndex={0}
      >
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-3 h-3 bg-rose-500 rounded-full shadow-sm" 
            role="presentation"
            aria-hidden="true"
          ></div>
          <h3 
            id="working-days-title"
            className="text-sm font-semibold text-gray-800 dark:text-gray-100"
          >
            วันที่ทำงาน
          </h3>
        </div>
        <p 
          className="text-4xl font-bold text-gray-900 dark:text-white mb-2"
          aria-label={`ทำงานไป ${report.totalDaysWorked} วัน`}
        >
          {report.totalDaysWorked}
        </p>
        <p 
          className="text-sm font-medium text-gray-600 dark:text-gray-300"
          aria-label={`จากทั้งหมด ${report.workingDaysInMonth} วันทำงาน`}
        >
          จาก {report.workingDaysInMonth} วันทำงาน
        </p>
      </div>
      
      {/* 🌿 ชั่วโมงรวม - High Contrast Design */}
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-opacity-50"
        role="article"
        aria-labelledby="total-hours-title"
        tabIndex={0}
      >
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm" 
            role="presentation"
            aria-hidden="true"
          ></div>
          <h3 
            id="total-hours-title"
            className="text-sm font-semibold text-gray-800 dark:text-gray-100"
          >
            ชั่วโมงรวม
          </h3>
        </div>
        <p 
          className="text-4xl font-bold text-gray-900 dark:text-white mb-2"
          aria-label={`ทำงานรวม ${roundToOneDecimal(report.totalHoursWorked)} ชั่วโมง`}
        >
          {roundToOneDecimal(report.totalHoursWorked)}
        </p>
        <p 
          className="text-sm font-medium text-gray-600 dark:text-gray-300"
          aria-label="หน่วยเป็นชั่วโมง"
        >
          ชั่วโมง
        </p>
      </div>
      
      {/* 🌸 เปอร์เซ็นต์การเข้างาน - High Contrast Design */}
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-violet-200 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-opacity-50"
        role="article"
        aria-labelledby="attendance-rate-title"
        tabIndex={0}
      >
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-3 h-3 bg-violet-500 rounded-full shadow-sm" 
            role="presentation"
            aria-hidden="true"
          ></div>
          <h3 
            id="attendance-rate-title"
            className="text-sm font-semibold text-gray-800 dark:text-gray-100"
          >
            เปอร์เซ็นต์การเข้างาน
          </h3>
        </div>
        <p 
          className="text-4xl font-bold text-gray-900 dark:text-white"
          aria-label={`อัตราการเข้างาน ${roundToOneDecimal(report.attendanceRate)} เปอร์เซ็นต์`}
        >
          {roundToOneDecimal(report.attendanceRate)}%
        </p>
      </div>
      
      {/* 🌻 ชั่วโมงเฉลี่ย/วัน - High Contrast Design */}
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-orange-200 dark:border-orange-700 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-opacity-50"
        role="article"
        aria-labelledby="average-hours-title"
        tabIndex={0}
      >
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-3 h-3 bg-orange-500 rounded-full shadow-sm" 
            role="presentation"
            aria-hidden="true"
          ></div>
          <h3 
            id="average-hours-title"
            className="text-sm font-semibold text-gray-800 dark:text-gray-100"
          >
            ชั่วโมงเฉลี่ย/วัน
          </h3>
        </div>
        <p 
          className="text-4xl font-bold text-gray-900 dark:text-white mb-2"
          aria-label={`ทำงานเฉลี่ย ${roundToOneDecimal(report.averageHoursPerDay)} ชั่วโมงต่อวัน`}
        >
          {roundToOneDecimal(report.averageHoursPerDay)}
        </p>
        <p 
          className="text-sm font-medium text-gray-600 dark:text-gray-300"
          aria-label="หน่วยเป็นชั่วโมง"
        >
          ชั่วโมง
        </p>
      </div>
      
      {/* 🌺 อัตราการทำงานครบเวลา - High Contrast Design */}
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-sky-200 dark:border-sky-700 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-opacity-50"
        role="article"
        aria-labelledby="compliance-rate-title"
        tabIndex={0}
      >
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-3 h-3 bg-sky-500 rounded-full shadow-sm" 
            role="presentation"
            aria-hidden="true"
          ></div>
          <h3 
            id="compliance-rate-title"
            className="text-sm font-semibold text-gray-800 dark:text-gray-100"
          >
            อัตราการทำงานครบเวลา
          </h3>
        </div>
        <p 
          className="text-4xl font-bold text-gray-900 dark:text-white mb-2"
          aria-label={`ทำงานครบเวลา ${roundToOneDecimal(report.complianceRate)} เปอร์เซ็นต์`}
        >
          {roundToOneDecimal(report.complianceRate)}%
        </p>
        <p 
          className="text-sm font-medium text-gray-600 dark:text-gray-300"
          aria-label={`มี ${report.completeDays} วัน ที่ทำงานครบ 9 ชั่วโมง`}
        >
          {report.completeDays} วัน ครบ 9 ชม.
        </p>
      </div>
    </div>
  );
};

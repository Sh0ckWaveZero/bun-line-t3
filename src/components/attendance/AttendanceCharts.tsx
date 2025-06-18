"use client";

import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { AttendanceRecord, MonthlyAttendanceReport, AttendanceChartsProps } from '@/lib/types';
import { useChartTheme } from '@/hooks/useChartTheme';

export const AttendanceCharts: React.FC<AttendanceChartsProps> = ({ report }) => {
  const { mounted, getChartOptions, getDoughnutOptions } = useChartTheme();
  // �️ Safe date formatting for chart labels
  const formatShortDateSafe = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid';
      }
      return format(date, 'd MMM', { locale: th });
    } catch (error) {
      console.error('Chart date formatting error:', error);
      return 'Invalid';
    }
  };

  const prepareHoursChartData = (records: AttendanceRecord[]) => {
    // 🛡️ Safe sorting without direct date comparison
    const sortedRecords = [...records].sort((a, b) => {
      const dateA = new Date(a.workDate);
      const dateB = new Date(b.workDate);
      
      // Check for invalid dates
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0;
      }
      
      return dateA.getTime() - dateB.getTime();
    });
    
    return {
      labels: sortedRecords.map(record => formatShortDateSafe(record.workDate)),
      datasets: [
        {
          label: 'ชั่วโมงทำงาน',
          data: sortedRecords.map(record => record.hoursWorked || 0),
          fill: true,
          backgroundColor: 'rgba(59, 130, 246, 0.1)', // Blue-500 with low opacity
          borderColor: 'rgb(37, 99, 235)', // Blue-600 
          borderWidth: 3,
          tension: 0.3,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'เป้าหมาย (9 ชม.)',
          data: sortedRecords.map(() => 9),
          borderColor: 'rgba(20, 184, 166, 0.8)', // Teal-500
          borderWidth: 2,
          borderDash: [8, 4],
          fill: false,
          pointRadius: 0,
          tension: 0
        }
      ]
    };
  };

  const prepareAttendanceDonutData = (report: MonthlyAttendanceReport) => {
    const daysAbsent = report.workingDaysInMonth - report.totalDaysWorked;
    
    // 🎯 ถ้าไม่มีการขาดงานเลย ให้แสดงข้อความแทน chart
    if (daysAbsent === 0) {
      return {
        labels: ['เข้างานครบทุกวัน 🎉'],
        datasets: [
          {
            data: [100],
            backgroundColor: ['rgb(16, 185, 129)'], // Emerald-500
            hoverOffset: 4
          }
        ]
      };
    }
    
    return {
      labels: ['มาทำงาน', 'ขาดงาน'],
      datasets: [
        {
          data: [report.totalDaysWorked, daysAbsent],
          backgroundColor: [
            'rgb(16, 185, 129)', // Emerald-500 - success green
            'rgb(148, 163, 184)'  // Slate-400 - neutral for absence
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6,
          hoverBorderWidth: 3
        }
      ]
    };
  };

  const prepareComplianceDonutData = (report: MonthlyAttendanceReport) => {
    const incompleteDays = report.totalDaysWorked - report.completeDays;
    
    // 🎯 ถ้าทำงานครบ 9 ชม. ทุกวัน ให้แสดงข้อความแทน chart
    if (incompleteDays === 0 && report.totalDaysWorked > 0) {
      return {
        labels: ['ทำงานครบ 9 ชม. ทุกวัน 💪'],
        datasets: [
          {
            data: [100],
            backgroundColor: ['rgb(99, 102, 241)'], // Indigo-500
            hoverOffset: 4
          }
        ]
      };
    }
    
    // 🎯 ถ้าไม่มีการทำงานเลย
    if (report.totalDaysWorked === 0) {
      return {
        labels: ['ไม่มีข้อมูลการทำงาน'],
        datasets: [
          {
            data: [100],
            backgroundColor: ['rgb(148, 163, 184)'], // Slate-400
            hoverOffset: 4
          }
        ]
      };
    }
    
    return {
      labels: ['ทำงานครบ 9 ชม.', 'ทำงานไม่ครบ 9 ชม.'],
      datasets: [
        {
          data: [report.completeDays, incompleteDays],
          backgroundColor: [
            'rgb(99, 102, 241)', // Indigo-500 - primary accent
            'rgb(245, 158, 11)'   // Amber-500 - warning for incomplete
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6,
          hoverBorderWidth: 3
        }
      ]
    };
  };

  const prepareDailyHoursBarData = (records: AttendanceRecord[]) => {
    const dayMap = new Map<number, {total: number, count: number}>();
    
    records.forEach(record => {
      if (record.hoursWorked) {
        const date = new Date(record.workDate);
        // 🛡️ Check for valid date
        if (isNaN(date.getTime())) {
          return; // Skip invalid dates
        }
        
        const day = date.getDay();
        
        if (!dayMap.has(day)) {
          dayMap.set(day, {total: 0, count: 0});
        }
        
        const current = dayMap.get(day)!;
        current.total += record.hoursWorked;
        current.count += 1;
      }
    });
    
    const dayNames = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    const dayOrder = [1, 2, 3, 4, 5, 6, 0];
    
    const labels = [];
    const data = [];
    
    for (const dayIndex of dayOrder) {
      labels.push(dayNames[dayIndex === 0 ? 6 : dayIndex - 1]);
      
      const dayData = dayMap.get(dayIndex);
      const avgHours = dayData ? dayData.total / dayData.count : 0;
      data.push(avgHours);
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'ชั่วโมงทำงานเฉลี่ยตามวัน',
          data,
          backgroundColor: 'rgba(20, 184, 166, 0.8)', // Teal-500 with opacity
          borderColor: 'rgb(13, 148, 136)', // Teal-600
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: 'rgba(20, 184, 166, 0.9)',
          hoverBorderColor: 'rgb(15, 118, 110)', // Teal-700
          hoverBorderWidth: 3
        }
      ]
    };
  };

  const EmptyChartPlaceholder = () => (
    <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
      ไม่มีข้อมูลการทำงานสำหรับเดือนนี้
    </div>
  );

  // Don't render charts until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">กราฟวิเคราะห์การทำงาน</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-card-base rounded-lg shadow p-4 border border-theme-primary">
            <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
              กำลังโหลด...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">กราฟวิเคราะห์การทำงาน</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Hours worked per day chart */}
        <div className="bg-card-base rounded-lg shadow p-4 border border-theme-primary">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">ชั่วโมงทำงานรายวัน</h3>
          <div className="h-64">
            {report.attendanceRecords.length > 0 ? (
              <Line 
                data={prepareHoursChartData(report.attendanceRecords)} 
                options={getChartOptions({
                  scales: {
                    y: {
                      min: 0,
                      max: Math.max(10, ...report.attendanceRecords.map(r => r.hoursWorked || 0))
                    }
                  }
                })}
              />
            ) : (
              <EmptyChartPlaceholder />
            )}
          </div>
        </div>

        {/* Average hours by day of week */}
        <div className="bg-card-base rounded-lg shadow p-4 border border-theme-primary">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">ชั่วโมงทำงานเฉลี่ยตามวัน</h3>
          <div className="h-64">
            {report.attendanceRecords.length > 0 ? (
              <Bar 
                data={prepareDailyHoursBarData(report.attendanceRecords)}
                options={getChartOptions({
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 10
                    }
                  }
                })}
              />
            ) : (
              <EmptyChartPlaceholder />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Attendance donut chart */}
        <div className="bg-card-base rounded-lg shadow p-4 border border-theme-primary">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">สัดส่วนการมาทำงาน</h3>
          <div className="h-64 flex flex-col justify-center">
            {/* 🎯 แสดงข้อความพิเศษสำหรับการเข้างานครบ */}
            {report.workingDaysInMonth - report.totalDaysWorked === 0 ? (
              <div className="text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h4 className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">ยอดเยี่ยม!</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">เข้างานครบทุกวันในเดือนนี้</p>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    <strong>{report.totalDaysWorked}</strong> วัน จาก <strong>{report.workingDaysInMonth}</strong> วันทำงาน
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">อัตราการเข้างาน: {report.attendanceRate}%</p>
                </div>
              </div>
            ) : (
              <div style={{ width: '250px', height: '250px', margin: '0 auto' }}>
                <Doughnut 
                  data={prepareAttendanceDonutData(report)} 
                  options={getDoughnutOptions()}
                />
              </div>
            )}
          </div>
        </div>

        {/* Compliance donut chart */}
        <div className="bg-card-base rounded-lg shadow p-4 border border-theme-primary">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">การทำงานครบตามเวลา (9 ชม.)</h3>
          <div className="h-64 flex flex-col justify-center">
            {/* 🎯 แสดงข้อความพิเศษสำหรับการทำงานครบเวลาทุกวัน */}
            {report.totalDaysWorked > 0 && report.completeDays === report.totalDaysWorked ? (
              <div className="text-center">
                <div className="text-4xl mb-4">💪</div>
                <h4 className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-2">สุดยอด!</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">ทำงานครบ 9 ชั่วโมงทุกวัน</p>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    <strong>{report.completeDays}</strong> วัน จาก <strong>{report.totalDaysWorked}</strong> วันที่ทำงาน
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">อัตราการทำงานครบเวลา: {report.complianceRate}%</p>
                </div>
              </div>
            ) : (
              <div style={{ width: '250px', height: '250px', margin: '0 auto' }}>
                <Doughnut 
                  data={prepareComplianceDonutData(report)} 
                  options={getDoughnutOptions()}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

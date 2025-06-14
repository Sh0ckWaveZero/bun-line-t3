"use client";

import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { AttendanceRecord, MonthlyAttendanceReport, AttendanceChartsProps } from '~/lib/types';

export const AttendanceCharts: React.FC<AttendanceChartsProps> = ({ report }) => {
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
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          tension: 0.1
        },
        {
          label: 'เป้าหมาย (9 ชม.)',
          data: sortedRecords.map(() => 9),
          borderColor: 'rgba(249, 115, 22, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      ]
    };
  };

  const prepareAttendanceDonutData = (report: MonthlyAttendanceReport) => {
    return {
      labels: ['มาทำงาน', 'ขาดงาน'],
      datasets: [
        {
          data: [report.totalDaysWorked, report.workingDaysInMonth - report.totalDaysWorked],
          backgroundColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
          hoverOffset: 4
        }
      ]
    };
  };

  const prepareComplianceDonutData = (report: MonthlyAttendanceReport) => {
    return {
      labels: ['ทำงานครบ 9 ชม.', 'ทำงานไม่ครบ 9 ชม.'],
      datasets: [
        {
          data: [report.completeDays, report.totalDaysWorked - report.completeDays],
          backgroundColor: ['rgb(124, 58, 237)', 'rgb(249, 115, 22)'],
          hoverOffset: 4
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
          backgroundColor: 'rgba(124, 58, 237, 0.7)',
          borderRadius: 5
        }
      ]
    };
  };

  const EmptyChartPlaceholder = () => (
    <div className="flex h-full items-center justify-center text-gray-400">
      ไม่มีข้อมูลการทำงานสำหรับเดือนนี้
    </div>
  );

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">กราฟวิเคราะห์การทำงาน</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Hours worked per day chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-4">ชั่วโมงทำงานรายวัน</h3>
          <div className="h-64">
            {report.attendanceRecords.length > 0 ? (
              <Line 
                data={prepareHoursChartData(report.attendanceRecords)} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  },
                  scales: {
                    y: {
                      min: 0,
                      max: Math.max(10, ...report.attendanceRecords.map(r => r.hoursWorked || 0))
                    }
                  }
                }}
              />
            ) : (
              <EmptyChartPlaceholder />
            )}
          </div>
        </div>

        {/* Average hours by day of week */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-4">ชั่วโมงทำงานเฉลี่ยตามวัน</h3>
          <div className="h-64">
            {report.attendanceRecords.length > 0 ? (
              <Bar 
                data={prepareDailyHoursBarData(report.attendanceRecords)}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
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
                }}
              />
            ) : (
              <EmptyChartPlaceholder />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Attendance donut chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-4">สัดส่วนการมาทำงาน</h3>
          <div className="h-64 flex justify-center">
            <div style={{ width: '250px', height: '250px' }}>
              <Doughnut 
                data={prepareAttendanceDonutData(report)} 
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Compliance donut chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-4">การทำงานครบตามเวลา (9 ชม.)</h3>
          <div className="h-64 flex justify-center">
            <div style={{ width: '250px', height: '250px' }}>
              <Doughnut 
                data={prepareComplianceDonutData(report)} 
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

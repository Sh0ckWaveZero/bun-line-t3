"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  roundToOneDecimal
} from '~/lib/utils/number';
import { AttendanceStatusType } from '@prisma/client';

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

interface AttendanceRecord {
  id: string;
  workDate: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: AttendanceStatusType;
  hoursWorked: number | null;
}

interface MonthlyAttendanceReport {
  userId: string;
  month: string;
  totalDaysWorked: number;
  totalHoursWorked: number;
  attendanceRecords: AttendanceRecord[];
  workingDaysInMonth: number;
  attendanceRate: number;
  complianceRate: number; // percentage of days with full 9-hour work
  averageHoursPerDay: number;
  completeDays: number; // number of days with complete 9-hour work
}

export default function AttendanceReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [report, setReport] = useState<MonthlyAttendanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  // Get userId from session
  const userId = session?.user?.id || '';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Store current path to redirect back after login
      sessionStorage.setItem('returnUrl', '/attendance-report');
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (userId && selectedMonth) {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedMonth]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">รายงานการเข้างานรายเดือน</h1>
            <p className="text-gray-600 mb-6">กรุณาเข้าสู่ระบบเพื่อดูรายงานการเข้างาน</p>
            <button
              onClick={() => signIn()}
              className="flex w-full items-center justify-center gap-4 rounded-md bg-[#06C755] px-4 py-3 text-center text-white transition duration-300 ease-in-out hover:bg-[#06C755] hover:bg-opacity-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="24"
                height="24"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#fff"
                  d="M37.113,22.417c0-5.865-5.88-10.637-13.107-10.637s-13.108,4.772-13.108,10.637c0,5.258,4.663,9.662,10.962,10.495c0.427,0.092,1.008,0.282,1.155,0.646c0.132,0.331,0.086,0.85,0.042,1.185c0,0-0.153,0.925-0.187,1.122c-0.057,0.331-0.263,1.296,1.135,0.707c1.399-0.589,7.548-4.445,10.298-7.611h-0.001C36.203,26.879,37.113,24.764,37.113,22.417z M18.875,25.907h-2.604c-0.379,0-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687c0.379,0,0.687,0.308,0.687,0.687v4.521h1.917c0.379,0,0.687,0.308,0.687,0.687C19.562,25.598,19.254,25.907,18.875,25.907z M21.568,25.219c0,0.379-0.308,0.688-0.687,0.688s-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687s0.687,0.308,0.687,0.687V25.219z M27.838,25.219c0,0.297-0.188,0.559-0.47,0.652c-0.071,0.024-0.145,0.036-0.218,0.036c-0.215,0-0.42-0.103-0.549-0.275l-2.669-3.635v3.222c0,0.379-0.308,0.688-0.688,0.688c-0.379,0-0.688-0.308-0.688-0.688V20.01c0-0.296,0.189-0.558,0.47-0.652c0.071-0.024,0.144-0.035,0.218-0.035c0.214,0,0.42,0.103,0.549,0.275l2.67,3.635V20.01c0-0.379,0.309-0.687,0.688-0.687c0.379,0,0.687,0.308,0.687,0.687V25.219z M32.052,21.927c0.379,0,0.688,0.308,0.688,0.688c0,0.379-0.308,0.687-0.688,0.687h-1.917v1.23h1.917c0.379,0,0.688,0.308,0.688,0.687c0,0.379-0.309,0.688-0.688,0.688h-2.604c-0.378,0-0.687-0.308-0.687-0.688v-2.603c0-0.001,0-0.001,0-0.001c0,0,0-0.001,0-0.001v-2.601c0-0.001,0-0.001,0-0.002c0-0.379,0.308-0.687,0.687-0.687h2.604c0.379,0,0.688,0.308,0.688,0.687s-0.308,0.687-0.688,0.687h-1.917v1.23H32.052z"
                ></path>
              </svg>
              <span className="font-bold">เข้าสู่ระบบด้วย LINE</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fetchReport = async () => {
    if (!userId || !selectedMonth) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/attendance-report?userId=${userId}&month=${selectedMonth}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setReport(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHours = (hours: number | null) => {
    if (hours === null) return '-';
    return `${roundToOneDecimal(hours)} ชั่วโมง`;
  };

  const getStatusColor = (status: AttendanceStatusType) => {
    switch (status) {
      case AttendanceStatusType.CHECKED_IN_ON_TIME:
        return 'bg-green-100 text-green-800';
      case AttendanceStatusType.CHECKED_IN_LATE:
        return 'bg-yellow-100 text-yellow-800';
      case AttendanceStatusType.CHECKED_OUT:
        return 'bg-blue-100 text-blue-800';
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
      default:
        return status;
    }
  };

  // Helper functions for chart data
  const prepareHoursChartData = (records: AttendanceRecord[]) => {
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.workDate).getTime() - new Date(b.workDate).getTime()
    );
    
    return {
      labels: sortedRecords.map(record => formatShortDate(record.workDate)),
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
          data: sortedRecords.map(() => 9), // 9 hours target line
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
    // Group by day of week and calculate average hours
    const dayMap = new Map<number, {total: number, count: number}>();
    
    records.forEach(record => {
      if (record.hoursWorked) {
        const date = new Date(record.workDate);
        const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
        
        if (!dayMap.has(day)) {
          dayMap.set(day, {total: 0, count: 0});
        }
        
        const current = dayMap.get(day)!;
        current.total += record.hoursWorked;
        current.count += 1;
      }
    });
    
    // Create array of day names in correct order (Monday first for Thai localization)
    const dayNames = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Monday first
    
    const labels = [];
    const data = [];
    
    for (const dayIndex of dayOrder) {
      labels.push(dayNames[dayIndex === 0 ? 6 : dayIndex - 1]); // Convert to 0-indexed for array
      
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
  
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    // Convert to Bangkok timezone first
    const bangkokDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    return format(bangkokDate, 'd MMM', { locale: th });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">รายงานการเข้างานรายเดือน</h1>
          
          {/* Month Selector */}
          <div className="mb-6">
            <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-2">
              เลือกเดือน
            </label>
            <input
              id="month-select"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* User Information */}
          {session?.user && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600 mb-2">ข้อมูลผู้ใช้</h3>
              <div className="flex items-center gap-3">
                {session.user.image && (
                  <Image 
                    src={session.user.image} 
                    alt="Profile" 
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                  <p className="text-xs text-gray-500">ID: {session.user.id}</p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {report && !loading && (
            <>
              {/* Summary Cards */}
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

              {/* Attendance Records Table */}
              {/* Charts */}
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
                        <div className="flex h-full items-center justify-center text-gray-400">
                          ไม่มีข้อมูลการทำงานสำหรับเดือนนี้
                        </div>
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
                        <div className="flex h-full items-center justify-center text-gray-400">
                          ไม่มีข้อมูลการทำงานสำหรับเดือนนี้
                        </div>
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

              {/* Detailed Table */}
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.attendanceRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(record.workDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTime(record.checkInTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.checkOutTime ? formatTime(record.checkOutTime) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatHours(record.hoursWorked)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                              {getStatusText(record.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {report.attendanceRecords.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      ไม่มีข้อมูลการเข้างานในเดือนนี้
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

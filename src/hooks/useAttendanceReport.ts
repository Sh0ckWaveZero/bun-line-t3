"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AttendanceRecord, MonthlyAttendanceReport, EditAttendanceData } from '~/lib/types';

export const useAttendanceReport = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Report States
  const [report, setReport] = useState<MonthlyAttendanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('');

  // 🛡️ Initialize selectedMonth safely after hydration
  useEffect(() => {
    if (!selectedMonth) {
      const now = new Date();
      const defaultMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      setSelectedMonth(defaultMonth);
    }
  }, [selectedMonth]);

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editData, setEditData] = useState<EditAttendanceData>({
    checkInTime: '',
    checkOutTime: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  const userId = session?.user?.id || '';

  // 🔐 SECURITY: Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      sessionStorage.setItem('returnUrl', '/attendance-report');
      router.push('/');
    }
  }, [status, router]);

  // Fetch report when userId or selectedMonth changes
  useEffect(() => {
    if (userId && selectedMonth) {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedMonth]); // Intentionally excluding fetchReport to avoid infinite loop

  // 🔐 SECURITY: Pure function for secure API calls
  const fetchReport = useCallback(async () => {
    if (!userId || !selectedMonth) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/attendance-report?userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(selectedMonth)}`);
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
  }, [userId, selectedMonth]);

  // 🔐 SECURITY: Secure time conversion functions
  const formatForInput = useCallback((utcDateString: string) => {
    const utcDate = new Date(utcDateString);
    
    const bangkokTime = new Date(utcDate.toLocaleString('en-US', { 
      timeZone: 'Asia/Bangkok' 
    }));
    
    const year = bangkokTime.getFullYear();
    const month = (bangkokTime.getMonth() + 1).toString().padStart(2, '0');
    const day = bangkokTime.getDate().toString().padStart(2, '0');
    const hours = bangkokTime.getHours().toString().padStart(2, '0');
    const minutes = bangkokTime.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, []);

  const convertToISOWithTimezone = useCallback((bangkokTimeString: string) => {
    if (!bangkokTimeString) return null;
    return `${bangkokTimeString}:00+07:00`;
  }, []);

  // Modal Management Functions
  const openEditModal = useCallback((record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditData({
      checkInTime: formatForInput(record.checkInTime),
      checkOutTime: record.checkOutTime ? formatForInput(record.checkOutTime) : ''
    });
    setEditModalOpen(true);
  }, [formatForInput]);

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditingRecord(null);
    setEditData({ checkInTime: '', checkOutTime: '' });
  }, []);

  // 🔐 SECURITY: Secure update function with validation
  const updateAttendance = useCallback(async () => {
    if (!editingRecord || !editData.checkInTime) return;

    setUpdateLoading(true);
    try {
      const response = await fetch('/api/attendance/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceId: editingRecord.id,
          checkInTime: convertToISOWithTimezone(editData.checkInTime),
          checkOutTime: editData.checkOutTime ? convertToISOWithTimezone(editData.checkOutTime) : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update attendance');
      }

      await fetchReport();
      closeEditModal();
      
      alert('อัพเดทข้อมูลการลงเวลาเรียบร้อยแล้ว');
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัพเดท');
    } finally {
      setUpdateLoading(false);
    }
  }, [editingRecord, editData, convertToISOWithTimezone, fetchReport, closeEditModal]);

  return {
    // Session
    session,
    status,
    
    // Report Data
    report,
    loading,
    error,
    selectedMonth,
    setSelectedMonth,
    
    // Edit Modal
    editModalOpen,
    editingRecord,
    editData,
    setEditData,
    updateLoading,
    
    // Functions
    fetchReport,
    openEditModal,
    closeEditModal,
    updateAttendance,
  };
};

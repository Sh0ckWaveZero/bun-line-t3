"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useClientOnlyMounted } from '~/hooks/useHydrationSafe';

// Dynamic import เพื่อป้องกัน SSR issues
const EditAttendanceModal = dynamic(
  () => import('~/components/attendance/EditAttendanceModal').then(mod => ({ default: mod.EditAttendanceModal })),
  { ssr: false }
);

import { AttendanceStatusType } from '~/features/attendance/types/attendance-status';

// Debug page เพื่อทดสอบ modal
export default function DebugModalPage() {
  const [mounted, setMounted] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const isClient = useClientOnlyMounted();
  const [editData, setEditData] = React.useState({
    checkInTime: '2024-01-15T09:00',
    checkOutTime: '2024-01-15T17:30'
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  const mockEditingRecord = {
    id: 'test-123',
    workDate: '2024-01-15',
    checkInTime: '2024-01-15T09:00:00.000Z',
    checkOutTime: '2024-01-15T17:30:00.000Z',
    status: AttendanceStatusType.CHECKED_OUT,
    hoursWorked: 8.5
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">Debug Modal Test</h1>
        
        <div className="space-y-4">
          <div>
            <strong>User Agent:</strong>
            <div className="text-sm text-gray-600 break-all">
              {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
            </div>
          </div>
          
          <div>
            <strong>Window Size:</strong>
            <div className="text-sm text-gray-600">
              {isClient && typeof window !== 'undefined' ? `${window.innerWidth} x ${window.innerHeight}` : 'Loading...'}
            </div>
          </div>
          
          <div>
            <strong>Touch Support:</strong>
            <div className="text-sm text-gray-600">
              {isClient && typeof navigator !== 'undefined' ? 
                ('ontouchstart' in window ? 'Yes' : 'No') : 'Loading...'}
            </div>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            style={{ minHeight: '44px' }}
          >
            เปิด Modal ทดสอบ
          </button>
          
          <div className="text-xs text-gray-500">
            เปิด Developer Console เพื่อดู debug logs
          </div>
        </div>
      </div>

      <EditAttendanceModal
        isOpen={isModalOpen}
        editingRecord={mockEditingRecord}
        editData={editData}
        updateLoading={false}
        onClose={() => setIsModalOpen(false)}
        onEditDataChange={setEditData}
        onUpdate={async () => {
          console.log('Mock update:', editData);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

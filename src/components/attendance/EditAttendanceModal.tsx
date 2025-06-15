"use client";

import React from 'react';
import type { AttendanceRecord, EditAttendanceData, EditAttendanceModalProps } from '@/lib/types';
import { CenteredModal } from '@/components/common/CenteredModal';
import { MobileModal } from '@/components/common/MobileModal';
import { dateFormatters } from '@/lib/utils/date-formatting';

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  isOpen,
  editingRecord,
  editData,
  updateLoading,
  onClose,
  onEditDataChange,
  onUpdate
}) => {
  // 🎯 Detect mobile device - must be called before any early returns
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Multiple detection methods for better accuracy
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent.toLowerCase());
      const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // More aggressive mobile detection
      const mobile = isMobileDevice || isTablet || (isSmallScreen && isTouchDevice);
      setIsMobile(mobile);
      
      // Enhanced debug logging
      console.log('🔍 Mobile Detection Details:', {
        userAgent: userAgent.substring(0, 80),
        isMobileDevice,
        isTablet,
        isSmallScreen,
        isTouchDevice,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        maxTouchPoints: navigator.maxTouchPoints,
        finalResult: mobile,
        timestamp: new Date().toISOString()
      });
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // 🔐 SECURITY: ไม่แสดง modal หากไม่เปิดหรือไม่มีข้อมูล - after hooks
  if (!isOpen || !editingRecord) return null;

  const handleCheckInChange = (value: string) => {
    onEditDataChange({ ...editData, checkInTime: value });
  };

  const handleCheckOutChange = (value: string) => {
    onEditDataChange({ ...editData, checkOutTime: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate();
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  // 🎯 ใช้ modal ที่เหมาะสมกับ device
  const ModalComponent = isMobile ? MobileModal : CenteredModal;
  
  console.log('🚀 Rendering EditAttendanceModal:', { 
    isOpen, 
    isMobile, 
    editingRecord: !!editingRecord,
    ModalComponent: isMobile ? 'MobileModal' : 'CenteredModal'
  });

  // 🔐 SECURITY: ใช้ React.Portal เพื่อ render ที่ body level เสมอ
  if (!document) return null;

  const modalContent = (
    <>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
            แก้ไขเวลาเข้า-ออกงาน
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={updateLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="ปิดหน้าต่าง"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p id="modal-description" className="text-sm text-gray-500 mt-2">
          วันที่: {dateFormatters.fullDate(editingRecord.workDate)}
        </p>
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-xs text-blue-700 font-medium">เวลาที่แสดงเป็นเวลาประเทศไทย (UTC+7)</p>
              <p className="text-xs text-blue-600 mt-1">ระบบจะบันทึกเวลาเป็น UTC โดยอัตโนมัติ</p>
            </div>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} noValidate>
        <div className="px-6 py-4 space-y-6">
          <div>
            <label htmlFor="edit-checkin" className="block text-sm font-medium text-gray-700 mb-2">
              เวลาเข้างาน <span className="text-red-500" aria-label="จำเป็น">*</span>
            </label>
            <input
              id="edit-checkin"
              type="time"
              value={editData.checkInTime}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
              disabled={updateLoading}
              aria-describedby="checkin-help"
            />
            <p id="checkin-help" className="text-xs text-gray-500 mt-2">
              กรุณาเลือกเวลาเข้างาน (เฉพาะเวลา ไม่สามารถเปลี่ยนวันได้)
            </p>
          </div>
          
          <div>
            <label htmlFor="edit-checkout" className="block text-sm font-medium text-gray-700 mb-2">
              เวลาออกงาน
            </label>
            <input
              id="edit-checkout"
              type="time"
              value={editData.checkOutTime}
              onChange={(e) => handleCheckOutChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={updateLoading}
              aria-describedby="checkout-help"
            />
            <p id="checkout-help" className="text-xs text-gray-500 mt-2">
              หากไม่ได้ออกงานให้เว้นว่างไว้ (เฉพาะเวลา ไม่สามารถเปลี่ยนวันได้)
            </p>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={updateLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            style={{ minHeight: '44px' }}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={updateLoading || !editData.checkInTime}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center"
            style={{ minHeight: '44px' }}
          >
            {updateLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" aria-hidden="true"></div>
                <span>กำลังอัพเดท...</span>
              </>
            ) : (
              'บันทึกการแก้ไข'
            )}
          </button>
        </div>
      </form>
    </>
  );

  return (
    <ModalComponent 
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-md"
    >
      {modalContent}
    </ModalComponent>
  );
};
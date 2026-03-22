"use client";

import React from "react";

import { CenteredModal } from "@/components/common/CenteredModal";
import { MobileModal } from "@/components/common/MobileModal";
import { dateFormatters } from "@/lib/utils/date-formatting";
import { EditAttendanceModalProps } from "@/lib/types/attendance";

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  isOpen,
  editingRecord,
  editData,
  updateLoading,
  onClose,
  onEditDataChange,
  onUpdate,
}) => {
  // 🎯 Detect mobile device - must be called before any early returns
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as any).opera;

      // ✅ ปรับปรุง mobile detection ให้แม่นยำขึ้น
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
          userAgent.toLowerCase(),
        );
      const isTablet = /ipad|tablet|playbook|silk/i.test(
        userAgent.toLowerCase(),
      );
      const isSmallScreen = window.innerWidth <= 768; // ปรับเป็น 768px
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

      // ✅ เพิ่มการตรวจสอบ user agent strings ที่เฉพาะเจาะจง
      const mobileKeywords = /mobile|android|iphone|ipad|phone|tablet/i.test(
        userAgent,
      );

      // ✅ Force mobile สำหรับ screen ขนาดเล็ก
      const mobile =
        isMobileDevice ||
        isTablet ||
        isSmallScreen ||
        (isTouchDevice && mobileKeywords);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
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
      console.error("Update error:", error);
    }
  };

  // 🎯 ใช้ modal ที่เหมาะสมกับ device
  const ModalComponent = isMobile ? MobileModal : CenteredModal;

  // 🔐 SECURITY: ใช้ React.Portal เพื่อ render ที่ body level เสมอ
  if (!document) return null;

  const modalContent = (
    <div id="edit-attendance-modal-content">
      <div
        id="modal-header"
        className="border-b border-gray-200 px-6 py-4 dark:border-gray-700"
      >
        <div
          id="modal-header-content"
          className="flex items-center justify-between"
        >
          <h3
            id="modal-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            แก้ไขเวลาเข้า-ออกงาน
          </h3>
          <button
            id="modal-close-btn"
            type="button"
            onClick={onClose}
            disabled={updateLoading}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="ปิดหน้าต่าง"
          >
            <svg
              id="close-icon"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p
          id="modal-description"
          className="mt-2 text-sm text-gray-500 dark:text-gray-400"
        >
          วันที่: {dateFormatters.fullDate(editingRecord.workDate)}
        </p>
        <div
          id="timezone-info"
          className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20"
        >
          <div id="timezone-info-content" className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                id="info-icon"
                className="mt-0.5 h-4 w-4 text-blue-500 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div id="timezone-info-text" className="ml-2">
              <p
                id="timezone-main-text"
                className="text-xs font-medium text-blue-700 dark:text-blue-300"
              >
                เวลาที่แสดงเป็นเวลาประเทศไทย (UTC+7)
              </p>
              <p
                id="timezone-note"
                className="mt-1 text-xs text-blue-600 dark:text-blue-400"
              >
                ระบบจะบันทึกเวลาเป็น UTC โดยอัตโนมัติ
              </p>
            </div>
          </div>
        </div>
      </div>

      <form id="edit-attendance-form" onSubmit={handleSubmit} noValidate>
        <div id="form-content" className="space-y-6 px-6 py-4">
          <div id="checkin-field">
            <label
              htmlFor="edit-checkin"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              เวลาเข้างาน{" "}
              <span
                className="text-red-500 dark:text-red-400"
                aria-label="จำเป็น"
              >
                *
              </span>
            </label>
            <input
              id="edit-checkin"
              type="time"
              value={editData.checkInTime}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700"
              required
              disabled={updateLoading}
              aria-describedby="checkin-help"
            />
            <p
              id="checkin-help"
              className="mt-2 text-xs text-gray-500 dark:text-gray-400"
            >
              กรุณาเลือกเวลาเข้างาน (เฉพาะเวลา ไม่สามารถเปลี่ยนวันได้)
            </p>
          </div>

          <div>
            <label
              htmlFor="edit-checkout"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              เวลาออกงาน
            </label>
            <input
              id="edit-checkout"
              type="time"
              value={editData.checkOutTime}
              onChange={(e) => handleCheckOutChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700"
              disabled={updateLoading}
              aria-describedby="checkout-help"
            />
            <p
              id="checkout-help"
              className="mt-2 text-xs text-gray-500 dark:text-gray-400"
            >
              หากไม่ได้ออกงานให้เว้นว่างไว้ (เฉพาะเวลา ไม่สามารถเปลี่ยนวันได้)
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 rounded-b-xl bg-gray-50 px-6 py-4 sm:flex-row dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            disabled={updateLoading}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            style={{ minHeight: "44px" }}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={updateLoading || !editData.checkInTime}
            className="flex w-full items-center justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            style={{ minHeight: "44px" }}
          >
            {updateLoading ? (
              <>
                <div
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                ></div>
                <span>กำลังอัพเดท...</span>
              </>
            ) : (
              "บันทึกการแก้ไข"
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <ModalComponent
      isOpen={isOpen}
      onClose={onClose}
      className="edit-attendance-modal" // ✅ เพิ่ม specific class name
    >
      <div
        className="edit-attendance-modal-content"
        style={{
          /* ✅ ป้องกัน content overflow และรับประกันการแสดงผลที่สมบูรณ์ */
          minHeight: "fit-content",
          width: "100%",
        }}
      >
        {modalContent}
      </div>
    </ModalComponent>
  );
};

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
  const [isMobile, setIsMobile] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);

    const checkMobile = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as any).opera;

      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
          userAgent.toLowerCase(),
        );
      const isSmallScreen = window.innerWidth <= 768;
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const mobileKeywords = /mobile|android|iphone|ipad|phone|tablet/i.test(
        userAgent,
      );

      const mobile =
        isMobileDevice || isSmallScreen || (isTouchDevice && mobileKeywords);
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

  const ModalComponent = isMobile ? MobileModal : CenteredModal;

  if (!isMounted) return null;

  const modalContent = (
    <div>
      <div className="border-b border-slate-200 px-6 py-4 dark:border-white/[0.08]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            แก้ไขเวลาเข้า-ออกงาน
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={updateLoading}
            className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-200"
            aria-label="ปิดหน้าต่าง"
          >
            <svg
              className="size-5"
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
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          วันที่: {dateFormatters.fullDate(editingRecord.workDate)}
        </p>
        <div className="mt-3 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            เวลาที่แสดงเป็นเวลาประเทศไทย (UTC+7)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5 px-6 py-4">
          <div>
            <label
              htmlFor="edit-checkin"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              เวลาเข้างาน <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-checkin"
              type="time"
              value={editData.checkInTime}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 transition-colors outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100 dark:[color-scheme:dark]"
              required
              disabled={updateLoading}
            />
          </div>

          <div>
            <label
              htmlFor="edit-checkout"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              เวลาออกงาน
            </label>
            <input
              id="edit-checkout"
              type="time"
              value={editData.checkOutTime}
              onChange={(e) => handleCheckOutChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 transition-colors outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100 dark:[color-scheme:dark]"
              disabled={updateLoading}
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              หากไม่ได้ออกงานให้เว้นว่างไว้
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 bg-slate-50/50 px-6 py-4 sm:flex-row dark:border-white/[0.08] dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            disabled={updateLoading}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08]"
            style={{ minHeight: "40px" }}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={updateLoading || !editData.checkInTime}
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:focus-visible:ring-offset-[#151719]"
            style={{ minHeight: "40px" }}
          >
            {updateLoading ? (
              <>
                <div
                  className="mr-2 size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
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
      className="edit-attendance-modal"
    >
      <div className="w-full" style={{ minHeight: "fit-content" }}>
        {modalContent}
      </div>
    </ModalComponent>
  );
};

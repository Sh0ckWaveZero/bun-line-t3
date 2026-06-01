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

  React.useEffect(() => {
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

  if (!document) return null;

  const modalContent = (
    <div>
      <div className="border-border border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground text-lg font-semibold">
            แก้ไขเวลาเข้า-ออกงาน
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={updateLoading}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="ปิดหน้าต่าง"
          >
            <svg
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
        <p className="text-muted-foreground mt-2 text-sm">
          วันที่: {dateFormatters.fullDate(editingRecord.workDate)}
        </p>
        <div className="bg-muted/50 mt-3 rounded-lg px-3 py-2">
          <p className="text-muted-foreground text-xs">
            เวลาที่แสดงเป็นเวลาประเทศไทย (UTC+7)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5 px-6 py-4">
          <div>
            <label
              htmlFor="edit-checkin"
              className="text-foreground mb-1.5 block text-sm font-medium"
            >
              เวลาเข้างาน <span className="text-destructive">*</span>
            </label>
            <input
              id="edit-checkin"
              type="time"
              value={editData.checkInTime}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/20 w-full rounded-md border px-3 py-2 text-sm transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              required
              disabled={updateLoading}
            />
          </div>

          <div>
            <label
              htmlFor="edit-checkout"
              className="text-foreground mb-1.5 block text-sm font-medium"
            >
              เวลาออกงาน
            </label>
            <input
              id="edit-checkout"
              type="time"
              value={editData.checkOutTime}
              onChange={(e) => handleCheckOutChange(e.target.value)}
              className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/20 w-full rounded-md border px-3 py-2 text-sm transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              disabled={updateLoading}
            />
            <p className="text-muted-foreground mt-1.5 text-xs">
              หากไม่ได้ออกงานให้เว้นว่างไว้
            </p>
          </div>
        </div>

        <div className="border-border bg-muted/30 flex flex-col-reverse justify-end gap-3 rounded-b-xl border-t px-6 py-4 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={updateLoading}
            className="border-border bg-card text-foreground hover:bg-muted focus:ring-ring w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            style={{ minHeight: "40px" }}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={updateLoading || !editData.checkInTime}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            style={{ minHeight: "40px" }}
          >
            {updateLoading ? (
              <>
                <div
                  className="border-primary-foreground/30 border-t-primary-foreground mr-2 h-4 w-4 animate-spin rounded-full border-2"
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

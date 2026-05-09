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
        isMobileDevice ||
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
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            แก้ไขเวลาเข้า-ออกงาน
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={updateLoading}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="ปิดหน้าต่าง"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          วันที่: {dateFormatters.fullDate(editingRecord.workDate)}
        </p>
        <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            เวลาที่แสดงเป็นเวลาประเทศไทย (UTC+7)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5 px-6 py-4">
          <div>
            <label
              htmlFor="edit-checkin"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              เวลาเข้างาน <span className="text-destructive">*</span>
            </label>
            <input
              id="edit-checkin"
              type="time"
              value={editData.checkInTime}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              required
              disabled={updateLoading}
            />
          </div>

          <div>
            <label
              htmlFor="edit-checkout"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              เวลาออกงาน
            </label>
            <input
              id="edit-checkout"
              type="time"
              value={editData.checkOutTime}
              onChange={(e) => handleCheckOutChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={updateLoading}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              หากไม่ได้ออกงานให้เว้นว่างไว้
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4 sm:flex-row rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={updateLoading}
            className="w-full rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            style={{ minHeight: "40px" }}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={updateLoading || !editData.checkInTime}
            className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            style={{ minHeight: "40px" }}
          >
            {updateLoading ? (
              <>
                <div
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
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

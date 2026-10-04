"use client";

/**
 * ApprovalRejectDialog
 * Dialog ยืนยันการปฏิเสธคำขอ (พร้อมช่องกรอกเหตุผล ไม่บังคับ)
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ApprovalRejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

export function ApprovalRejectDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: ApprovalRejectDialogProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background w-full max-w-md rounded-xl shadow-xl">
        <div className="border-border border-b p-5">
          <h3 className="font-semibold">ยืนยันการปฏิเสธ</h3>
          <label
            htmlFor="line-rejection-reason"
            className="text-muted-foreground mt-1 block text-sm"
          >
            กรุณาระบุเหตุผลในการปฏิเสธ (ไม่บังคับ)
          </label>
        </div>
        <div className="p-5">
          <textarea
            id="line-rejection-reason"
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            rows={3}
            placeholder="เช่น ไม่ผ่านเกณฑ์การใช้งาน, ข้อมูลไม่ครบ..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
          <p className="text-muted-foreground mt-1 text-right text-xs">
            {reason.length}/500
          </p>
        </div>
        <div className="border-border flex justify-end gap-2 border-t p-5">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
          >
            {isLoading ? "กำลังดำเนินการ..." : "ยืนยันปฏิเสธ"}
          </Button>
        </div>
      </div>
    </div>
  );
}

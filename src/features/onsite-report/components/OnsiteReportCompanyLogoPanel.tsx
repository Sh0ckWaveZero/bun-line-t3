"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialogBox } from "@/components/ui/AlertDialog";
import {
  ONSITE_REPORT_LOGO_MAX_BYTES,
  ONSITE_REPORT_LOGO_MIME_TYPES,
} from "../lib/logo-image";
import { onsiteReportCompanyLogoUrl } from "../hooks/useOnsiteReportCompanies";
import type { OnsiteReportCompany } from "../types";

interface OnsiteReportCompanyLogoPanelProps {
  company: OnsiteReportCompany;
  isBusy: boolean;
  onUpload: (file: File) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}

const ACCEPT = ONSITE_REPORT_LOGO_MIME_TYPES.join(",");

/** ตรวจเบื้องต้นฝั่ง client เพื่อแจ้งเร็ว — ฝั่ง API ตรวจ magic bytes จริงซ้ำเสมอ */
const getFileError = (file: File): string | null => {
  if (!(ONSITE_REPORT_LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "รองรับเฉพาะไฟล์ PNG หรือ JPEG";
  }
  if (file.size > ONSITE_REPORT_LOGO_MAX_BYTES) {
    return `ไฟล์ใหญ่เกิน ${ONSITE_REPORT_LOGO_MAX_BYTES / 1024}KB`;
  }
  return null;
};

/** ส่วนโลโก้ของบริษัท: ดูของเดิม → เลือกไฟล์ใหม่ → ดูตัวอย่าง → อัปโหลด/ลบ */
export const OnsiteReportCompanyLogoPanel = ({
  company,
  isBusy,
  onUpload,
  onDelete,
}: OnsiteReportCompanyLogoPanelProps) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // object URL สร้าง/คืนใน event handler (ไม่ setState ใน effect) + คืนตอน unmount
  const previewUrlRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const setPreviewFile = (file: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    previewUrlRef.current = url;
    setSelectedFile(file);
    setPreviewUrl(url);
  };

  const resetSelection = () => {
    setPreviewFile(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      resetSelection();
      return;
    }
    const error = getFileError(file);
    setFileError(error);
    setPreviewFile(error ? null : file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await onUpload(selectedFile);
      resetSelection();
    } catch {
      // toast แจ้งใน mutation แล้ว — คงไฟล์ที่เลือกไว้ให้ลองใหม่ได้
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await onDelete();
      setIsDeleteOpen(false);
    } catch {
      // toast แจ้งใน mutation แล้ว
    }
  };

  const shownUrl =
    previewUrl ?? (company.hasLogo ? onsiteReportCompanyLogoUrl(company) : null);

  return (
    <div>
      {/* พื้นขาวเสมอ เพราะกระดาษ PDF เป็นสีขาว — เห็นโลโก้เหมือนที่จะออกจริงทั้ง light/dark */}
      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-3 dark:border-white/20">
        {shownUrl ? (
          <img
            src={shownUrl}
            alt={`โลโก้ ${company.name}`}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-xs text-slate-400">
            ยังไม่มีโลโก้ — PDF จะออกโดยไม่มีโลโก้
          </span>
        )}
      </div>
      {selectedFile && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          ตัวอย่างไฟล์ที่เลือก ({selectedFile.name}) — ยังไม่ถูกบันทึกจนกว่าจะกดอัปโหลด
        </p>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={handleFileChange}
        disabled={isBusy}
        aria-label={`เลือกไฟล์โลโก้ของ ${company.name}`}
      />
      <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
        PNG หรือ JPEG ไม่เกิน {ONSITE_REPORT_LOGO_MAX_BYTES / 1024}KB
        (แนะนำ PNG พื้นหลังโปร่งใส)
      </p>
      {fileError && (
        <p role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400">
          {fileError}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp aria-hidden="true" />
          เลือกไฟล์
        </Button>
        <Button
          size="sm"
          disabled={!selectedFile || isBusy}
          onClick={() => void handleUpload()}
        >
          อัปโหลด
        </Button>
        {company.hasLogo && (
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
            disabled={isBusy}
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 aria-hidden="true" />
            ลบโลโก้
          </Button>
        )}
      </div>

      <AlertDialogBox
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="ลบโลโก้นี้?"
        description={`PDF ของ ${company.name} จะออกโดยไม่มีโลโก้จนกว่าจะอัปโหลดใหม่`}
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(false)}
            disabled={isBusy}
          >
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void handleConfirmDelete()}
            disabled={isBusy}
          >
            ลบโลโก้
          </Button>
        </div>
      </AlertDialogBox>
    </div>
  );
};

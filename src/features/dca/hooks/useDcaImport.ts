import { useCallback, useRef, useState } from "react";
import { ACCEPTED_EXTS } from "@/features/dca/constants/dca-import";
import { getFileExtension } from "@/features/dca/helpers/dca-import";
import { useAuthSession } from "@/lib/auth/session-context";
import type { ImportResult } from "@/features/dca/types";

/** ขั้นตอนของ modal นำเข้าประวัติ Auto DCA */
export type DcaImportStep = "select" | "uploading" | "result";

interface UseDcaImportParams {
  onSuccess: () => void;
}

interface UseDcaImportResult {
  step: DcaImportStep;
  file: File | null;
  dragOver: boolean;
  result: ImportResult | null;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleRemoveFile: () => void;
  handleUpload: () => Promise<void>;
}

/** State machine ของ modal นำเข้าประวัติ Auto DCA (เลือกไฟล์ → อัปโหลด → ผลลัพธ์) */
export const useDcaImport = ({
  onSuccess,
}: UseDcaImportParams): UseDcaImportResult => {
  const lineUserId = useAuthSession()?.user?.lineUserId;
  const [step, setStep] = useState<DcaImportStep>("select");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (f: File) => {
    const ext = getFileExtension(f.name);
    if (!ACCEPTED_EXTS.includes(`.${ext}` as (typeof ACCEPTED_EXTS)[number])) {
      setError("รองรับเฉพาะไฟล์ .csv, .json, .xlsx เท่านั้น");
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleRemoveFile = () => setFile(null);

  const handleUpload = async () => {
    if (!file) return;
    setStep("uploading");
    setError(null);

    try {
      if (!lineUserId) {
        throw new Error("ไม่พบ LINE user ID");
      }

      const fd = new FormData();
      fd.append("lineUserId", lineUserId);
      fd.append("file", file);

      const res = await fetch("/api/dca/import", {
        method: "POST",
        body: fd,
      });

      const data = (await res.json()) as ImportResult & { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "นำเข้าไม่สำเร็จ");
      }

      setResult(data);
      setStep("result");

      if (data.imported > 0) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setStep("select");
    }
  };

  return {
    step,
    file,
    dragOver,
    result,
    error,
    inputRef,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleRemoveFile,
    handleUpload,
  };
};

import type { RefObject } from "react";
import { AlertCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DcaImportDropzone } from "@/features/dca/components/DcaImportDropzone";
import { DcaImportFormatHint } from "@/features/dca/components/DcaImportFormatHint";
import { DcaImportSelectedFile } from "@/features/dca/components/DcaImportSelectedFile";

interface DcaImportSelectStepProps {
  dragOver: boolean;
  file: File | null;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onUpload: () => void;
  onClose: () => void;
}

/** ขั้นตอนเลือกไฟล์ของ modal นำเข้า */
export const DcaImportSelectStep = ({
  dragOver,
  file,
  error,
  inputRef,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileChange,
  onRemoveFile,
  onUpload,
  onClose,
}: DcaImportSelectStepProps) => (
  <div id="dca-import-step-select" className="space-y-4">
    {/* Dropzone */}
    <DcaImportDropzone
      dragOver={dragOver}
      inputRef={inputRef}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onFileChange={onFileChange}
    />

    {/* Selected file */}
    {file && <DcaImportSelectedFile file={file} onRemove={onRemoveFile} />}

    {/* Error */}
    {error && (
      <div
        id="dca-import-select-error"
        className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400"
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error}
      </div>
    )}

    {/* Format hint */}
    <DcaImportFormatHint />

    {/* Actions */}
    <div className="flex justify-end gap-2 pt-1">
      <Button variant="outline" size="sm" onClick={onClose}>
        ยกเลิก
      </Button>
      <Button
        id="dca-import-submit-button"
        size="sm"
        disabled={!file}
        onClick={onUpload}
        className="gap-2 bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50"
      >
        <Upload className="h-4 w-4" />
        นำเข้า
      </Button>
    </div>
  </div>
);

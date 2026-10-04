import type { RefObject } from "react";
import { Upload } from "lucide-react";
import { ACCEPTED_MIME } from "@/features/dca/constants/dca-import";

interface DcaImportDropzoneProps {
  dragOver: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/** พื้นที่ลากวางไฟล์พร้อม input file ที่ซ่อนอยู่ */
export const DcaImportDropzone = ({
  dragOver,
  inputRef,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileChange,
}: DcaImportDropzoneProps) => (
  <div
    id="dca-import-dropzone"
    onClick={() => inputRef.current?.click()}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        inputRef.current?.click();
      }
    }}
    role="button"
    tabIndex={0}
    aria-label="เลือกไฟล์สำหรับนำเข้าประวัติ Auto DCA"
    onDrop={onDrop}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${
      dragOver
        ? "border-yellow-400 bg-yellow-400/10"
        : "border-border hover:bg-muted/30 hover:border-yellow-400/50"
    }`}
  >
    <Upload
      className={`mb-3 h-8 w-8 ${dragOver ? "text-yellow-400" : "text-muted-foreground"}`}
    />
    <p className="text-sm font-medium">วาง หรือคลิกเพื่อเลือกไฟล์</p>
    <p className="text-muted-foreground mt-1 text-xs">
      รองรับ .csv, .json, .xlsx
    </p>
    <input
      ref={inputRef}
      id="dca-import-file-input"
      type="file"
      accept={ACCEPTED_MIME}
      className="hidden"
      onChange={onFileChange}
    />
  </div>
);

import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  FileSpreadsheet,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ImportResult } from "@/features/dca/types";
import { useAuthSession } from "@/lib/auth/session-context";

interface DcaImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ACCEPTED_EXTS = [".csv", ".json", ".xlsx"] as const;
const ACCEPTED_MIME = [
  "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");

const FileIcon = ({ name }: { name: string }) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return <FileText className="h-5 w-5 text-green-400" />;
  if (ext === "json") return <FileJson className="h-5 w-5 text-yellow-400" />;
  return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
};

type Step = "select" | "uploading" | "result";

export const DcaImportModal = ({ onClose, onSuccess }: DcaImportModalProps) => {
  const lineUserId = useAuthSession()?.user?.lineUserId;
  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── File handling ────────────────────────────────────────────────────────

  const acceptFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
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

  // ─── Upload ───────────────────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      id="dca-import-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card
        id="dca-import-modal"
        className="border-border w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-label="นำเข้าประวัติคำสั่งซื้อ Auto DCA"
      >
        {/* Header */}
        <div
          id="dca-import-modal-header"
          className="border-border flex items-center justify-between border-b px-5 py-4"
        >
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-yellow-400" />
            <h2 className="text-base font-semibold">นำเข้าประวัติ Auto DCA</h2>
          </div>
          <Button
            id="dca-import-modal-close"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="ปิด"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CardContent id="dca-import-modal-body" className="p-5">
          {step === "select" && (
            <div id="dca-import-step-select" className="space-y-4">
              {/* Dropzone */}
              <div
                id="dca-import-dropzone"
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${
                  dragOver
                    ? "border-yellow-400 bg-yellow-400/10"
                    : "border-border hover:bg-muted/30 hover:border-yellow-400/50"
                }`}
              >
                <Upload
                  className={`mb-3 h-8 w-8 ${dragOver ? "text-yellow-400" : "text-muted-foreground"}`}
                />
                <p className="text-sm font-medium">
                  วาง หรือคลิกเพื่อเลือกไฟล์
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  รองรับ .csv, .json, .xlsx
                </p>
                <input
                  ref={inputRef}
                  id="dca-import-file-input"
                  type="file"
                  accept={ACCEPTED_MIME}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Selected file */}
              {file && (
                <div
                  id="dca-import-selected-file"
                  className="bg-muted/40 flex items-center gap-3 rounded-lg px-4 py-3"
                >
                  <FileIcon name={file.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    id="dca-import-remove-file"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 shrink-0 p-0"
                    onClick={() => setFile(null)}
                    aria-label="ลบไฟล์ที่เลือก"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

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
              <div
                id="dca-import-format-hint"
                className="bg-muted/30 text-muted-foreground space-y-1 rounded-lg px-4 py-3 text-xs"
              >
                <p className="text-foreground font-medium">คอลัมน์ที่จำเป็น:</p>
                <p>
                  <span className="font-mono text-yellow-400">executedAt</span>,{" "}
                  <span className="font-mono text-yellow-400">coin</span>,{" "}
                  <span className="font-mono text-yellow-400">amountTHB</span>,{" "}
                  <span className="font-mono text-yellow-400">
                    coinReceived
                  </span>
                  ,{" "}
                  <span className="font-mono text-yellow-400">
                    pricePerCoin
                  </span>
                </p>
                <p>
                  คอลัมน์เสริม: <span className="font-mono">status</span>,{" "}
                  <span className="font-mono">note</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={onClose}>
                  ยกเลิก
                </Button>
                <Button
                  id="dca-import-submit-button"
                  size="sm"
                  disabled={!file}
                  onClick={() => void handleUpload()}
                  className="gap-2 bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  นำเข้า
                </Button>
              </div>
            </div>
          )}

          {step === "uploading" && (
            <div
              id="dca-import-step-uploading"
              className="flex flex-col items-center justify-center gap-4 py-12"
            >
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
              <p className="text-muted-foreground text-sm">
                กำลังนำเข้าข้อมูล…
              </p>
            </div>
          )}

          {step === "result" && result && (
            <div id="dca-import-step-result" className="space-y-4">
              {/* Summary */}
              <div
                id="dca-import-result-summary"
                className={`flex items-start gap-3 rounded-lg px-4 py-4 ${
                  result.imported > 0 ? "bg-green-500/10" : "bg-muted/40"
                }`}
              >
                {result.imported > 0 ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                ) : (
                  <AlertCircle className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
                )}
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    นำเข้าสำเร็จ{" "}
                    <span className="text-green-400">{result.imported}</span>{" "}
                    รายการ
                    {result.skipped > 0 && (
                      <>
                        {" "}
                        · ข้าม{" "}
                        <span className="text-red-400">
                          {result.skipped}
                        </span>{" "}
                        รายการ
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Error list */}
              {result.errors.length > 0 && (
                <div id="dca-import-result-errors" className="space-y-2">
                  <p className="text-xs font-medium text-red-400">
                    รายการที่ข้าม ({result.errors.length}):
                  </p>
                  <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-red-500/10 px-4 py-3">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-300">
                        • {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  id="dca-import-done-button"
                  size="sm"
                  onClick={onClose}
                  className="bg-yellow-500 text-black hover:bg-yellow-400"
                >
                  เสร็จสิ้น
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

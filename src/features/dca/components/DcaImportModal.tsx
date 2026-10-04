import { Card, CardContent } from "@/components/ui/card";
import { DcaImportModalHeader } from "@/features/dca/components/DcaImportModalHeader";
import { DcaImportResultStep } from "@/features/dca/components/DcaImportResultStep";
import { DcaImportSelectStep } from "@/features/dca/components/DcaImportSelectStep";
import { DcaImportUploadingStep } from "@/features/dca/components/DcaImportUploadingStep";
import { useDcaImport } from "@/features/dca/hooks/useDcaImport";

interface DcaImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const DcaImportModal = ({ onClose, onSuccess }: DcaImportModalProps) => {
  const modal = useDcaImport({ onSuccess });

  return (
    <div
      id="dca-import-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-inset"
        aria-label="ปิดหน้าต่างนำเข้าประวัติคำสั่งซื้อ Auto DCA"
        onClick={onClose}
      />
      <Card
        id="dca-import-modal"
        className="border-border relative z-10 w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-label="นำเข้าประวัติคำสั่งซื้อ Auto DCA"
      >
        {/* Header */}
        <DcaImportModalHeader onClose={onClose} />

        <CardContent id="dca-import-modal-body" className="p-5">
          {modal.step === "select" && (
            <DcaImportSelectStep
              dragOver={modal.dragOver}
              file={modal.file}
              error={modal.error}
              inputRef={modal.inputRef}
              onDrop={modal.handleDrop}
              onDragOver={modal.handleDragOver}
              onDragLeave={modal.handleDragLeave}
              onFileChange={modal.handleFileChange}
              onRemoveFile={modal.handleRemoveFile}
              onUpload={() => void modal.handleUpload()}
              onClose={onClose}
            />
          )}

          {modal.step === "uploading" && <DcaImportUploadingStep />}

          {modal.step === "result" && modal.result && (
            <DcaImportResultStep result={modal.result} onClose={onClose} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

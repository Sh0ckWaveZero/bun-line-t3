import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DcaImportModalHeaderProps {
  onClose: () => void;
}

/** ส่วนหัวของ modal นำเข้าพร้อมปุ่มปิด */
export const DcaImportModalHeader = ({
  onClose,
}: DcaImportModalHeaderProps) => (
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
);

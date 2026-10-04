import { FileJson, FileSpreadsheet, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFileExtension } from "@/features/dca/helpers/dca-import";

const FileIcon = ({ name }: { name: string }) => {
  const ext = getFileExtension(name);
  if (ext === "csv") return <FileText className="h-5 w-5 text-green-400" />;
  if (ext === "json") return <FileJson className="h-5 w-5 text-yellow-400" />;
  return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
};

interface DcaImportSelectedFileProps {
  file: File;
  onRemove: () => void;
}

/** แถวแสดงไฟล์ที่เลือกพร้อมปุ่มลบ */
export const DcaImportSelectedFile = ({
  file,
  onRemove,
}: DcaImportSelectedFileProps) => (
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
      onClick={onRemove}
      aria-label="ลบไฟล์ที่เลือก"
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  </div>
);

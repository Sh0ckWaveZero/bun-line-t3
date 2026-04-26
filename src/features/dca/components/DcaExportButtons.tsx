import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExportFormat } from "@/features/dca/types";
import { useAuthSession } from "@/lib/auth/session-context";

interface ExportOption {
  format: ExportFormat;
  label: string;
  icon: React.ReactNode;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { format: "csv", label: "CSV", icon: <FileText className="h-3.5 w-3.5" /> },
  { format: "json", label: "JSON", icon: <FileJson className="h-3.5 w-3.5" /> },
  {
    format: "xlsx",
    label: "Excel",
    icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
  },
];

interface DcaExportButtonsProps {
  disabled?: boolean;
}

export const DcaExportButtons = ({ disabled }: DcaExportButtonsProps) => {
  const lineUserId = useAuthSession()?.user?.lineUserId;
  const [loading, setLoading] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (loading) return;
    if (!lineUserId) {
      alert("ไม่พบ LINE user ID");
      return;
    }

    setLoading(format);
    try {
      const params = new URLSearchParams({ format, lineUserId });
      const res = await fetch(`/api/dca/export?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "ไม่สามารถส่งออกได้",
        );
      }

      const blob = await res.blob();

      // ดึง filename จาก Content-Disposition header
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="?([^";\s]+)"?/);
      const filename = match?.[1] ?? `dca-history.${format}`;

      // trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      id="dca-export-buttons"
      className="flex items-center gap-1"
      role="group"
      aria-label="ส่งออกข้อมูล"
    >
      <span
        id="dca-export-label"
        className="text-muted-foreground mr-1 flex items-center gap-1 text-xs"
      >
        <Download className="h-3.5 w-3.5" />
        ส่งออก
      </span>
      {EXPORT_OPTIONS.map(({ format, label, icon }) => (
        <Button
          key={format}
          id={`dca-export-${format}-button`}
          variant="outline"
          size="sm"
          onClick={() => void handleExport(format)}
          disabled={disabled || !lineUserId || loading !== null}
          className="h-8 gap-1.5 px-2.5 text-xs"
          aria-label={`ส่งออกเป็น ${label}`}
        >
          {loading === format ? (
            <span
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          ) : (
            icon
          )}
          {label}
        </Button>
      ))}
    </div>
  );
};

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImportResult } from "@/features/dca/types";

interface DcaImportResultStepProps {
  result: ImportResult;
  onClose: () => void;
}

/** ขั้นตอนแสดงผลลัพธ์หลังนำเข้าเสร็จ */
export const DcaImportResultStep = ({
  result,
  onClose,
}: DcaImportResultStepProps) => (
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
          นำเข้าสำเร็จ <span className="text-green-400">{result.imported}</span>{" "}
          รายการ
          {result.skipped > 0 && (
            <>
              {" "}
              · ข้าม <span className="text-red-400">{result.skipped}</span>{" "}
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
          {result.errors.map((error) => (
            <li key={error} className="text-xs text-red-300">
              • {error}
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
);

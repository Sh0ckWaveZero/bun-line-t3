import { Button } from "@/components/ui/button";
import type { TransactionType } from "@/features/expenses/types";
import { Loader2 } from "lucide-react";

interface TransactionFormActionsProps {
  type: TransactionType;
  isLoading: boolean;
  isEditMode: boolean;
  saveDisabled: boolean;
  onCancel: () => void;
}

/** ปุ่มยกเลิก/บันทึกของฟอร์มรายการ */
export function TransactionFormActions({
  type,
  isLoading,
  isEditMode,
  saveDisabled,
  onCancel,
}: TransactionFormActionsProps) {
  return (
    <div id="transaction-buttons-group" className="grid grid-cols-2 gap-3 pt-1">
      <Button
        id="transaction-cancel-btn"
        type="button"
        variant="outline"
        className="border-border bg-background h-12 rounded-lg text-base font-semibold"
        onClick={() => onCancel()}
      >
        ยกเลิก
      </Button>
      <Button
        id="transaction-save-btn"
        type="submit"
        className={`h-12 rounded-lg text-base font-semibold text-white ${
          type === "EXPENSE"
            ? "bg-red-500 hover:bg-red-600"
            : "bg-emerald-500 hover:bg-emerald-600"
        }`}
        disabled={saveDisabled}
      >
        {isLoading ? (
          <>
            <Loader2
              id="transaction-save-loader"
              size={16}
              className="animate-spin"
            />{" "}
            <span id="transaction-save-loading-text">กำลังบันทึก</span>
          </>
        ) : isEditMode ? (
          "บันทึกการแก้ไข"
        ) : (
          "บันทึก"
        )}
      </Button>
    </div>
  );
}

import {
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AddTransactionModalHeaderProps {
  isEditMode: boolean;
  onClose: () => void;
}

/** ส่วนหัวของ modal เพิ่ม/แก้ไขรายการ (title + ปุ่มปิด) */
export function AddTransactionModalHeader({
  isEditMode,
  onClose,
}: AddTransactionModalHeaderProps) {
  return (
    <div
      id="add-transaction-modal-header"
      className="border-border/50 relative flex shrink-0 items-center justify-center border-b px-6 py-4"
    >
      <AlertDialogTitle className="text-foreground text-center text-lg font-bold">
        {isEditMode ? "แก้ไขรายการ" : "เพิ่มรายการ"}
      </AlertDialogTitle>
      <AlertDialogDescription className="sr-only">
        {isEditMode
          ? "แก้ไขรายละเอียดรายรับหรือรายจ่าย"
          : "เพิ่มรายการรายรับหรือรายจ่ายใหม่"}
      </AlertDialogDescription>
      <Button
        id="add-transaction-close-btn"
        variant="ghost"
        size="icon"
        onClick={() => onClose()}
        aria-label="ปิดหน้าต่างรายการ"
        className="text-muted-foreground hover:bg-muted absolute top-1/2 right-4 h-8 w-8 -translate-y-1/2 rounded-full"
      >
        <X id="add-transaction-close-icon" size={18} />
      </Button>
    </div>
  );
}

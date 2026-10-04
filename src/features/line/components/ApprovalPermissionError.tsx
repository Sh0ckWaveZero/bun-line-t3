/**
 * ApprovalPermissionError
 * หน้าแจ้งเตือนเมื่อไม่มีสิทธิ์เข้าถึง (403)
 */
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApprovalPermissionErrorProps {
  message: string;
  onBack: () => void;
}

export function ApprovalPermissionError({
  message,
  onBack,
}: ApprovalPermissionErrorProps) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="border-border bg-card max-w-md rounded-xl border p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-foreground mb-2 text-xl font-bold">
          ไม่มีสิทธิ์เข้าถึง
        </h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button onClick={onBack} variant="outline">
          กลับหน้าหลัก
        </Button>
      </div>
    </div>
  );
}

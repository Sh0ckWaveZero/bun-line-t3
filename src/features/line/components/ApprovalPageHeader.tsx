/**
 * ApprovalPageHeader
 * ส่วนหัวหน้า LINE Approval (ชื่อหน้า + ปุ่มรีเฟรช)
 */
import { MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApprovalPageHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function ApprovalPageHeader({
  isLoading,
  onRefresh,
}: ApprovalPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-green-100 p-3 dark:bg-green-900/30">
          <MessageSquare className="h-6 w-6 text-green-700 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">
            LINE Approval
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            จัดการคำขอใช้งาน LINE Messaging API
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="border-border bg-card text-foreground hover:bg-muted/50 gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        รีเฟรช
      </Button>
    </div>
  );
}

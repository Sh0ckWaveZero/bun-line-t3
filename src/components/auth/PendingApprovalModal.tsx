/**
 * PendingApprovalModal Component
 * Modal ที่ block การใช้งานเมื่อ LINE user ยังไม่ได้รับอนุมัติ
 *
 * Usage:
 * ```tsx
 * import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
 *
 * function Dashboard() {
 *   const { needsApproval } = useLineApproval();
 *
 *   return (
 *     <>
 *       <PendingApprovalModal open={needsApproval} />
 *       <DashboardContent />
 *     </>
 *   );
 * }
 * ```
 */
import { Clock, MessageSquare, ShieldCheck, X } from "lucide-react";

interface PendingApprovalModalProps {
  open: boolean;
  onClose?: () => void;
}

export function PendingApprovalModal({ open, onClose }: PendingApprovalModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative bg-card max-w-md w-full rounded-xl border shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30">
          <Clock className="h-10 w-10 animate-pulse" />
        </div>

        {/* Heading */}
        <h2 className="text-foreground mb-3 text-2xl font-bold">
          รอการอนุมัติ
        </h2>

        {/* Message */}
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          บัญชี LINE ของคุณยังไม่ได้รับการอนุมัติให้ใช้งาน
          <br />
          กรุณารอสัญญาณ admin เพื่อขออนุมัติใช้งาน
        </p>

        {/* Info */}
        <div className="border-border bg-muted/50 mb-8 rounded-lg border p-4 text-left">
          <div className="mb-3 flex items-start gap-3">
            <MessageSquare className="text-primary h-5 w-5 shrink-0" />
            <div>
              <p className="text-foreground font-medium text-sm">
                อะไรบ้างที่ต้องการอนุมัติ?
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                LINE Messaging API: ส่งคำสั่งผ่าน LINE Bot
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-primary h-5 w-5 shrink-0" />
            <div>
              <p className="text-foreground font-medium text-sm">
                ผู้อนุมัติบางคน?
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Admin จะตรวจสอบและอนุมัติคำของของคุณ
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <a
            href="/"
            className="bg-primary text-primary-foreground inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          >
            กลับหน้าหลัก
          </a>
          <a
            href="/logout"
            className="text-muted-foreground inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            ออกจากระบบ
          </a>
        </div>

        {/* Help text */}
        <p className="text-muted-foreground mt-6 text-xs">
          หากมีข้อสงสัย หรือต้องการติดต่อ admin โปรดติดต่อทีมงาน
        </p>
      </div>
    </div>
  );
}

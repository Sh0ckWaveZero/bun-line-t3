"use client";

/**
 * หน้า Pending Approval
 * แสดงเมื่อผู้ใช้ Login ด้วย LINE แต่ยังไม่ได้รับการอนุมัติ
 * ให้ทราบว่าต้องรอการอนุมัติจาก admin
 */
import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/lib/auth/client";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Clock, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function PendingApprovalPage() {
  const { data: session, status } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "unauthenticated") {
      void navigate({ to: "/" });
    }
  }, [status, navigate]);

  if (status === "loading") {
    return (
      <div id="pending-approval-loading" className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main id="pending-approval-page" className="bg-background flex min-h-screen items-center justify-center p-4">
      <div id="pending-approval-card" className="border-border bg-card max-w-md w-full rounded-xl border p-8 text-center shadow-lg">
        {/* Icon */}
        <div id="pending-approval-icon" className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30" aria-hidden="true">
          <Clock className="h-10 w-10" />
        </div>

        {/* Heading */}
        <h1 id="pending-approval-title" className="text-foreground mb-3 text-2xl font-bold">
          รอการอนุมัติ
        </h1>

        {/* Message */}
        <p id="pending-approval-description" className="text-muted-foreground mb-6 text-sm leading-relaxed">
          บัญชี LINE ของคุณยังไม่ได้รับการอนุมัติให้ใช้งาน
          <br />
          กรุณารอสัญญา่ admin เพื่อขออนุมัติใช้งาน
        </p>

        {/* Info */}
        <div id="pending-approval-info" className="border-border bg-muted/50 mb-8 rounded-lg border p-4 text-left" role="region" aria-label="ข้อมูลเพิ่มเติม">
          <div className="mb-3 flex items-start gap-3">
            <MessageSquare className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />
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
            <ShieldCheck className="text-primary h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-foreground font-medium text-sm">
                ผู้อนุมัติบางคน?
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Admin จะตรวจสอบและอนุมัติคำขอของคุณ
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div id="pending-approval-actions" className="flex flex-col gap-3">
          <Button
            id="pending-approval-home-button"
            onClick={() => void navigate({ to: "/dashboard" })}
            variant="outline"
            className="w-full"
          >
            กลับหน้าหลัก
          </Button>
          <Button
            id="pending-approval-logout-button"
            onClick={() => void navigate({ to: "/logout" })}
            variant="ghost"
            className="w-full"
          >
            ออกจากระบบ
          </Button>
        </div>

        {/* Help text */}
        <p id="pending-approval-help" className="text-muted-foreground mt-6 text-xs">
          หากมีข้อสงสัย หรือต้องการติดต่อ admin โปรดติดต่อทีมงาน
        </p>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/pending-approval")({
  component: PendingApprovalPage,
});

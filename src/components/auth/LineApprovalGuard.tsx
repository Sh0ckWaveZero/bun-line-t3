"use client";

/**
 * LineApprovalGuard Component
 * ป้องกันไม่ให้ผู้ใช้ที่ยังไม่ได้อนุมัติเข้าถึง content
 *
 * Usage:
 * ```tsx
 * <LineApprovalGuard>
 *   <YourPageContent />
 * </LineApprovalGuard>
 * ```
 *
 * หรือใช้แบบ inline:
 * ```tsx
 * <LineApprovalGuard>
 *   {children}
 * </LineApprovalGuard>
 * ```
 */
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLineApproval } from "@/hooks/useLineApproval";

export function LineApprovalGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { isLoading, needsApproval } = useLineApproval();

  useEffect(() => {
    // Redirect ถ้ายังไม่ได้อนุมัติ
    if (!isLoading && needsApproval) {
      void navigate({ to: "/pending-approval", replace: true });
    }
  }, [isLoading, needsApproval, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-lg">กำลังตรวจสอบ...</p>
      </div>
    );
  }

  // แสดง content ถ้าผ่าน
  return <>{children}</>;
}

/**
 * HOC pattern สำหรับใช้กับ existing components
 * Usage:
 * ```tsx
 * const ProtectedPage = withLineApproval(() => <DashboardPage />);
 * ```
 */
export function withLineApproval<P extends object>(
  Component: React.ComponentType<P>,
) {
  return function WithLineApproval(props: P) {
    return (
      <LineApprovalGuard>
        <Component {...props} />
      </LineApprovalGuard>
    );
  };
}

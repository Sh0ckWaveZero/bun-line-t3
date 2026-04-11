/**
 * useLineApproval
 * React hook สำหรับตรวจสอบและจัดการ LINE approval status
 *
 * Usage:
 * ```tsx
 * const { hasLineApproval, isLoading, needsApproval, refetch } = useLineApproval();
 *
 * if (isLoading) return <Loading />;
 * if (needsApproval) return <PendingApprovalPage />;
 * ```
 */
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";

interface LineApprovalState {
  hasLineApproval: boolean;
  isLoading: boolean;
  needsApproval: boolean;
  hasLineAccount: boolean;
  error?: string;
}

export const useLineApproval = () => {
  const { data: session, status } = useSession();
  const [state, setState] = useState<LineApprovalState>({
    hasLineApproval: true, // Default: allow access
    isLoading: true,
    needsApproval: false,
    hasLineAccount: false,
  });

  const checkApproval = useCallback(async () => {
    let isMounted = true;

    if (status !== "authenticated") {
      if (isMounted) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          hasLineApproval: true,
          needsApproval: false,
        }));
      }
      return;
    }

    try {
      const res = await fetch("/api/auth/check-line-approval");
      const data = await res.json();

      if (isMounted) {
        setState({
          hasLineApproval: data.approved ?? false,
          isLoading: false,
          needsApproval: !(data.approved ?? false),
          hasLineAccount: data.hasLineAccount ?? false,
        });
      }
    } catch (error) {
      console.error("[useLineApproval] Failed to check:", error);
      if (isMounted) {
        setState({
          hasLineApproval: true, // Fallback: allow on error
          isLoading: false,
          needsApproval: false,
          hasLineAccount: false,
          error: "Failed to check approval status",
        });
      }
    }
  }, [status]);

  useEffect(() => {
    let isMounted = true;

    checkApproval();

    return () => {
      isMounted = false;
    };
  }, [checkApproval]);

  return { ...state, refetch: checkApproval };
};

/**
 * useLineApprovalToast
 * Hook จัดการ toast แจ้งเตือนบนหน้า LINE Approval (auto-hide 4 วินาที)
 */
import { useCallback, useState } from "react";

import type { ApprovalToastState } from "@/features/line/helpers/approvalDisplay.helpers";

export function useLineApprovalToast() {
  const [toast, setToast] = useState<ApprovalToastState | null>(null);

  const showToast = useCallback(
    (type: ApprovalToastState["type"], msg: string) => {
      setToast({ type, msg });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  return { toast, showToast };
}

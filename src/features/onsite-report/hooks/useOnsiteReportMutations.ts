import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/common/ToastProvider";
import { ONSITE_REPORTS_QUERY_KEY } from "./useOnsiteReports";
import type { OnsiteReport, OnsiteReportPayload } from "../types";

const parseErrorResponse = async (
  response: Response,
  fallback: string,
): Promise<Error> => {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return new Error(data?.error ?? fallback);
};

export const useOnsiteReportMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const invalidateReports = () => {
    void queryClient.invalidateQueries({ queryKey: ONSITE_REPORTS_QUERY_KEY });
  };

  const { mutateAsync: createReport, isPending: isCreating } = useMutation({
    mutationFn: async (payload: OnsiteReportPayload): Promise<OnsiteReport> => {
      const response = await fetch("/api/onsite-reports/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw await parseErrorResponse(response, "ไม่สามารถบันทึกรายงานได้");
      }
      const result = (await response.json()) as { data: OnsiteReport };
      return result.data;
    },
    onSuccess: () => {
      invalidateReports();
      showToast({ title: "บันทึกรายงานสำเร็จ", type: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "บันทึกรายงานไม่สำเร็จ",
        description: error.message,
        type: "error",
      });
    },
  });

  const { mutateAsync: updateReport, isPending: isUpdating } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: OnsiteReportPayload;
    }): Promise<OnsiteReport> => {
      const response = await fetch(
        `/api/onsite-reports/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        throw await parseErrorResponse(response, "ไม่สามารถแก้ไขรายงานได้");
      }
      const result = (await response.json()) as { data: OnsiteReport };
      return result.data;
    },
    onSuccess: () => {
      invalidateReports();
      showToast({ title: "แก้ไขรายงานสำเร็จ", type: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "แก้ไขรายงานไม่สำเร็จ",
        description: error.message,
        type: "error",
      });
    },
  });

  const { mutateAsync: deleteReport, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(
        `/api/onsite-reports/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw await parseErrorResponse(response, "ไม่สามารถลบรายงานได้");
      }
    },
    onSuccess: () => {
      invalidateReports();
      showToast({ title: "ลบรายงานสำเร็จ", type: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "ลบรายงานไม่สำเร็จ",
        description: error.message,
        type: "error",
      });
    },
  });

  return {
    createReport,
    updateReport,
    deleteReport,
    isCreating,
    isUpdating,
    isDeleting,
  };
};

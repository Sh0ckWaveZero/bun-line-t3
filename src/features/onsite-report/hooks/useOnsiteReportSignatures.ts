import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/common/ToastProvider";
import { ONSITE_REPORTS_QUERY_KEY } from "./useOnsiteReports";
import type {
  OnsiteReportSignatureMeta,
  OnsiteReportSignatureParty,
} from "../types";

const parseErrorResponse = async (
  response: Response,
  fallback: string,
): Promise<Error> => {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return new Error(data?.error ?? fallback);
};

const signatureEndpoint = (
  reportId: string,
  party: OnsiteReportSignatureParty,
): string =>
  `/api/onsite-reports/${encodeURIComponent(reportId)}/signatures/${party}`;

/** URL รูปลายเซ็น — ?v=updatedAt ทำให้เบราว์เซอร์โหลดใหม่เมื่อเซ็นใหม่ */
export const onsiteReportSignatureUrl = (
  reportId: string,
  signature: OnsiteReportSignatureMeta,
): string =>
  `${signatureEndpoint(reportId, signature.party)}?v=${encodeURIComponent(signature.updatedAt)}`;

/** เซ็น/ลบลายเซ็นของรายงาน (เจ้าของรายงานเท่านั้น — ฝั่ง API ตรวจสิทธิ์ซ้ำ) */
export const useOnsiteReportSignatureMutations = (reportId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // ["onsite-reports"] ครอบทั้งรายการและรายงานเดี่ยว (["onsite-reports", id])
  const invalidateReports = () => {
    void queryClient.invalidateQueries({ queryKey: ONSITE_REPORTS_QUERY_KEY });
  };

  const { mutateAsync: saveSignature, isPending: isSaving } = useMutation({
    mutationFn: async ({
      party,
      file,
    }: {
      party: OnsiteReportSignatureParty;
      file: Blob;
    }): Promise<OnsiteReportSignatureMeta> => {
      const formData = new FormData();
      formData.append("file", file, "signature.png");
      const response = await fetch(signatureEndpoint(reportId, party), {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        throw await parseErrorResponse(response, "ไม่สามารถบันทึกลายเซ็นได้");
      }
      return ((await response.json()) as { data: OnsiteReportSignatureMeta })
        .data;
    },
    onSuccess: () => {
      invalidateReports();
      showToast({ title: "บันทึกลายเซ็นสำเร็จ", type: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "บันทึกลายเซ็นไม่สำเร็จ",
        description: error.message,
        type: "error",
      });
    },
  });

  const { mutateAsync: removeSignature, isPending: isRemoving } = useMutation({
    mutationFn: async (party: OnsiteReportSignatureParty): Promise<void> => {
      const response = await fetch(signatureEndpoint(reportId, party), {
        method: "DELETE",
      });
      if (!response.ok) {
        throw await parseErrorResponse(response, "ไม่สามารถลบลายเซ็นได้");
      }
    },
    onSuccess: () => {
      invalidateReports();
      showToast({ title: "ลบลายเซ็นสำเร็จ", type: "success" });
    },
    onError: (error: Error) => {
      showToast({
        title: "ลบลายเซ็นไม่สำเร็จ",
        description: error.message,
        type: "error",
      });
    },
  });

  return {
    saveSignature,
    removeSignature,
    isBusy: isSaving || isRemoving,
  };
};

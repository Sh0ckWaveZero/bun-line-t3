import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/common/ToastProvider";
import type {
  CreateCompanyInput,
  UpdateCompanyInput,
} from "../lib/company";
import type { OnsiteReportCompany } from "../types";

export const ONSITE_REPORT_COMPANIES_QUERY_KEY = [
  "onsite-report-companies",
] as const;

const parseErrorResponse = async (
  response: Response,
  fallback: string,
): Promise<Error> => {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return new Error(data?.error ?? fallback);
};

const fetchCompanies = async (
  includeInactive: boolean,
): Promise<OnsiteReportCompany[]> => {
  const query = includeInactive ? "?includeInactive=true" : "";
  const response = await fetch(`/api/onsite-reports/companies${query}`);
  if (!response.ok) {
    throw await parseErrorResponse(response, "ไม่สามารถโหลดรายการบริษัทได้");
  }
  const payload = (await response.json()) as { data: OnsiteReportCompany[] };
  return payload.data;
};

/**
 * รายการบริษัท — ค่าเริ่มต้นเฉพาะที่เปิดใช้งาน (สำหรับ dropdown)
 * includeInactive ใช้ได้เฉพาะ admin (หน้าจัดการบริษัท)
 */
export const useOnsiteReportCompanies = (
  options: { includeInactive?: boolean } = {},
) => {
  const includeInactive = options.includeInactive ?? false;
  return useQuery({
    queryKey: [...ONSITE_REPORT_COMPANIES_QUERY_KEY, { includeInactive }],
    queryFn: () => fetchCompanies(includeInactive),
  });
};

/** URL รูปโลโก้ — ?v=logoUpdatedAt ทำให้เบราว์เซอร์โหลดใหม่เฉพาะตอนเปลี่ยนโลโก้ */
export const onsiteReportCompanyLogoUrl = (
  company: OnsiteReportCompany,
): string =>
  `/api/onsite-reports/companies/${encodeURIComponent(company.code)}/logo?v=${encodeURIComponent(company.logoUpdatedAt ?? "")}`;

/** code → ชื่อบริษัท (ไม่พบ = แสดง code เอง เช่น บริษัทที่ถูกลบ/ปิดใช้งานและไม่ได้โหลดมา) */
export const findCompanyName = (
  companies: OnsiteReportCompany[] | undefined,
  code: string,
): string => companies?.find((company) => company.code === code)?.name ?? code;

/** CRUD บริษัท + โลโก้ (admin เท่านั้น — ฝั่ง API ตรวจสิทธิ์ซ้ำ) */
export const useOnsiteReportCompanyMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const invalidateCompanies = () => {
    void queryClient.invalidateQueries({
      queryKey: ONSITE_REPORT_COMPANIES_QUERY_KEY,
    });
  };

  const onError = (title: string) => (error: Error) => {
    showToast({ title, description: error.message, type: "error" });
  };

  const { mutateAsync: createCompany, isPending: isCreating } = useMutation({
    mutationFn: async (
      input: CreateCompanyInput,
    ): Promise<OnsiteReportCompany> => {
      const response = await fetch("/api/onsite-reports/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        throw await parseErrorResponse(response, "ไม่สามารถเพิ่มบริษัทได้");
      }
      return ((await response.json()) as { data: OnsiteReportCompany }).data;
    },
    onSuccess: () => {
      invalidateCompanies();
      showToast({ title: "เพิ่มบริษัทสำเร็จ", type: "success" });
    },
    onError: onError("เพิ่มบริษัทไม่สำเร็จ"),
  });

  const { mutateAsync: updateCompany, isPending: isUpdating } = useMutation({
    mutationFn: async ({
      code,
      input,
    }: {
      code: string;
      input: UpdateCompanyInput;
    }): Promise<OnsiteReportCompany> => {
      const response = await fetch(
        `/api/onsite-reports/companies/${encodeURIComponent(code)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      if (!response.ok) {
        throw await parseErrorResponse(response, "ไม่สามารถแก้ไขบริษัทได้");
      }
      return ((await response.json()) as { data: OnsiteReportCompany }).data;
    },
    onSuccess: () => {
      invalidateCompanies();
      showToast({ title: "บันทึกสำเร็จ", type: "success" });
    },
    onError: onError("แก้ไขบริษัทไม่สำเร็จ"),
  });

  const { mutateAsync: deleteCompany, isPending: isDeleting } = useMutation({
    mutationFn: async (code: string): Promise<void> => {
      const response = await fetch(
        `/api/onsite-reports/companies/${encodeURIComponent(code)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw await parseErrorResponse(response, "ไม่สามารถลบบริษัทได้");
      }
    },
    onSuccess: () => {
      invalidateCompanies();
      showToast({ title: "ลบบริษัทสำเร็จ", type: "success" });
    },
    onError: onError("ลบบริษัทไม่สำเร็จ"),
  });

  const { mutateAsync: uploadLogo, isPending: isUploading } = useMutation({
    mutationFn: async ({
      code,
      file,
    }: {
      code: string;
      file: File;
    }): Promise<OnsiteReportCompany> => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `/api/onsite-reports/companies/${encodeURIComponent(code)}/logo`,
        { method: "PUT", body: formData },
      );
      if (!response.ok) {
        throw await parseErrorResponse(response, "ไม่สามารถอัปโหลดโลโก้ได้");
      }
      return ((await response.json()) as { data: OnsiteReportCompany }).data;
    },
    onSuccess: () => {
      invalidateCompanies();
      showToast({ title: "อัปโหลดโลโก้สำเร็จ", type: "success" });
    },
    onError: onError("อัปโหลดโลโก้ไม่สำเร็จ"),
  });

  const { mutateAsync: deleteLogo, isPending: isDeletingLogo } = useMutation({
    mutationFn: async (code: string): Promise<void> => {
      const response = await fetch(
        `/api/onsite-reports/companies/${encodeURIComponent(code)}/logo`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw await parseErrorResponse(response, "ไม่สามารถลบโลโก้ได้");
      }
    },
    onSuccess: () => {
      invalidateCompanies();
      showToast({ title: "ลบโลโก้สำเร็จ", type: "success" });
    },
    onError: onError("ลบโลโก้ไม่สำเร็จ"),
  });

  return {
    createCompany,
    updateCompany,
    deleteCompany,
    uploadLogo,
    deleteLogo,
    isBusy:
      isCreating || isUpdating || isDeleting || isUploading || isDeletingLogo,
    isCreating,
  };
};

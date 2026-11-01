"use client";

import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { OnsiteReportCompanyCard } from "../components/OnsiteReportCompanyCard";
import { OnsiteReportCompanyCreateForm } from "../components/OnsiteReportCompanyCreateForm";
import {
  useOnsiteReportCompanies,
  useOnsiteReportCompanyMutations,
} from "../hooks/useOnsiteReportCompanies";

/** หน้า admin: จัดการบริษัทผู้ออกเอกสาร (ชื่อ + โลโก้) ของ Onsite Service Report */
export const OnsiteReportCompaniesPage = () => {
  const {
    data: companies,
    isLoading,
    isError,
    error,
  } = useOnsiteReportCompanies({ includeInactive: true });
  const {
    createCompany,
    updateCompany,
    deleteCompany,
    uploadLogo,
    deleteLogo,
    isBusy,
  } = useOnsiteReportCompanyMutations();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link
        to="/onsite-report"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        กลับไปรายการรายงาน
      </Link>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
        บริษัทผู้ออกเอกสาร
      </h1>
      <p className="mt-1 mb-6 text-sm text-slate-500 dark:text-slate-400">
        ชื่อและโลโก้ที่แสดงบนหัว PDF Onsite Service Report เก็บในฐานข้อมูล ไม่อยู่ใน git
        บริษัทที่ปิดใช้งานจะไม่โผล่ในฟอร์มสร้างรายงาน แต่รายงานเก่ายัง export ได้
      </p>

      <div className="space-y-4">
        <OnsiteReportCompanyCreateForm
          isBusy={isBusy}
          onCreate={createCompany}
        />

        {isError ? (
          <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {error instanceof Error
              ? error.message
              : "ไม่สามารถโหลดรายการบริษัทได้"}
          </p>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
            {[0, 1].map((index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/[0.08]"
              />
            ))}
          </div>
        ) : companies && companies.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {companies.map((company) => (
              <OnsiteReportCompanyCard
                key={company.code}
                company={company}
                isBusy={isBusy}
                onUpdate={(input) =>
                  updateCompany({ code: company.code, input })
                }
                onDelete={() => deleteCompany(company.code)}
                onUploadLogo={(file) =>
                  uploadLogo({ code: company.code, file })
                }
                onDeleteLogo={() => deleteLogo(company.code)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/20 dark:text-slate-400">
            ยังไม่มีบริษัท — เพิ่มบริษัทแรกจากฟอร์มด้านบน
          </p>
        )}
      </div>
    </main>
  );
};

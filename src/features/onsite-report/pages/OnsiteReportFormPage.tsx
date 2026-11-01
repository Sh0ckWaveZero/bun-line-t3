"use client";

import { useParams } from "@tanstack/react-router";
import { useOnsiteReport, useOnsiteReports } from "../hooks/useOnsiteReports";
import { OnsiteReportForm } from "../components/OnsiteReportForm";

/**
 * หน้าฟอร์ม Onsite Service Report — ใช้ทั้งสร้างใหม่ (/onsite-report/new)
 * และแก้ไข (/onsite-report/$id/edit) โดยอ่าน id จาก params (ถ้ามี)
 */
export const OnsiteReportFormPage = () => {
  const params = useParams({ strict: false });
  const reportId = typeof params.id === "string" ? params.id : undefined;

  const {
    data: report,
    isLoading: isLoadingReport,
    isError: isReportError,
    error: reportError,
  } = useOnsiteReport(reportId);
  const { data: reports } = useOnsiteReports();
  const existingDocNos = (reports ?? []).map((item) => item.docNo);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          {reportId ? "แก้ไขรายงานเข้าบริการ" : "สร้างรายงานเข้าบริการ"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          กรอกข้อมูลแล้วบันทึก — ดาวน์โหลด PDF ได้หลังบันทึกหรือจากหน้ารายการ
        </p>
      </div>

      {reportId && isReportError ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {reportError instanceof Error
            ? reportError.message
            : "ไม่สามารถโหลดรายงานได้"}
        </p>
      ) : reportId && isLoadingReport ? (
        <div className="space-y-5" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={`form-skeleton-${index}`}
              className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.03]"
            />
          ))}
        </div>
      ) : (
        <OnsiteReportForm
          report={report ?? null}
          existingDocNos={existingDocNos}
        />
      )}
    </main>
  );
};

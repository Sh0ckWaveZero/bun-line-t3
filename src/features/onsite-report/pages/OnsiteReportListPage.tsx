"use client";

import { Link } from "@tanstack/react-router";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/lib/auth/session-context";
import { useOnsiteReports } from "../hooks/useOnsiteReports";
import { useOnsiteReportMutations } from "../hooks/useOnsiteReportMutations";
import { OnsiteReportTable } from "../components/OnsiteReportTable";
import { OnsiteReportAccessGate } from "../components/OnsiteReportAccessGate";

const OnsiteReportListContent = () => {
  const {
    data: reports,
    isLoading,
    isError,
    error,
  } = useOnsiteReports();
  const { deleteReport, isDeleting } = useOnsiteReportMutations();
  const session = useAuthSession();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Onsite Service Report
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            รายงานเข้าบริการหน้างาน (FM-PM-01) — กรอกและสร้างเป็น PDF ได้จากที่เดียว
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {session?.isAdmin ? (
            <Link to="/admin/onsite-report-companies">
              <Button variant="outline">
                <Building2 aria-hidden="true" />
                จัดการบริษัท/โลโก้
              </Button>
            </Link>
          ) : null}
          <Link to="/onsite-report/new">
            <Button>
              <Plus aria-hidden="true" />
              สร้างรายงานใหม่
            </Button>
          </Link>
        </div>
      </div>

      {isError ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error instanceof Error
            ? error.message
            : "ไม่สามารถโหลดรายการรายงานได้"}
        </p>
      ) : (
        <OnsiteReportTable
          reports={reports ?? []}
          isLoading={isLoading}
          isDeleting={isDeleting}
          onDelete={(report) => void deleteReport(report.id)}
        />
      )}
    </main>
  );
};

/** หน้ารายการ Onsite Service Report (FM-PM-01) — ต้องมีสิทธิ์ใช้งานก่อน */
export const OnsiteReportListPage = () => (
  <OnsiteReportAccessGate>
    <OnsiteReportListContent />
  </OnsiteReportAccessGate>
);

"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileDown,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTh } from "../lib/format";
import { downloadOnsiteReportPdf } from "../lib/download";
import type { OnsiteReport } from "../types";

const ROW_CLASS =
  "border-b border-slate-100 text-[13px] text-slate-700 transition-colors group-hover:bg-slate-50/80 dark:border-white/[0.06] dark:text-slate-200 dark:group-hover:bg-white/[0.04]";
const HEADER_CLASS =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

interface OnsiteReportTableProps {
  reports: OnsiteReport[];
  isLoading: boolean;
  isDeleting: boolean;
  onDelete: (report: OnsiteReport) => void;
}

/** ตารางรายการรายงาน + row actions แบบปุ่ม `…` เปิด actions dialog */
export const OnsiteReportTable = ({
  reports,
  isLoading,
  isDeleting,
  onDelete,
}: OnsiteReportTableProps) => {
  const [selected, setSelected] = useState<OnsiteReport | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const closeActions = () => {
    setSelected(null);
    setConfirmDelete(false);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.08]">
              <th className={HEADER_CLASS}>Doc No</th>
              <th className={HEADER_CLASS}>Client</th>
              <th className={HEADER_CLASS}>วันที่เข้าบริการ</th>
              <th className={HEADER_CLASS}>Project Code</th>
              <th className={HEADER_CLASS}>Phase</th>
              <th className="w-12 px-2 py-2.5" aria-label="การกระทำ" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }, (_, index) => (
                <tr key={`skeleton-${index}`} className={ROW_CLASS}>
                  <td className="px-3 py-4" colSpan={6}>
                    <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-white/[0.08]" />
                  </td>
                </tr>
              ))
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    ยังไม่มีรายงาน
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    กด &quot;สร้างรายงานใหม่&quot; เพื่อเริ่มกรอกรายงานแรก
                  </p>
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                  <tr
                    key={report.id}
                    className={cn("group", ROW_CLASS)}
                  >
                    <td className="px-3 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {report.docNo}
                        {report.revision}.0
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {report.companyName}
                      </p>
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-3.5">
                      {report.clientName}
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      {formatDateTh(report.onsiteDate)}
                    </td>
                    <td className="px-3 py-3.5">{report.projectCode}</td>
                    <td className="px-3 py-3.5">{report.phase ?? "-"}</td>
                    <td className="w-12 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDelete(false);
                          setSelected(report);
                        }}
                        aria-label={`จัดการ ${report.docNo}`}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 opacity-70 transition-colors group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:hover:bg-white/[0.08] dark:hover:text-slate-200"
                      >
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                )))
            }
          </tbody>
        </table>
      </div>

      {/* Actions dialog */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) closeActions();
        }}
      >
        {selected ? (
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {selected.docNo}
                {selected.revision}.0
              </DialogTitle>
              <DialogDescription>
                {selected.clientName} · {formatDateTh(selected.onsiteDate)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  downloadOnsiteReportPdf(selected.id);
                  closeActions();
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-left text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/15 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:text-emerald-300"
              >
                <FileDown className="size-4" aria-hidden="true" />
                ดาวน์โหลด PDF
              </button>
              <Link
                to="/onsite-report/$id/edit"
                params={{ id: selected.id }}
                onClick={closeActions}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-white/[0.1] dark:text-slate-200 dark:hover:bg-white/[0.06]"
              >
                <Pencil className="size-4" aria-hidden="true" />
                แก้ไขรายงาน
              </Link>

              <div className="border-t border-slate-200 pt-2 dark:border-white/[0.08]">
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/10 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none dark:text-rose-300"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    ลบรายงาน
                  </button>
                ) : (
                  <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3">
                    <p className="text-xs leading-5 text-rose-800 dark:text-rose-200">
                      ลบรายงาน {selected.docNo} ใช่หรือไม่? การลบย้อนกลับไม่ได้
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="h-8 cursor-pointer rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-white/60 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-white/[0.08]"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => {
                          onDelete(selected);
                          closeActions();
                        }}
                        className="h-8 cursor-pointer rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        ยืนยันการลบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
};

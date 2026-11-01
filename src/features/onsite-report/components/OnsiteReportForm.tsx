"use client";

import { useEffect, useMemo } from "react";
import type { FocusEvent } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SelectOption } from "@/components/ui/select";
import { OnsiteReportPreview } from "./OnsiteReportPreview";
import { OnsiteReportSignatureSection } from "./OnsiteReportSignatureSection";
import { OnsiteReportDocumentSection } from "./OnsiteReportDocumentSection";
import { OnsiteReportVisitSection } from "./OnsiteReportVisitSection";
import { OnsiteReportNextActionsSection } from "./OnsiteReportNextActionsSection";
import { OnsiteReportAttendeesSection } from "./OnsiteReportAttendeesSection";
import { Field, FormSection } from "./OnsiteReportFormParts";
import { inputClass } from "../lib/form-classes";
import {
  emptyFormValues,
  onsiteReportFormSchema,
  reportToFormValues,
} from "../lib/onsite-report-form";
import type {
  OnsiteReportFormInput,
  OnsiteReportFormOutput,
} from "../lib/onsite-report-form";
import { suggestDocNo } from "../lib/doc-no";
import { downloadOnsiteReportPdf } from "../lib/download";
import { useOnsiteReportMutations } from "../hooks/useOnsiteReportMutations";
import { useOnsiteReportCompanies } from "../hooks/useOnsiteReportCompanies";
import type { OnsiteReport } from "../types";

// ─────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────

interface OnsiteReportFormProps {
  report?: OnsiteReport | null;
  /** Doc No ที่มีอยู่แล้ว — ใช้เดาเลขถัดไปเมื่อกรอก Project Code */
  existingDocNos: string[];
}

export const OnsiteReportForm = ({
  report = null,
  existingDocNos,
}: OnsiteReportFormProps) => {
  const router = useRouter();
  const { createReport, updateReport, isCreating, isUpdating } =
    useOnsiteReportMutations();

  const form = useForm<
    OnsiteReportFormInput,
    undefined,
    OnsiteReportFormOutput
  >({
    resolver: zodResolver(onsiteReportFormSchema),
    defaultValues: report ? reportToFormValues(report) : emptyFormValues(),
  });

  const isSubmitting = isCreating || isUpdating;

  const { data: companies, isLoading: isCompaniesLoading } =
    useOnsiteReportCompanies();
  const companyOptions = useMemo<SelectOption[]>(() => {
    const options = (companies ?? []).map((company) => ({
      value: company.code,
      label: company.name,
    }));
    // รายงานเดิมที่ใช้บริษัทซึ่งปิดใช้งานแล้ว — ยังต้องเห็นค่าเดิมในฟอร์มแก้ไข
    if (report && !options.some((option) => option.value === report.company)) {
      options.push({
        value: report.company,
        label: `${report.companyName} (ปิดใช้งาน)`,
      });
    }
    return options;
  }, [companies, report]);

  // ฟอร์มสร้างใหม่: เลือกบริษัทแรกที่เปิดใช้งานให้อัตโนมัติเมื่อโหลดรายการเสร็จ
  const firstCompanyCode = companyOptions[0]?.value;
  useEffect(() => {
    if (report || !firstCompanyCode) return;
    if (!form.getValues("company")) {
      form.setValue("company", firstCompanyCode);
    }
  }, [report, firstCompanyCode, form]);

  /** ค่าฟอร์มปัจจุบันสำหรับ preview — useWatch subscribe แบบ memo-friendly (ห้ามใช้ watch() ตรง ๆ ใน render) */
  const watchedValues = useWatch({
    control: form.control,
  }) as OnsiteReportFormInput;

  /** เติม Doc No จาก Project Code — เฉพาะสร้างใหม่และผู้ใช้ยังไม่แก้ Doc No เอง */
  const handleProjectCodeBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (report || form.formState.dirtyFields.docNo) return;
    const suggested = suggestDocNo(
      event.currentTarget.value.trim(),
      existingDocNos,
    );
    if (suggested) form.setValue("docNo", suggested);
  };

  const submit = form.handleSubmit(async (values, event) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)
      ?.submitter as HTMLButtonElement | null;
    const shouldDownload = submitter?.dataset.action === "download";
    const shouldSign = submitter?.dataset.action === "sign";

    try {
      const saved = report
        ? await updateReport({ id: report.id, payload: values })
        : await createReport(values);

      if (shouldDownload) {
        downloadOnsiteReportPdf(saved.id);
      }
      // บันทึกใหม่แล้วไปเซ็นต่อ — ลายเซ็นผูกกับรายงานที่บันทึกแล้วเท่านั้น
      await router.navigate(
        shouldSign
          ? { to: "/onsite-report/$id/edit", params: { id: saved.id } }
          : { to: "/onsite-report" },
      );
    } catch {
      // error toast แสดงจาก mutation แล้ว
    }
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_min(45%,560px)] lg:items-start">
      <div className="min-w-0 space-y-5">
        <form noValidate onSubmit={submit} className="min-w-0 space-y-5">
          {form.formState.errors.root?.server ? (
            <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
              {form.formState.errors.root.server.message}
            </p>
          ) : null}

          {/* ข้อมูลเอกสาร */}
          <OnsiteReportDocumentSection
            form={form}
            companyOptions={companyOptions}
            isCompaniesLoading={isCompaniesLoading}
            onProjectCodeBlur={handleProjectCodeBlur}
          />

          {/* ข้อมูลการเข้าบริการ */}
          <OnsiteReportVisitSection form={form} />

          {/* Section 1-3 */}
          <FormSection title="1. วัตถุประสงค์การเข้าบริการ (Objective)">
            <Field error={form.formState.errors.objective?.message}>
              <textarea
                id="onsite-report-objective"
                rows={4}
                placeholder="เช่น เพื่อทดสอบ Software integration testing"
                {...form.register("objective")}
                className={cn(inputClass, "min-h-24 resize-none")}
              />
            </Field>
          </FormSection>

          <FormSection title="2. รายละเอียดงาน (Action Item)">
            <Field error={form.formState.errors.actionItem?.message}>
              <textarea
                id="onsite-report-action-item"
                rows={4}
                placeholder="ระบุสิ่งที่ทำในครั้งนี้"
                {...form.register("actionItem")}
                className={cn(inputClass, "min-h-24 resize-none")}
              />
            </Field>
          </FormSection>

          <FormSection title="3. งานคงค้าง / ข้อแนะนำเพิ่มเติม (Pending & Recommendation)">
            <Field error={form.formState.errors.pendingNote?.message}>
              <textarea
                id="onsite-report-pending-note"
                rows={3}
                placeholder="ถ้าไม่มีเว้นว่างได้"
                {...form.register("pendingNote")}
                className={cn(inputClass, "min-h-20 resize-none")}
              />
            </Field>
          </FormSection>

          {/* Section 4 — Next Action */}
          <OnsiteReportNextActionsSection form={form} />

          {/* Section 5 — Attendees */}
          <OnsiteReportAttendeesSection form={form} />

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              to="/onsite-report"
              className="focus-visible:ring-ring inline-flex h-10 items-center rounded-md px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-white/[0.06]"
            >
              ยกเลิก
            </Link>
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              data-action="download"
            >
              บันทึก & ดาวน์โหลด PDF
            </Button>
            {!report && (
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting}
                data-action="sign"
              >
                บันทึก & เซ็นเอกสาร
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกรายงาน"}
            </Button>
          </div>
        </form>

        {/* อยู่นอก <form> เพื่อไม่ให้ปุ่มเซ็น/ลบไปสั่ง submit ฟอร์ม — เซ็นได้เมื่อรายงานถูกบันทึกแล้ว */}
        {report ? (
          <OnsiteReportSignatureSection report={report} />
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs text-slate-500 dark:border-white/20 dark:text-slate-400">
            ลายเซ็น: บันทึกรายงานก่อนจึงจะเซ็นได้ — กด &quot;บันทึก &amp;
            เซ็นเอกสาร&quot; เพื่อบันทึกแล้วไปหน้าเซ็นต่อทันที
          </p>
        )}
      </div>

      <div className="lg:sticky lg:top-6">
        <OnsiteReportPreview
          values={watchedValues}
          reportId={report?.id}
          signatureVersion={report?.signatures
            .map((signature) => `${signature.party}:${signature.updatedAt}`)
            .join(",")}
        />
      </div>
    </div>
  );
};

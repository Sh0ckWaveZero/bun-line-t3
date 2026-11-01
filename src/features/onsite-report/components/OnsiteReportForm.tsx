"use client";

import { useEffect, useMemo } from "react";
import type { FocusEvent, ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SelectOption } from "@/components/ui/select";
import { PopoverDatePicker } from "@/components/ui/date-picker";
import { OnsiteReportPreview } from "./OnsiteReportPreview";
import { OnsiteReportSignatureSection } from "./OnsiteReportSignatureSection";
import {
  ONSITE_REPORT_ATTENDEE_NOTE,
  ONSITE_REPORT_MAX_ATTENDEES,
  ONSITE_REPORT_MAX_NEXT_ACTIONS,
  ONSITE_REPORT_PHASE_OPTIONS,
  ONSITE_REPORT_REVISION_OPTIONS,
  ONSITE_REPORT_TIME_OPTIONS,
  formatTimeLabel,
} from "../constants";
import {
  emptyFormValues,
  formatDateKey,
  onsiteReportFormSchema,
  parseDateKey,
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
// Sub-components & option lists
// ─────────────────────────────────────────────

const inputClass = cn(
  "w-full rounded-md border px-3 py-2",
  "border-input bg-background text-foreground",
  // text-entry fields: เปลี่ยนสีขอบตอน focus พอ ไม่ใส่ ring ให้ขอบหนาทึบ
  "focus:border-ring focus:outline-none",
);

const TIME_SELECT_OPTIONS: SelectOption[] = ONSITE_REPORT_TIME_OPTIONS.map(
  (value) => ({ value: String(value), label: formatTimeLabel(value) }),
);

const REVISION_SELECT_OPTIONS: SelectOption[] =
  ONSITE_REPORT_REVISION_OPTIONS.map((value) => ({ value, label: value }));

const PHASE_SELECT_OPTIONS: SelectOption[] = [
  { value: "", label: "-" },
  ...ONSITE_REPORT_PHASE_OPTIONS.map((value) => ({ value, label: value })),
];

interface FieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}

const Field = ({
  label,
  htmlFor,
  required = false,
  error,
  className,
  children,
}: FieldProps) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">
      {label}
      {required ? <span className="text-rose-500"> *</span> : null}
    </label>
    {children}
    {error ? (
      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
    ) : null}
  </div>
);

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

const FormSection = ({ title, children }: FormSectionProps) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
    <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
      {title}
    </h2>
    {children}
  </section>
);

const ROW_REMOVE_CLASS =
  "mt-[30px] flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none dark:hover:text-rose-300";

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

  const form = useForm<OnsiteReportFormInput, undefined, OnsiteReportFormOutput>(
    {
      resolver: zodResolver(onsiteReportFormSchema),
      defaultValues: report ? reportToFormValues(report) : emptyFormValues(),
    },
  );
  const { fields: nextActionFields, append: appendNextAction, remove: removeNextAction } =
    useFieldArray({ control: form.control, name: "nextActions" });
  const { fields: attendeeFields, append: appendAttendee, remove: removeAttendee } =
    useFieldArray({ control: form.control, name: "attendees" });

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
  const handleProjectCodeBlur = (
    event: FocusEvent<HTMLInputElement>,
  ) => {
    if (report || form.formState.dirtyFields.docNo) return;
    const suggested = suggestDocNo(
      event.currentTarget.value.trim(),
      existingDocNos,
    );
    if (suggested) form.setValue("docNo", suggested);
  };

  const submit = form.handleSubmit(async (values, event) => {
    const submitter = (
      event?.nativeEvent as SubmitEvent | undefined
    )?.submitter as HTMLButtonElement | null;
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
      <FormSection title="ข้อมูลเอกสาร">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="บริษัทผู้ออกเอกสาร"
            required
            error={form.formState.errors.company?.message}
          >
            <Controller
              control={form.control}
              name="company"
              render={({ field }) => (
                <Select
                  options={companyOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={
                    isCompaniesLoading
                      ? "กำลังโหลด..."
                      : "ยังไม่มีบริษัทที่เปิดใช้งาน"
                  }
                  disabled={isCompaniesLoading || companyOptions.length === 0}
                />
              )}
            />
            {!isCompaniesLoading && companyOptions.length === 0 ? (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                ยังไม่มีบริษัทที่เปิดใช้งาน — ให้ผู้ดูแลระบบเพิ่มบริษัทก่อน
              </p>
            ) : null}
          </Field>
          <Field
            label="Project Code"
            required
            error={form.formState.errors.projectCode?.message}
          >
            <Input
              placeholder="เช่น PRJ-ABC-24-01"
              {...form.register("projectCode", {
                onBlur: handleProjectCodeBlur,
              })}
            />
          </Field>
          <Field label="Doc No" required error={form.formState.errors.docNo?.message}>
            <Input
              placeholder="เติมอัตโนมัติจาก Project Code"
              {...form.register("docNo")}
            />
          </Field>
          <Field label="Revision">
            <Controller
              control={form.control}
              name="revision"
              render={({ field }) => (
                <Select
                  options={REVISION_SELECT_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
          </Field>
          <Field
            label="ชื่อลูกค้า / หน่วยงาน"
            required
            error={form.formState.errors.clientName?.message}
          >
            <Input
              placeholder="เช่น โรงพยาบาลตัวอย่าง"
              {...form.register("clientName")}
            />
          </Field>
          <Field
            label="Phase"
            error={form.formState.errors.phase?.message}
          >
            <Controller
              control={form.control}
              name="phase"
              render={({ field }) => (
                <Select
                  options={PHASE_SELECT_OPTIONS}
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                />
              )}
            />
          </Field>
        </div>
      </FormSection>

      {/* ข้อมูลการเข้าบริการ */}
      <FormSection title="ข้อมูลการเข้าบริการ">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="วันที่เข้าบริการ"
            required
            error={form.formState.errors.onsiteDate?.message}
          >
            <Controller
              control={form.control}
              name="onsiteDate"
              render={({ field }) => (
                <PopoverDatePicker
                  value={field.value ? (parseDateKey(field.value) ?? undefined) : undefined}
                  onChange={(date) => field.onChange(date ? formatDateKey(date) : "")}
                  placeholder="เลือกวันที่"
                />
              )}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="เวลาเริ่ม"
              error={form.formState.errors.timeStart?.message}
            >
              <Controller
                control={form.control}
                name="timeStart"
                render={({ field }) => (
                  <Select
                    options={TIME_SELECT_OPTIONS}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field label="เวลาจบ" error={form.formState.errors.timeEnd?.message}>
              <Controller
                control={form.control}
                name="timeEnd"
                render={({ field }) => (
                  <Select
                    options={TIME_SELECT_OPTIONS}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </Field>
          </div>
          <Field
            label="ผู้ประสานงานหลัก (Main Contact)"
            required
            error={form.formState.errors.mainContact?.message}
          >
            <Input
              placeholder="ชื่อฝั่งลูกค้า"
              {...form.register("mainContact")}
            />
          </Field>
          <Field
            label="ทีมที่เข้าบริการ (Execution Team)"
            required
            error={form.formState.errors.executionTeam?.message}
          >
            <Input
              placeholder="คั่นชื่อด้วย , (เช่น Alice, Bob)"
              {...form.register("executionTeam")}
            />
          </Field>
        </div>
      </FormSection>

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
      <FormSection title="4. การดำเนินการต่อไป (Next Action)">
        <div className="space-y-3">
          {nextActionFields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_1fr_1.4fr_auto]"
            >
              <Field
                label={index === 0 ? "วันที่" : undefined}
                error={form.formState.errors.nextActions?.[index]?.date?.message}
              >
                <Input
                  type="date"
                  aria-label={`วันที่แถวที่ ${index + 1}`}
                  {...form.register(`nextActions.${index}.date`)}
                />
              </Field>
              <Field
                label={index === 0 ? "Milestone" : undefined}
                error={
                  form.formState.errors.nextActions?.[index]?.milestone?.message
                }
              >
                <Input
                  aria-label={`Milestone แถวที่ ${index + 1}`}
                  {...form.register(`nextActions.${index}.milestone`)}
                />
              </Field>
              <Field
                label={index === 0 ? "รายละเอียด" : undefined}
                error={
                  form.formState.errors.nextActions?.[index]?.description
                    ?.message
                }
              >
                <Input
                  aria-label={`รายละเอียดแถวที่ ${index + 1}`}
                  {...form.register(`nextActions.${index}.description`)}
                />
              </Field>
              <button
                type="button"
                onClick={() => removeNextAction(index)}
                aria-label={`ลบแถวที่ ${index + 1}`}
                className={ROW_REMOVE_CLASS}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          {nextActionFields.length < ONSITE_REPORT_MAX_NEXT_ACTIONS ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendNextAction({ date: "", milestone: "", description: "" })
              }
            >
              <Plus aria-hidden="true" />
              เพิ่มแถว
            </Button>
          ) : null}
        </div>
      </FormSection>

      {/* Section 5 — Attendees */}
      <FormSection title="5. ผู้เข้าร่วม (Attendees)">
        <div className="space-y-3">
          {attendeeFields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.3fr_auto]"
            >
              <Field
                label={index === 0 ? "ชื่อ-นามสกุล" : undefined}
                error={form.formState.errors.attendees?.[index]?.name?.message}
              >
                <Input
                  aria-label={`ชื่อผู้เข้าร่วมคนที่ ${index + 1}`}
                  {...form.register(`attendees.${index}.name`)}
                />
              </Field>
              <Field
                label={index === 0 ? "ตำแหน่ง" : undefined}
                error={
                  form.formState.errors.attendees?.[index]?.position?.message
                }
              >
                <Input
                  aria-label={`ตำแหน่งคนที่ ${index + 1}`}
                  {...form.register(`attendees.${index}.position`)}
                />
              </Field>
              <button
                type="button"
                onClick={() => removeAttendee(index)}
                aria-label={`ลบผู้เข้าร่วมคนที่ ${index + 1}`}
                className={ROW_REMOVE_CLASS}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          {attendeeFields.length < ONSITE_REPORT_MAX_ATTENDEES ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendAttendee({ name: "", position: "" })}
            >
              <Plus aria-hidden="true" />
              เพิ่มผู้เข้าร่วม
            </Button>
          ) : null}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {ONSITE_REPORT_ATTENDEE_NOTE}
          </p>
        </div>
      </FormSection>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          to="/onsite-report"
          className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-slate-300 dark:hover:bg-white/[0.06]"
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
          ลายเซ็น: บันทึกรายงานก่อนจึงจะเซ็นได้ — กด &quot;บันทึก &amp; เซ็นเอกสาร&quot; เพื่อบันทึกแล้วไปหน้าเซ็นต่อทันที
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

"use client";

import type { FocusEvent } from "react";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SelectOption } from "@/components/ui/select";
import {
  ONSITE_REPORT_PHASE_OPTIONS,
  ONSITE_REPORT_REVISION_OPTIONS,
} from "../constants";
import { Field, FormSection } from "./OnsiteReportFormParts";
import type { OnsiteReportFormApi } from "./OnsiteReportFormParts";

const REVISION_SELECT_OPTIONS: SelectOption[] =
  ONSITE_REPORT_REVISION_OPTIONS.map((value) => ({ value, label: value }));

const PHASE_SELECT_OPTIONS: SelectOption[] = [
  { value: "", label: "-" },
  ...ONSITE_REPORT_PHASE_OPTIONS.map((value) => ({ value, label: value })),
];

interface OnsiteReportDocumentSectionProps {
  form: OnsiteReportFormApi;
  companyOptions: SelectOption[];
  isCompaniesLoading: boolean;
  onProjectCodeBlur: (event: FocusEvent<HTMLInputElement>) => void;
}

/** ข้อมูลเอกสาร: บริษัท · Project Code · Doc No · Revision · ลูกค้า · Phase */
export const OnsiteReportDocumentSection = ({
  form,
  companyOptions,
  isCompaniesLoading,
  onProjectCodeBlur,
}: OnsiteReportDocumentSectionProps) => (
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
            onBlur: onProjectCodeBlur,
          })}
        />
      </Field>
      <Field
        label="Doc No"
        required
        error={form.formState.errors.docNo?.message}
      >
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
      <Field label="Phase" error={form.formState.errors.phase?.message}>
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
);

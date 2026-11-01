"use client";

import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import type {
  OnsiteReportFormInput,
  OnsiteReportFormOutput,
} from "../lib/onsite-report-form";

/** form instance ของฟอร์มรายงาน — ส่งให้ section ย่อยแต่ละตัว */
export type OnsiteReportFormApi = UseFormReturn<
  OnsiteReportFormInput,
  undefined,
  OnsiteReportFormOutput
>;

interface FieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}

export const Field = ({
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

export const FormSection = ({ title, children }: FormSectionProps) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
    <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
      {title}
    </h2>
    {children}
  </section>
);

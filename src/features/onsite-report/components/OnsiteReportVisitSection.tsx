"use client";

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SelectOption } from "@/components/ui/select";
import { PopoverDatePicker } from "@/components/ui/date-picker";
import { ONSITE_REPORT_TIME_OPTIONS, formatTimeLabel } from "../constants";
import { formatDateKey, parseDateKey } from "../lib/onsite-report-form";
import { Field, FormSection } from "./OnsiteReportFormParts";
import type { OnsiteReportFormApi } from "./OnsiteReportFormParts";

const TIME_SELECT_OPTIONS: SelectOption[] = ONSITE_REPORT_TIME_OPTIONS.map(
  (value) => ({ value: String(value), label: formatTimeLabel(value) }),
);

/** ข้อมูลการเข้าบริการ: วันที่ · เวลาเริ่ม/จบ · ผู้ประสานงาน · ทีมที่เข้าบริการ */
export const OnsiteReportVisitSection = ({
  form,
}: {
  form: OnsiteReportFormApi;
}) => (
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
              value={
                field.value
                  ? (parseDateKey(field.value) ?? undefined)
                  : undefined
              }
              onChange={(date) =>
                field.onChange(date ? formatDateKey(date) : "")
              }
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
        <Input placeholder="ชื่อฝั่งลูกค้า" {...form.register("mainContact")} />
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
);

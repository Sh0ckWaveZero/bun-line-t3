"use client";

import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ONSITE_REPORT_ATTENDEE_NOTE,
  ONSITE_REPORT_MAX_ATTENDEES,
} from "../constants";
import { Field, FormSection } from "./OnsiteReportFormParts";
import { ROW_REMOVE_CLASS } from "../lib/form-classes";
import type { OnsiteReportFormApi } from "./OnsiteReportFormParts";

/** Section 5 — ผู้เข้าร่วม (Attendees) */
export const OnsiteReportAttendeesSection = ({
  form,
}: {
  form: OnsiteReportFormApi;
}) => {
  const {
    fields: attendeeFields,
    append: appendAttendee,
    remove: removeAttendee,
  } = useFieldArray({ control: form.control, name: "attendees" });

  return (
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
  );
};

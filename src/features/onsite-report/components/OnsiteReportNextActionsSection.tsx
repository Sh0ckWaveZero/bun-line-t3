"use client";

import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ONSITE_REPORT_MAX_NEXT_ACTIONS } from "../constants";
import { Field, FormSection } from "./OnsiteReportFormParts";
import { ROW_REMOVE_CLASS } from "../lib/form-classes";
import type { OnsiteReportFormApi } from "./OnsiteReportFormParts";

/** Section 4 — การดำเนินการต่อไป (Next Action) */
export const OnsiteReportNextActionsSection = ({
  form,
}: {
  form: OnsiteReportFormApi;
}) => {
  const {
    fields: nextActionFields,
    append: appendNextAction,
    remove: removeNextAction,
  } = useFieldArray({ control: form.control, name: "nextActions" });

  return (
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
                form.formState.errors.nextActions?.[index]?.description?.message
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
  );
};

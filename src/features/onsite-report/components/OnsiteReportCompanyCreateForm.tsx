"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCompanySchema } from "../lib/company";
import type { CreateCompanyInput } from "../lib/company";

interface OnsiteReportCompanyCreateFormProps {
  isBusy: boolean;
  onCreate: (input: CreateCompanyInput) => Promise<unknown>;
}

const LABEL_CLASS =
  "mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400";

/** ฟอร์มเพิ่มบริษัทใหม่ — code ตั้งแล้วแก้ไม่ได้ (รายงานอ้างอิงด้วยค่านี้) โลโก้อัปโหลดหลังสร้าง */
export const OnsiteReportCompanyCreateForm = ({
  isBusy,
  onCreate,
}: OnsiteReportCompanyCreateFormProps) => {
  const id = useId();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = createCompanySchema.safeParse({ code, name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      return;
    }
    setError(null);
    try {
      await onCreate(parsed.data);
      setCode("");
      setName("");
    } catch {
      // toast แจ้งใน mutation แล้ว (เช่น code ซ้ำ) — คงค่าที่กรอกไว้ให้แก้ได้
    }
  };

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
    >
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
        เพิ่มบริษัท
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <div>
          <label htmlFor={`${id}-code`} className={LABEL_CLASS}>
            Code (แก้ไม่ได้หลังสร้าง)
          </label>
          <Input
            id={`${id}-code`}
            value={code}
            maxLength={32}
            placeholder="เช่น ACME"
            disabled={isBusy}
            className="font-mono uppercase"
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />
        </div>
        <div>
          <label htmlFor={`${id}-name`} className={LABEL_CLASS}>
            ชื่อบริษัท
          </label>
          <Input
            id={`${id}-name`}
            value={name}
            maxLength={120}
            placeholder="เช่น บริษัท เอซีเอ็มอี จำกัด"
            disabled={isBusy}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={isBusy}>
          <Plus aria-hidden="true" />
          เพิ่มบริษัท
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-2 text-xs text-rose-600 dark:text-rose-400"
        >
          {error}
        </p>
      )}
    </form>
  );
};

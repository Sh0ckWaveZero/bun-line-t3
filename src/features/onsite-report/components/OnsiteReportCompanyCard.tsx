"use client";

import { useId, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertDialogBox } from "@/components/ui/AlertDialog";
import { updateCompanySchema } from "../lib/company";
import { OnsiteReportCompanyLogoPanel } from "./OnsiteReportCompanyLogoPanel";
import type { UpdateCompanyInput } from "../lib/company";
import type { OnsiteReportCompany } from "../types";

interface OnsiteReportCompanyCardProps {
  company: OnsiteReportCompany;
  isBusy: boolean;
  onUpdate: (input: UpdateCompanyInput) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  onUploadLogo: (file: File) => Promise<unknown>;
  onDeleteLogo: () => Promise<unknown>;
}

const LABEL_CLASS =
  "mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400";

/** การ์ดจัดการ 1 บริษัท: ชื่อ/ลำดับ/เปิด-ปิดใช้งาน + โลโก้ + ลบ (ลบได้เมื่อไม่มีรายงานอ้างอิง) */
export const OnsiteReportCompanyCard = ({
  company,
  isBusy,
  onUpdate,
  onDelete,
  onUploadLogo,
  onDeleteLogo,
}: OnsiteReportCompanyCardProps) => {
  const id = useId();
  const [name, setName] = useState(company.name);
  const [sortOrder, setSortOrder] = useState(String(company.sortOrder));
  const [formError, setFormError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isDirty =
    name !== company.name || sortOrder !== String(company.sortOrder);

  const handleSave = async () => {
    const parsed = updateCompanySchema.safeParse({
      name,
      sortOrder: Number(sortOrder),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      return;
    }
    setFormError(null);
    try {
      await onUpdate(parsed.data);
    } catch {
      // toast แจ้งใน mutation แล้ว
    }
  };

  const handleToggleActive = async (isActive: boolean) => {
    try {
      await onUpdate({ isActive });
    } catch {
      // toast แจ้งใน mutation แล้ว
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await onDelete();
      setIsDeleteOpen(false);
    } catch {
      // 409 (มีรายงานใช้อยู่) แจ้งผ่าน toast แล้ว — ปิด dialog เพื่อให้ปิดใช้งานแทนได้
      setIsDeleteOpen(false);
    }
  };

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id={`${id}-title`}
            className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50"
          >
            {company.name}
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            {company.code}
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          {company.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
          <Switch
            checked={company.isActive}
            disabled={isBusy}
            onCheckedChange={(value) => void handleToggleActive(value)}
            aria-label={`เปิด/ปิดใช้งาน ${company.name}`}
          />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_5.5rem] gap-3">
        <div>
          <label htmlFor={`${id}-name`} className={LABEL_CLASS}>
            ชื่อบริษัท (ขึ้นหัว PDF และช่องเซ็น)
          </label>
          <Input
            id={`${id}-name`}
            value={name}
            maxLength={120}
            disabled={isBusy}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${id}-order`} className={LABEL_CLASS}>
            ลำดับ
          </label>
          <Input
            id={`${id}-order`}
            type="number"
            min={0}
            max={9999}
            value={sortOrder}
            disabled={isBusy}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </div>
      </div>
      {formError && (
        <p
          role="alert"
          className="mt-1 text-xs text-rose-600 dark:text-rose-400"
        >
          {formError}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          disabled={!isDirty || isBusy}
          onClick={() => void handleSave()}
        >
          บันทึก
        </Button>
        {isDirty && (
          <button
            type="button"
            className="cursor-pointer text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            onClick={() => {
              setName(company.name);
              setSortOrder(String(company.sortOrder));
              setFormError(null);
            }}
          >
            ยกเลิกการแก้ไข
          </button>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/[0.08]">
        <h3 className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
          โลโก้
        </h3>
        <OnsiteReportCompanyLogoPanel
          company={company}
          isBusy={isBusy}
          onUpload={onUploadLogo}
          onDelete={onDeleteLogo}
        />
      </div>

      <div className="mt-5 flex justify-end border-t border-slate-100 pt-3 dark:border-white/[0.08]">
        <Button
          variant="ghost"
          size="sm"
          className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
          disabled={isBusy}
          onClick={() => setIsDeleteOpen(true)}
        >
          <Trash2 aria-hidden="true" />
          ลบบริษัท
        </Button>
      </div>

      <AlertDialogBox
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={`ลบ ${company.name}?`}
        description="ลบได้เฉพาะบริษัทที่ยังไม่มีรายงานอ้างอิง ถ้ามีรายงานใช้อยู่ให้ปิดใช้งานแทน"
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(false)}
            disabled={isBusy}
          >
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void handleConfirmDelete()}
            disabled={isBusy}
          >
            ลบบริษัท
          </Button>
        </div>
      </AlertDialogBox>
    </section>
  );
};

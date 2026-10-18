"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { useToast } from "@/components/common/ToastProvider";
import type { ScaleProfileDto } from "@/features/body-weight/types";
import type { SaveProfileInput } from "@/features/body-weight/hooks/useBodyWeight";

interface ProfileEditorProps {
  profiles: ScaleProfileDto[];
  isSaving: boolean;
  onSave: (
    input: SaveProfileInput,
    callbacks?: {
      onSuccess?: (profile: ScaleProfileDto) => void;
      onError?: (message: string) => void;
    },
  ) => void;
}

const inputClassName =
  "bg-muted border-border text-foreground w-full rounded border px-2 py-1.5 font-mono text-xs outline-none focus:border-ring";

const parseOptionalNumber = (
  value: string,
  min: number,
  max: number,
): { value: number | null; error: string | null } => {
  const trimmed = value.trim();
  if (trimmed === "") return { value: null, error: null };
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return { value: null, error: `ต้องเป็นตัวเลข ${min}–${max}` };
  }
  return { value: parsed, error: null };
};

const BLANK_PROFILE: ScaleProfileDto = {
  id: "",
  name: "",
  heightCm: null,
  birthDate: null,
  male: true,
  refWeightKg: null,
  upstreamName: null,
};

/** แถวโปรไฟล์หนึ่งรายการ — แก้ข้อมูลแล้วบันทึก (metrics ทั้งประวัติจะถูกคำนวณใหม่) */
const ProfileRow = ({
  profile,
  isSaving,
  onSave,
}: {
  profile: ScaleProfileDto;
  isSaving: boolean;
  onSave: ProfileEditorProps["onSave"];
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState(profile.name);
  const [heightCm, setHeightCm] = useState(
    profile.heightCm === null ? "" : String(profile.heightCm),
  );
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [refWeightKg, setRefWeightKg] = useState(
    profile.refWeightKg === null ? "" : String(profile.refWeightKg),
  );
  const [male, setMale] = useState(profile.male);
  const isNew = profile.id === "";

  const isDirty =
    isNew ||
    name !== profile.name ||
    heightCm !== (profile.heightCm === null ? "" : String(profile.heightCm)) ||
    birthDate !== (profile.birthDate ?? "") ||
    refWeightKg !==
      (profile.refWeightKg === null ? "" : String(profile.refWeightKg)) ||
    male !== profile.male;

  const handleSave = () => {
    const height = parseOptionalNumber(heightCm, 50, 260);
    if (height.error) {
      showToast({ title: `ส่วนสูง${height.error} (ซม.)`, type: "error" });
      return;
    }
    const refWeight = parseOptionalNumber(refWeightKg, 1, 300);
    if (refWeight.error) {
      showToast({
        title: `น้ำหนักอ้างอิง${refWeight.error} (กก.)`,
        type: "error",
      });
      return;
    }
    onSave(
      {
        id: isNew ? undefined : profile.id,
        name: name.trim() || profile.name.trim(),
        heightCm: height.value,
        birthDate: birthDate === "" ? null : birthDate,
        male,
        refWeightKg: refWeight.value,
      },
      {
        onSuccess: () =>
          showToast({
            title: isNew ? "สร้างโปรไฟล์สำเร็จ" : "บันทึกโปรไฟล์สำเร็จ",
            description: "คำนวณสัดส่วนร่างกายใหม่ทั้งประวัติแล้ว",
            type: "success",
          }),
        onError: (message) => showToast({ title: message, type: "error" }),
      },
    );
  };

  return (
    <div className="border-border space-y-3 border-b p-4 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-foreground text-background rounded-sm px-1.5 py-0.5 font-mono text-[10px]">
            {isNew ? "ใหม่" : profile.upstreamName ? "AUTO" : "MANUAL"}
          </span>
          <input
            aria-label="ชื่อโปรไฟล์"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="ชื่อ"
            className="text-foreground placeholder:text-muted-foreground/60 w-40 bg-transparent text-sm font-semibold outline-none sm:w-52"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isDirty || name.trim() === ""}
          className="border-border bg-card text-foreground hover:bg-muted flex cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1.5 font-mono text-xs transition-colors disabled:cursor-default disabled:opacity-40"
        >
          <Save className="h-3 w-3" />
          <span className="hidden sm:inline">บันทึก</span>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <label className="space-y-1">
          <span className="text-muted-foreground block font-mono text-[10px]">
            ส่วนสูง (ซม.)
          </span>
          <input
            aria-label="ส่วนสูง (ซม.)"
            inputMode="decimal"
            value={heightCm}
            onChange={(event) => setHeightCm(event.target.value)}
            placeholder="เช่น 172"
            className={inputClassName}
          />
        </label>
        <label className="space-y-1">
          <span className="text-muted-foreground block font-mono text-[10px]">
            วันเกิด
          </span>
          <input
            aria-label="วันเกิด"
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="space-y-1">
          <span className="text-muted-foreground block font-mono text-[10px]">
            น้ำหนักอ้างอิง (กก.)
          </span>
          <input
            aria-label="น้ำหนักอ้างอิง (กก.)"
            inputMode="decimal"
            value={refWeightKg}
            onChange={(event) => setRefWeightKg(event.target.value)}
            placeholder="ช่วยจับคู่เจ้าของ"
            className={inputClassName}
          />
        </label>
        <div className="space-y-1">
          <span className="text-muted-foreground block font-mono text-[10px]">
            เพศ
          </span>
          <div className="border-border bg-muted flex overflow-hidden rounded border">
            {[
              { label: "ชาย", value: true },
              { label: "หญิง", value: false },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setMale(option.value)}
                className={`flex-1 cursor-pointer px-2 py-1.5 font-mono text-xs transition-colors ${
                  male === option.value
                    ? "bg-foreground text-background"
                    : "text-foreground hover:bg-border/50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground block font-mono text-[10px]">
            จับคู่
          </span>
          <p className="text-muted-foreground py-1.5 font-mono text-[11px]">
            {isNew
              ? "บันทึกเพื่อเริ่มใช้งาน"
              : profile.upstreamName
                ? `อัตโนมัติ "${profile.upstreamName}"`
                : "จากน้ำหนักล่าสุด"}
          </p>
        </div>
      </div>
    </div>
  );
};

export function ProfileEditor({
  profiles,
  isSaving,
  onSave,
}: ProfileEditorProps) {
  const [draftCount, setDraftCount] = useState(0);

  return (
    <div className="bg-card border-border rounded-lg border">
      <div className="flex items-center justify-between gap-2 p-4 pb-0">
        <p className="text-muted-foreground font-mono text-[11px]">
          ระบบเดาเจ้าของจากน้ำหนักล่าสุด/น้ำหนักอ้างอิง (ผิดพลาดแก้ได้ในประวัติ)
        </p>
        <button
          type="button"
          onClick={() => setDraftCount((count) => count + 1)}
          className="border-border bg-card text-foreground hover:bg-muted flex shrink-0 cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1.5 font-mono text-xs transition-colors"
        >
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">เพิ่มโปรไฟล์</span>
        </button>
      </div>
      {profiles.length === 0 && draftCount === 0 ? (
        <p className="text-muted-foreground p-6 pt-4 text-center text-sm">
          ยังไม่มีโปรไฟล์ — กด “เพิ่มโปรไฟล์” เพื่อเริ่มบันทึก
        </p>
      ) : (
        <>
          {profiles.map((profile) => (
            <ProfileRow
              key={profile.id}
              profile={profile}
              isSaving={isSaving}
              onSave={onSave}
            />
          ))}
          {Array.from({ length: draftCount }, (_, index) => (
            <ProfileRow
              key={`draft-${index}`}
              profile={BLANK_PROFILE}
              isSaving={isSaving}
              onSave={onSave}
            />
          ))}
        </>
      )}
    </div>
  );
}

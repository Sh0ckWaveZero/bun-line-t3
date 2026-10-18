"use client";

import { useState } from "react";
import { Save } from "lucide-react";
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

/** แถวโปรไฟล์หนึ่งรายการ — แก้ส่วนสูง/วันเกิด/เพศ แล้วบันทึก (metrics ทั้งประวัติจะถูกคำนวณใหม่) */
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
  const [male, setMale] = useState(profile.male);

  const isDirty =
    name !== profile.name ||
    heightCm !== (profile.heightCm === null ? "" : String(profile.heightCm)) ||
    birthDate !== (profile.birthDate ?? "") ||
    male !== profile.male;

  const handleSave = () => {
    const trimmedHeight = heightCm.trim();
    let parsedHeight: number | null = null;
    if (trimmedHeight !== "") {
      parsedHeight = Number(trimmedHeight);
      if (
        !Number.isFinite(parsedHeight) ||
        parsedHeight < 50 ||
        parsedHeight > 260
      ) {
        showToast({ title: "ส่วนสูงต้องเป็นตัวเลข 50–260 ซม.", type: "error" });
        return;
      }
    }
    onSave(
      {
        id: profile.id,
        name: name.trim() || profile.name,
        heightCm: parsedHeight,
        birthDate: birthDate === "" ? null : birthDate,
        male,
      },
      {
        onSuccess: () =>
          showToast({
            title: "บันทึกโปรไฟล์สำเร็จ",
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
            {profile.upstreamName ? "AUTO" : "MANUAL"}
          </span>
          <input
            aria-label="ชื่อโปรไฟล์"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="text-foreground w-40 bg-transparent text-sm font-semibold outline-none sm:w-52"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="border-border bg-card text-foreground hover:bg-muted flex cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1.5 font-mono text-xs transition-colors disabled:cursor-default disabled:opacity-40"
        >
          <Save className="h-3 w-3" />
          <span className="hidden sm:inline">บันทึก</span>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            อัปเดตล่าสุด
          </span>
          <p className="text-muted-foreground py-1.5 font-mono text-[11px]">
            {profile.upstreamName
              ? `จับคู่กับ "${profile.upstreamName}"`
              : "สร้างเองในหน้าเว็บ"}
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
  return (
    <div className="bg-card border-border rounded-lg border">
      {profiles.length === 0 ? (
        <p className="text-muted-foreground p-6 text-center text-sm">
          ยังไม่มีโปรไฟล์ —
          โปรไฟล์จะถูกสร้างให้อัตโนมัติเมื่อตาชั่งส่งข้อมูลเข้ามา
        </p>
      ) : (
        profiles.map((profile) => (
          <ProfileRow
            key={profile.id}
            profile={profile}
            isSaving={isSaving}
            onSave={onSave}
          />
        ))
      )}
    </div>
  );
}

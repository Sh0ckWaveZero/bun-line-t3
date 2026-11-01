"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { useToast } from "@/components/common/ToastProvider";
import { Select } from "@/components/ui/select";
import type {
  ScaleOwnerOption,
  ScaleProfileDto,
} from "@/features/body-weight/types";
import type { SaveProfileInput } from "@/features/body-weight/hooks/useBodyWeight";

interface ProfileEditorProps {
  profiles: ScaleProfileDto[];
  owners: ScaleOwnerOption[];
  isAdmin: boolean;
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
  "bg-muted border-border text-foreground w-full rounded border px-2 py-1.5 font-mono text-xs outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/60";

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
  ownerId: null,
  ownerName: null,
};

const NO_OWNER = "__none__";

/** ค่า draft ที่แถวโปรไฟล์แก้ได้ — แยกไว้ให้ helper ตรวจ dirty/สร้าง payload ใช้ร่วมกัน */
interface ProfileRowDraft {
  name: string;
  heightCm: string;
  birthDate: string;
  refWeightKg: string;
  male: boolean;
  ownerId: string;
}

const getProfileBadgeLabel = (profile: ScaleProfileDto): string =>
  profile.id === "" ? "ใหม่" : profile.upstreamName ? "AUTO" : "MANUAL";

const getProfileMatchHint = (profile: ScaleProfileDto): string =>
  profile.id === ""
    ? "บันทึกเพื่อเริ่มใช้งาน"
    : profile.upstreamName
      ? `อัตโนมัติ "${profile.upstreamName}"`
      : "จากน้ำหนักล่าสุด";

const isProfileRowDirty = (
  profile: ScaleProfileDto,
  draft: ProfileRowDraft,
  isAdmin: boolean,
): boolean =>
  profile.id === "" ||
  draft.name !== profile.name ||
  draft.heightCm !==
    (profile.heightCm === null ? "" : String(profile.heightCm)) ||
  draft.birthDate !== (profile.birthDate ?? "") ||
  draft.refWeightKg !==
    (profile.refWeightKg === null ? "" : String(profile.refWeightKg)) ||
  draft.male !== profile.male ||
  (isAdmin && draft.ownerId !== (profile.ownerId ?? NO_OWNER));

/** ownerId ที่จะส่งตอนบันทึก — admin เท่านั้นที่มีผล; undefined = ไม่เปลี่ยน */
const getOwnerIdForSave = (
  isAdmin: boolean,
  isNew: boolean,
  ownerId: string,
): string | null | undefined =>
  isAdmin && (!isNew || ownerId !== NO_OWNER)
    ? ownerId === NO_OWNER
      ? null
      : ownerId
    : undefined;

const buildProfileSaveInput = (
  profile: ScaleProfileDto,
  draft: ProfileRowDraft,
  isAdmin: boolean,
  heightCm: number | null,
  refWeightKg: number | null,
): SaveProfileInput => {
  const isNew = profile.id === "";
  const ownerIdForSave = getOwnerIdForSave(isAdmin, isNew, draft.ownerId);

  return {
    id: isNew ? undefined : profile.id,
    name: draft.name.trim() || profile.name.trim(),
    heightCm,
    birthDate: draft.birthDate === "" ? null : draft.birthDate,
    male: draft.male,
    refWeightKg,
    ...(ownerIdForSave === undefined ? {} : { ownerId: ownerIdForSave }),
  };
};

/** ปุ่มเลือกเพศ — กลุ่มปุ่ม 2 ทางที่ไฮไลต์ค่าที่เลือก */
const ProfileGenderToggle = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (male: boolean) => void;
}) => (
  <div className="space-y-1">
    <span className="text-muted-foreground block font-mono text-[10px]">
      เพศ
    </span>
    <div
      role="group"
      aria-label="เพศ"
      className="border-border bg-muted flex overflow-hidden rounded border"
    >
      {[
        { label: "ชาย", value: true },
        { label: "หญิง", value: false },
      ].map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 cursor-pointer px-2 py-1.5 font-mono text-xs transition-colors ${
            value === option.value
              ? "bg-foreground text-background"
              : "text-foreground hover:bg-border/50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

/** ผู้ดูแลกำหนดเจ้าของโปรไฟล์ (LINE) — admin เท่านั้น */
const ProfileOwnerSelect = ({
  profileId,
  ownerId,
  owners,
  isSaving,
  onChange,
}: {
  profileId: string;
  ownerId: string;
  owners: ScaleOwnerOption[];
  isSaving: boolean;
  onChange: (ownerId: string) => void;
}) => (
  <div className="space-y-1">
    <label
      htmlFor={`owner-${profileId || "new"}`}
      className="text-muted-foreground block font-mono text-[10px]"
    >
      เจ้าของ (LINE)
    </label>
    <Select
      id={`owner-${profileId || "new"}`}
      value={ownerId}
      options={[
        { value: NO_OWNER, label: "ยังไม่กำหนด" },
        ...owners.map((owner) => ({
          value: owner.id,
          label: owner.name,
        })),
      ]}
      disabled={isSaving}
      className="h-8 text-xs"
      onValueChange={onChange}
    />
  </div>
);

/** แถวโปรไฟล์หนึ่งรายการ — แก้ข้อมูลแล้วบันทึก (metrics ทั้งประวัติจะถูกคำนวณใหม่) */
const ProfileRow = ({
  profile,
  owners,
  isAdmin,
  isSaving,
  onSave,
}: {
  profile: ScaleProfileDto;
  owners: ScaleOwnerOption[];
  isAdmin: boolean;
  isSaving: boolean;
  onSave: ProfileEditorProps["onSave"];
}) => {
  const { showToast } = useToast();
  // derive จาก prop + override เมื่อผู้ใช้แก้เอง — prop ใหม่ไหลเข้าเสมอ ไม่ค้างค่าเก่า
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const name = nameOverride ?? profile.name;
  const [heightCm, setHeightCm] = useState(
    profile.heightCm === null ? "" : String(profile.heightCm),
  );
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [refWeightKg, setRefWeightKg] = useState(
    profile.refWeightKg === null ? "" : String(profile.refWeightKg),
  );
  const [maleOverride, setMaleOverride] = useState<boolean | null>(null);
  const male = maleOverride ?? profile.male;
  const [ownerId, setOwnerId] = useState(profile.ownerId ?? NO_OWNER);

  const draft: ProfileRowDraft = {
    name,
    heightCm,
    birthDate,
    refWeightKg,
    male,
    ownerId,
  };
  const isNew = profile.id === "";
  const isDirty = isProfileRowDirty(profile, draft, isAdmin);

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
      buildProfileSaveInput(
        profile,
        draft,
        isAdmin,
        height.value,
        refWeight.value,
      ),
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
            {getProfileBadgeLabel(profile)}
          </span>
          <input
            aria-label="ชื่อโปรไฟล์"
            value={name}
            onChange={(event) => setNameOverride(event.target.value)}
            placeholder="ชื่อ"
            className="text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/60 w-40 rounded bg-transparent px-1 text-sm font-semibold outline-none focus-visible:ring-2 sm:w-52"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isDirty || name.trim() === ""}
          aria-label={`บันทึกโปรไฟล์${name.trim() ? ` ${name.trim()}` : "ใหม่"}`}
          className="border-border bg-card text-foreground hover:bg-muted flex min-h-8 cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1.5 font-mono text-xs transition-colors disabled:cursor-default disabled:opacity-40"
        >
          <Save className="h-3 w-3" aria-hidden="true" />
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
        <ProfileGenderToggle value={male} onChange={setMaleOverride} />
        {isAdmin && (
          <ProfileOwnerSelect
            profileId={profile.id}
            ownerId={ownerId}
            owners={owners}
            isSaving={isSaving}
            onChange={setOwnerId}
          />
        )}
        <div className="space-y-1">
          <span className="text-muted-foreground block font-mono text-[10px]">
            จับคู่
          </span>
          <p className="text-muted-foreground py-1.5 font-mono text-[11px]">
            {getProfileMatchHint(profile)}
          </p>
        </div>
      </div>
    </div>
  );
};

export function ProfileEditor({
  profiles,
  owners,
  isAdmin,
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
          aria-label="เพิ่มโปรไฟล์"
          className="border-border bg-card text-foreground hover:bg-muted flex min-h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1.5 font-mono text-xs transition-colors"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
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
              owners={owners}
              isAdmin={isAdmin}
              isSaving={isSaving}
              onSave={onSave}
            />
          ))}
          {Array.from({ length: draftCount }, (_, index) => (
            <ProfileRow
              key={`draft-${index}`}
              profile={BLANK_PROFILE}
              owners={owners}
              isAdmin={isAdmin}
              isSaving={isSaving}
              onSave={onSave}
            />
          ))}
        </>
      )}
    </div>
  );
}

"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ScaleProfileDto } from "@/features/body-weight/types";

/** chip เลือกคน (แบบ chip โปรไฟล์ด้านบนของ miscale-dashboard) */
export function ProfileSwitcher({
  profiles,
  selectedId,
  onSelect,
}: {
  profiles: ScaleProfileDto[];
  selectedId: string | null;
  onSelect: (profileId: string) => void;
}) {
  if (profiles.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="เลือกคน"
      className="flex flex-wrap items-center gap-2"
    >
      {profiles.map((profile) => {
        const isSelected = profile.id === selectedId;
        return (
          <button
            key={profile.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(profile.id)}
            className={`flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 text-sm font-medium transition-colors ${
              isSelected
                ? "border-(--brand) bg-(--brand)/15 text-foreground font-medium"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <Avatar className="size-7">
              <AvatarFallback className="bg-(--brand)/25 text-foreground text-xs font-semibold">
                {profile.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {profile.name}
          </button>
        );
      })}
    </div>
  );
}
